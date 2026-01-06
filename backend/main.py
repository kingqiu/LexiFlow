"""
LexiFlow - FastAPI Main Application
REST API for word-to-speech generation with ListenHub integration.
"""
import os
import tempfile
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from services.listenhub import listenhub_service, DEFAULT_SPEAKER_ID, DEFAULT_SPEAKER_NAME
from services.audio_processor import audio_processor, AUDIO_DIR
from services.history import history_service
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


class GenerateResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    audio_filename: Optional[str] = None
    word_count: int = 0
    success_count: int = 0
    failed_count: int = 0
    failed_words: List[str] = []
    message: str = ""


class ParseResponse(BaseModel):
    words: List[str]
    word_count: int
    language: str
    is_large: bool
    warning: Optional[str] = None


# === API Endpoints ===

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
    1. Parses the word list
    2. Generates speech for each word via ListenHub
    3. Concatenates audio with repeat and interval settings
    4. Saves to history
    """
    # Parse words
    words, language = parse_word_list(request.text)
    validation = validate_word_list(words)
    
    if validation["is_empty"]:
        return GenerateResponse(
            success=False,
            message="请输入至少一个单词或词语"
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
        failed_words=failed_words
    )
    
    return GenerateResponse(
        success=True,
        audio_url=f"/api/audio/{audio_filename}",
        audio_filename=audio_filename,
        word_count=len(words),
        success_count=success_count,
        failed_count=failed_count,
        failed_words=failed_words,
        message=f"成功生成 {success_count}/{len(words)} 个单词的语音"
    )


@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    """Serve generated audio file."""
    file_path = AUDIO_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )


@app.get("/api/history")
async def get_history(limit: int = 20):
    """Get generation history."""
    records = history_service.get_records(limit)
    return {"records": records}


@app.delete("/api/history/{record_id}")
async def delete_history_record(record_id: int):
    """Delete a history record."""
    success = history_service.delete_record(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"success": True}


# === Run Server ===

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run("main:app", host=host, port=port, reload=True)
