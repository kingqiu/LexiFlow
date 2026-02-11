"""
LexiFlow - Share Service
Manages shareable links for audio content stored in local JSON file.
"""
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path

# Share data file path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
SHARE_FILE = DATA_DIR / "shares.json"

# Default expiry: 7 days
DEFAULT_EXPIRY_DAYS = 7


class ShareService:
    """Service class for managing shareable audio links."""

    def __init__(self):
        self.share_file = SHARE_FILE
        self._ensure_file()
        self._cleanup_expired()

    def _ensure_file(self) -> None:
        """Ensure the share file exists."""
        if not self.share_file.exists():
            with open(self.share_file, "w") as f:
                json.dump([], f)

    def _load(self) -> List[Dict]:
        """Load shares from file."""
        try:
            with open(self.share_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _save(self, shares: List[Dict]) -> None:
        """Save shares to file."""
        with open(self.share_file, "w", encoding="utf-8") as f:
            json.dump(shares, f, ensure_ascii=False, indent=2)

    def create_share(
        self,
        audio_filename: str,
        words: List[str],
        speaker_name: str = "",
        repeat_count: int = 1,
        interval_seconds: float = 3.0,
    ) -> Dict:
        """
        Create a new share record.

        Returns:
            The created share record with short ID
        """
        shares = self._load()
        now = datetime.now()

        share = {
            "id": uuid.uuid4().hex[:8],
            "audio_filename": audio_filename,
            "words": words,
            "word_count": len(words),
            "speaker_name": speaker_name,
            "repeat_count": repeat_count,
            "interval_seconds": interval_seconds,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(days=DEFAULT_EXPIRY_DAYS)).isoformat(),
            "view_count": 0,
        }

        shares.insert(0, share)
        self._save(shares)
        return share

    def get_share(self, share_id: str) -> Optional[Dict]:
        """Get a share record by ID, returns None if not found or expired."""
        shares = self._load()
        now = datetime.now()

        for share in shares:
            if share.get("id") == share_id:
                expires_at = datetime.fromisoformat(share.get("expires_at", ""))
                if now > expires_at:
                    return None  # Expired
                return share

        return None

    def increment_view(self, share_id: str) -> None:
        """Increment the view count for a share."""
        shares = self._load()

        for share in shares:
            if share.get("id") == share_id:
                share["view_count"] = share.get("view_count", 0) + 1
                self._save(shares)
                return

    def _cleanup_expired(self) -> None:
        """Remove expired share records on startup."""
        shares = self._load()
        now = datetime.now()
        original_len = len(shares)

        shares = [
            s for s in shares
            if datetime.fromisoformat(s.get("expires_at", now.isoformat())) > now
        ]

        if len(shares) < original_len:
            self._save(shares)


# Singleton instance
share_service = ShareService()
