"""
LexiFlow - History Service
Manages generation history stored in local JSON file.
"""
import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

# History file path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
HISTORY_FILE = DATA_DIR / "history.json"


class HistoryService:
    """Service class for managing generation history."""
    
    def __init__(self):
        self.history_file = HISTORY_FILE
        self._ensure_history_file()
    
    def _ensure_history_file(self) -> None:
        """Ensure the history file exists."""
        if not self.history_file.exists():
            with open(self.history_file, "w") as f:
                json.dump([], f)
    
    def _load_history(self) -> List[Dict]:
        """Load history from file."""
        try:
            with open(self.history_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    
    def _save_history(self, history: List[Dict]) -> None:
        """Save history to file."""
        with open(self.history_file, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    
    def add_record(
        self,
        words: List[str],
        speaker_id: str,
        speaker_name: str,
        repeat_count: int,
        interval_seconds: float,
        audio_filename: str,
        success_count: int,
        failed_count: int,
        failed_words: List[str],
        invite_code: str = ""
    ) -> Dict:
        """
        Add a new generation record.

        Returns:
            The created record
        """
        history = self._load_history()

        record = {
            "id": uuid.uuid4().hex,
            "timestamp": datetime.now().isoformat(),
            "words": words,
            "word_count": len(words),
            "speaker_id": speaker_id,
            "speaker_name": speaker_name,
            "repeat_count": repeat_count,
            "interval_seconds": interval_seconds,
            "audio_filename": audio_filename,
            "success_count": success_count,
            "failed_count": failed_count,
            "failed_words": failed_words,
            "invite_code": invite_code
        }

        history.insert(0, record)  # Add to beginning (newest first)

        # Keep only last 100 records
        if len(history) > 100:
            history = history[:100]

        self._save_history(history)
        return record

    def get_records(self, limit: int = 20, invite_code: str = "") -> List[Dict]:
        """Get recent history records, filtered by invite_code if provided."""
        history = self._load_history()
        if invite_code:
            history = [r for r in history if r.get("invite_code") == invite_code]
        return history[:limit]

    def get_record_by_id(self, record_id: int) -> Optional[Dict]:
        """Get a specific record by ID."""
        history = self._load_history()
        for record in history:
            if record.get("id") == record_id:
                return record
        return None

    def delete_record(self, record_id: str, invite_code: str = "") -> bool:
        """Delete a record by ID, only if invite_code matches."""
        history = self._load_history()
        original_len = len(history)
        if invite_code:
            history = [r for r in history if not (r.get("id") == record_id and r.get("invite_code") == invite_code)]
        else:
            history = [r for r in history if r.get("id") != record_id]

        if len(history) < original_len:
            self._save_history(history)
            return True
        return False
    
    def clear_history(self) -> None:
        """Clear all history."""
        self._save_history([])


# Singleton instance
history_service = HistoryService()
