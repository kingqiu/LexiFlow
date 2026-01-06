"""
LexiFlow - ListenHub API Service
Handles all interactions with the ListenHub TTS API.
"""
import os
import httpx
import asyncio
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

LISTENHUB_API_KEY = os.getenv("LISTENHUB_API_KEY", "")
LISTENHUB_BASE_URL = os.getenv("LISTENHUB_BASE_URL", "https://api.marswave.ai/openapi/v1")

# Default speaker if none specified
DEFAULT_SPEAKER_ID = "voice-clone-692f06bf2855dbc00c29a9c6"
DEFAULT_SPEAKER_NAME = "克克-1"

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


class ListenHubService:
    """Service class for ListenHub API interactions."""
    
    def __init__(self):
        self.base_url = LISTENHUB_BASE_URL
        # Mask API key for logging
        masked_key = f"{LISTENHUB_API_KEY[:6]}...{LISTENHUB_API_KEY[-4:]}" if LISTENHUB_API_KEY else "MISSING"
        print(f"Initializing ListenHubService with API Key: {masked_key}")
        self.headers = {
            "Authorization": f"Bearer {LISTENHUB_API_KEY}",
            "Content-Type": "application/json"
        }
    
    async def get_speakers(self, language: Optional[str] = None) -> List[Dict]:
        """
        Fetch available speakers from ListenHub API.
        
        Args:
            language: Optional filter by language (zh/en/ja)
            
        Returns:
            List of speaker objects with id, name, language
        """
        url = f"{self.base_url}/speakers/list"
        params = {}
        if language:
            params["language"] = language
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") == 0:
                    # The API returns 'items' inside 'data', not 'list'
                    speakers = data.get("data", {}).get("items", [])
                    return [
                        {
                            "id": s.get("speakerId"),
                            "name": s.get("name"),
                            "language": s.get("language"),
                            "gender": s.get("gender"),
                            "avatar": s.get("avatar")
                        }
                        for s in speakers
                    ]
                else:
                    print(f"ListenHub API error: {data.get('message')}")
                    return []
            except Exception as e:
                print(f"Failed to fetch speakers: {e}")
                return []
    
    async def generate_speech(
        self, 
        text: str, 
        speaker_id: str = DEFAULT_SPEAKER_ID
    ) -> Optional[Dict]:
        """
        Generate speech for a single piece of text with language optimization.
        """
        from utils.lang_detector import detect_language
        
        # Detect language
        lang = detect_language(text)
        
        # Mapping for language-optimized speakers
        # Key is the 'base' name or ID prefix.
        # This map ensures that if user selected "Keke-1", 
        # but the text is English, we use "keke-2" (EN version).
        SPEAKER_MAP = {
            "voice-clone-692f06bf2855dbc00c29a9c6": {"zh": "voice-clone-692f06bf2855dbc00c29a9c6", "en": "voice-clone-692f06fb62d62af721a56bb0"}, # 克克-2 is EN
            "voice-clone-692f06fb62d62af721a56bb0": {"zh": "voice-clone-692f06bf2855dbc00c29a9c6", "en": "voice-clone-692f06fb62d62af721a56bb0"},
            "travel-girl-english": {"zh": "voice-clone-692f06bf2855dbc00c29a9c6", "en": "travel-girl-english"},
            "Arthur": {"zh": "voice-clone-692f06bf2855dbc00c29a9c6", "en": "Arthur"},
            "leo-9328b6d2": {"zh": "voice-clone-692f06bf2855dbc00c29a9c6", "en": "leo-9328b6d2"},
        }
        
        # Determine optimized speaker ID
        optimized_speaker_id = speaker_id
        if speaker_id in SPEAKER_MAP:
            optimized_speaker_id = SPEAKER_MAP[speaker_id].get(lang, speaker_id)
        elif lang == "en" and not any(x in speaker_id.lower() for x in ["en", "english", "clone"]):
            # Fallback for other generic Chinese speakers: use a standard English speaker for English text
            optimized_speaker_id = "travel-girl-english" # Mia
        elif lang == "zh" and not any(x in speaker_id.lower() for x in ["zh", "chinese", "clone"]):
             # Fallback for English speakers: use Keke-1 for Chinese text
            optimized_speaker_id = "voice-clone-692f06bf2855dbc00c29a9c6"

        url = f"{self.base_url}/speech"
        payload = {
            "scripts": [
                {"content": text, "speakerId": optimized_speaker_id}
            ]
        }
        
        for attempt in range(MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        url, 
                        headers=self.headers, 
                        json=payload
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    if data.get("code") == 0:
                        result_data = data.get("data", {})
                        return {
                            "audio_url": result_data.get("audioUrl"),
                            "stream_url": result_data.get("audioStreamUrl"),
                            "duration": result_data.get("audioDuration"),
                            "text": text
                        }
                    else:
                        error_msg = data.get("message", "Unknown error")
                        print(f"ListenHub API error for '{text}': {error_msg}")
                        
                        # Check if rate limited
                        if data.get("code") == 29998:
                            await asyncio.sleep(30)  # Wait longer for rate limit
                            continue
                        
            except httpx.HTTPStatusError as e:
                print(f"HTTP error for '{text}' (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
            except Exception as e:
                print(f"Error generating speech for '{text}' (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
            
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY_SECONDS * (attempt + 1))
        
        return None
    
    async def generate_batch_speech(
        self,
        texts: List[str],
        speaker_id: str = DEFAULT_SPEAKER_ID,
        on_progress: Optional[callable] = None
    ) -> List[Dict]:
        """
        Generate speech for multiple texts.
        
        Args:
            texts: List of texts to convert
            speaker_id: The speaker/voice ID to use
            on_progress: Optional callback for progress updates
            
        Returns:
            List of results (successful and failed marked)
        """
        results = []
        total = len(texts)
        
        for i, text in enumerate(texts):
            result = await self.generate_speech(text, speaker_id)
            
            if result:
                results.append({
                    "success": True,
                    "index": i,
                    **result
                })
            else:
                results.append({
                    "success": False,
                    "index": i,
                    "text": text,
                    "error": "Failed after 3 retries"
                })
            
            if on_progress:
                on_progress(i + 1, total)
            
            # Rate limiting: wait between requests (3 RPM limit)
            if i < total - 1:
                await asyncio.sleep(0.5)  # Small delay between requests
        
        return results
    
    async def download_audio(self, audio_url: str, save_path: str) -> bool:
        """
        Download audio file from URL.
        
        Args:
            audio_url: URL of the audio file
            save_path: Local path to save the file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(audio_url)
                response.raise_for_status()
                
                with open(save_path, "wb") as f:
                    f.write(response.content)
                
                return True
        except Exception as e:
            print(f"Failed to download audio: {e}")
            return False


# Singleton instance
listenhub_service = ListenHubService()
