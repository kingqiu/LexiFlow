"""
LexiFlow - FastAPI Main Application
REST API for word-to-speech generation with ListenHub integration.
"""
import os
import socket
import tempfile
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from services.listenhub import listenhub_service, DEFAULT_SPEAKER_ID, DEFAULT_SPEAKER_NAME
from services.audio_processor import audio_processor, AUDIO_DIR
from services.history import history_service
from services.wordbook import wordbook_service
from services.share import share_service
from services.invite_code import invite_code_manager
from utils.text_parser import parse_word_list, validate_word_list

load_dotenv()

app = FastAPI(
    title="LexiFlow API",
    description="Word-to-speech generation service with ListenHub integration",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# === Pydantic Models ===

class GenerateRequest(BaseModel):
    text: str
    speaker_id: str = DEFAULT_SPEAKER_ID
    speaker_name: str = DEFAULT_SPEAKER_NAME
    repeat_count: int = 1
    interval_seconds: float = 3.0
    confirmed: bool = False  # User confirmed large file warning
    invite_code: str  # Required invite code


class GenerateResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    audio_filename: Optional[str] = None
    word_count: int = 0
    success_count: int = 0
    failed_count: int = 0
    failed_words: List[str] = []
    words: List[str] = []
    message: str = ""


class ParseResponse(BaseModel):
    words: List[str]
    word_count: int
    language: str
    is_large: bool
    warning: Optional[str] = None


class WordBookCreate(BaseModel):
    name: str
    words: List[str] = []
    description: str = ""


class WordBookUpdate(BaseModel):
    name: Optional[str] = None
    words: Optional[List[str]] = None
    description: Optional[str] = None


class WordBookWordsAction(BaseModel):
    action: str  # "add" or "remove"
    words: List[str]


class ShareCreate(BaseModel):
    audio_filename: str
    words: List[str] = []
    speaker_name: str = ""
    repeat_count: int = 1
    interval_seconds: float = 3.0


# === API Endpoints ===

@app.post("/api/validate-invite-code")
async def validate_invite_code(code: str = Form(...)):
    """Validate an invite code and return remaining quota"""
    is_valid, error_msg = invite_code_manager.validate_code(code)

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    remaining = invite_code_manager.get_remaining_quota(code)
    return {
        "valid": True,
        "remaining_quota": remaining,
        "daily_limit": 50
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "LexiFlow API"}


@app.get("/api/speakers")
async def get_speakers(language: Optional[str] = None):
    """
    Get available speakers from ListenHub.
    
    Query params:
        language: Optional filter (zh/en/ja)
    """
    speakers = await listenhub_service.get_speakers(language)
    
    # If API fails, return some default speakers
    if not speakers:
        speakers = [
            {"id": "keke-1", "name": "克克-1", "language": "zh", "gender": "male"},
            {"id": "CN-Man-Beijing-V2", "name": "原野", "language": "zh", "gender": "male"},
            {"id": "chat-girl-105-cn", "name": "晓曼", "language": "zh", "gender": "female"},
        ]
    
    return {"speakers": speakers, "default": DEFAULT_SPEAKER_ID}


@app.post("/api/parse")
async def parse_text(text: str = Form(...)):
    """
    Parse and validate word list from text input.
    
    Returns word list, count, language, and any warnings.
    """
    words, language = parse_word_list(text)
    validation = validate_word_list(words)
    
    return ParseResponse(
        words=words,
        word_count=validation["word_count"],
        language=language,
        is_large=validation["is_large"],
        warning=validation["warning"]
    )


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and parse a document file (TXT/MD).
    
    Returns the parsed content for editing.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in [".txt", ".md"]:
        raise HTTPException(
            status_code=400, 
            detail="Only .txt and .md files are supported"
        )
    
    # Read file content
    try:
        content = await file.read()
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("gbk")
        except:
            raise HTTPException(
                status_code=400, 
                detail="Unable to decode file. Please use UTF-8 encoding."
            )
    
    # Parse the content
    words, language = parse_word_list(text)
    validation = validate_word_list(words)
    
    return {
        "raw_content": text,
        "words": words,
        "word_count": validation["word_count"],
        "language": language,
        "is_large": validation["is_large"],
        "is_empty": validation["is_empty"],
        "warning": validation["warning"]
    }


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_speech(request: GenerateRequest):
    """
    Generate speech for word list.

    This is the main endpoint that:
    1. Validates invite code and checks quota
    2. Parses the word list
    3. Generates speech for each word via ListenHub
    4. Concatenates audio with repeat and interval settings
    5. Records usage and saves to history
    """
    # Validate invite code
    is_valid, error_msg = invite_code_manager.validate_code(request.invite_code)
    if not is_valid:
        raise HTTPException(status_code=403, detail=error_msg)

    # Parse words
    words, language = parse_word_list(request.text)
    validation = validate_word_list(words)

    if validation["is_empty"]:
        return GenerateResponse(
            success=False,
            message="请输入至少一个单词或词语"
        )

    # Check remaining quota
    remaining = invite_code_manager.get_remaining_quota(request.invite_code)
    if len(words) > remaining:
        raise HTTPException(
            status_code=403,
            detail=f"今日剩余额度不足。剩余：{remaining}个单词，需要：{len(words)}个单词"
        )

    # Check for large file warning
    if validation["is_large"] and not request.confirmed:
        return GenerateResponse(
            success=False,
            word_count=validation["word_count"],
            message="CONFIRM_REQUIRED"
        )
    
    # Generate speech for each word
    results = await listenhub_service.generate_batch_speech(
        texts=words,
        speaker_id=request.speaker_id
    )
    
    # Download audio files to temp directory
    temp_audio_files = []
    success_count = 0
    failed_count = 0
    failed_words = []
    
    with tempfile.TemporaryDirectory() as temp_dir:
        for i, result in enumerate(results):
            if result["success"] and result.get("audio_url"):
                temp_path = os.path.join(temp_dir, f"word_{i}.mp3")
                downloaded = await listenhub_service.download_audio(
                    result["audio_url"], 
                    temp_path
                )
                if downloaded:
                    temp_audio_files.append(temp_path)
                    success_count += 1
                else:
                    failed_count += 1
                    failed_words.append(result.get("text", f"word_{i}"))
            else:
                failed_count += 1
                failed_words.append(result.get("text", f"word_{i}"))
        
        if not temp_audio_files:
            return GenerateResponse(
                success=False,
                word_count=len(words),
                failed_count=failed_count,
                failed_words=failed_words,
                message="所有单词语音生成失败，请检查网络或稍后重试"
            )
        
        # Concatenate audio files
        output_path = audio_processor.generate_output_filename()
        final_audio = audio_processor.concatenate_audio_files(
            audio_files=temp_audio_files,
            output_path=output_path,
            repeat_count=request.repeat_count,
            interval_seconds=request.interval_seconds
        )
        
        if not final_audio:
            return GenerateResponse(
                success=False,
                message="音频拼接失败，请确保已安装 FFmpeg"
            )
    
    # Get just the filename for the response
    audio_filename = os.path.basename(final_audio)

    # Record invite code usage
    invite_code_manager.record_usage(request.invite_code, len(words))

    # Save to history
    history_service.add_record(
        words=words,
        speaker_id=request.speaker_id,
        speaker_name=request.speaker_name,
        repeat_count=request.repeat_count,
        interval_seconds=request.interval_seconds,
        audio_filename=audio_filename,
        success_count=success_count,
        failed_count=failed_count,
        failed_words=failed_words,
        invite_code=request.invite_code
    )
    
    return GenerateResponse(
        success=True,
        audio_url=f"/api/audio/{audio_filename}",
        audio_filename=audio_filename,
        word_count=len(words),
        success_count=success_count,
        failed_count=failed_count,
        failed_words=failed_words,
        words=words,
        message=f"成功生成 {success_count}/{len(words)} 个单词的语音"
    )


@app.get("/api/audio/{filename}")
async def get_audio(filename: str, download: int = 0):
    """Serve generated audio file. Use ?download=1 to force download."""
    file_path = AUDIO_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    disposition = "attachment" if download else "inline"
    
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=filename,
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )


@app.get("/api/history")
async def get_history(limit: int = 20, invite_code: str = ""):
    """Get generation history."""
    records = history_service.get_records(limit, invite_code=invite_code)
    return {"records": records}


@app.delete("/api/history/{record_id}")
async def delete_history_record(record_id: str, invite_code: str = ""):
    """Delete a history record."""
    success = history_service.delete_record(record_id, invite_code=invite_code)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"success": True}


# === Word Book Endpoints ===

@app.post("/api/wordbooks")
async def create_wordbook(request: WordBookCreate):
    """Create a new word book."""
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="单词本名称不能为空")
    book = wordbook_service.create_book(
        name=request.name.strip(),
        words=request.words,
        description=request.description
    )
    return book


@app.get("/api/wordbooks")
async def get_wordbooks():
    """Get all word books."""
    books = wordbook_service.get_books()
    return {"books": books}


@app.get("/api/wordbooks/{book_id}")
async def get_wordbook(book_id: str):
    """Get a specific word book."""
    book = wordbook_service.get_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="单词本未找到")
    return book


@app.put("/api/wordbooks/{book_id}")
async def update_wordbook(book_id: str, request: WordBookUpdate):
    """Update a word book."""
    book = wordbook_service.update_book(
        book_id=book_id,
        name=request.name,
        words=request.words,
        description=request.description
    )
    if not book:
        raise HTTPException(status_code=404, detail="单词本未找到")
    return book


@app.delete("/api/wordbooks/{book_id}")
async def delete_wordbook(book_id: str):
    """Delete a word book."""
    success = wordbook_service.delete_book(book_id)
    if not success:
        raise HTTPException(status_code=404, detail="单词本未找到")
    return {"success": True}


@app.post("/api/wordbooks/{book_id}/words")
async def modify_wordbook_words(book_id: str, request: WordBookWordsAction):
    """Add or remove words from a word book."""
    if request.action == "add":
        book = wordbook_service.add_words(book_id, request.words)
    elif request.action == "remove":
        book = wordbook_service.remove_words(book_id, request.words)
    else:
        raise HTTPException(status_code=400, detail="action 必须为 'add' 或 'remove'")
    
    if not book:
        raise HTTPException(status_code=404, detail="单词本未找到")
    return book


# === Share Endpoints ===

# Template directory
TEMPLATE_DIR = Path(__file__).parent / "templates"


def _get_lan_ip() -> str:
    """Get the machine's LAN IP address for shareable URLs."""
    try:
        # UDP connect trick — doesn't actually send data, just resolves local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

@app.post("/api/share")
async def create_share(request: ShareCreate, req: Request):
    """Create a shareable link for audio."""
    # Verify the audio file exists
    file_path = AUDIO_DIR / request.audio_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="音频文件不存在")

    share = share_service.create_share(
        audio_filename=request.audio_filename,
        words=request.words,
        speaker_name=request.speaker_name,
        repeat_count=request.repeat_count,
        interval_seconds=request.interval_seconds,
    )

    # Build share URL — replace localhost with LAN IP for mobile access
    base_url = str(req.base_url).rstrip("/")
    parsed = urlparse(base_url)
    if parsed.hostname in ("localhost", "127.0.0.1"):
        lan_ip = _get_lan_ip()
        base_url = f"{parsed.scheme}://{lan_ip}:{parsed.port}"
    share_url = f"{base_url}/share/{share['id']}"

    return {
        "share_id": share["id"],
        "share_url": share_url,
        "expires_at": share["expires_at"],
    }


@app.get("/share/{share_id}")
async def share_page(share_id: str, req: Request):
    """Render the standalone share page."""
    share = share_service.get_share(share_id)

    # Load template
    template_path = TEMPLATE_DIR / "share_page.html"
    template = template_path.read_text(encoding="utf-8")

    if not share:
        # Expired or not found
        expired_content = """
        <div class="expired-container">
            <div class="icon">⏰</div>
            <h2>分享已过期</h2>
            <p>该音频分享链接已过期或不存在。</p>
        </div>
        """
        html = template.format(content=expired_content, word_count=0)
        return HTMLResponse(content=html)

    # Increment view count
    share_service.increment_view(share_id)

    # Build audio URL
    base_url = str(req.base_url).rstrip("/")
    audio_url = f"{base_url}/api/audio/{share['audio_filename']}"
    download_url = f"{audio_url}?download=1"

    # Build word tags HTML
    word_tags = "".join(
        f'<span class="word-tag">{word}</span>' for word in share.get("words", [])
    )

    # Build the page content
    content = f"""
    <div class="share-brand">
        <h1>🎧 LexiFlow</h1>
        <p>听写音频分享</p>
    </div>

    <div class="audio-section">
        <audio controls preload="metadata" style="width: 100%;">
            <source src="{audio_url}" type="audio/mpeg">
            您的浏览器不支持音频播放。
        </audio>
    </div>

    <div class="word-list">
        <div class="word-list-title">单词列表</div>
        <div class="word-tags">{word_tags}</div>
    </div>

    <div class="meta-info">
        <span>🎙 {share.get('speaker_name', '未知')}</span>
        <span class="dot"></span>
        <span>每词 {share.get('repeat_count', 1)} 遍</span>
        <span class="dot"></span>
        <span>共 {share.get('word_count', 0)} 个单词</span>
    </div>

    <div class="actions">
        <a href="{download_url}" class="btn btn-primary" download>📥 下载音频</a>
    </div>

    <div class="footer">
        <p>由 <a href="/">LexiFlow</a> 生成 · 有效期 7 天</p>
    </div>
    """

    html = template.format(
        content=content,
        word_count=share.get("word_count", 0),
    )
    return HTMLResponse(content=html)


# === Run Server ===

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run("main:app", host=host, port=port, reload=True)
