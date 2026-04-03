"""
Invite Code Management System
Handles invite code validation, usage tracking, and daily limits.
"""
import json
import os
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Optional

DATA_DIR = Path(__file__).parent.parent / "data"
INVITE_CODES_FILE = DATA_DIR / "invite_codes.json"
USAGE_LOG_FILE = DATA_DIR / "usage_log.jsonl"

# Daily limit per invite code
DAILY_WORD_LIMIT = 50


class InviteCodeManager:
    def __init__(self):
        self.codes_data = self._load_codes()

    def _load_codes(self) -> Dict:
        """Load invite codes from JSON file"""
        if not INVITE_CODES_FILE.exists():
            # Initialize with empty structure
            default_data = {"codes": {}}
            self._save_codes(default_data)
            return default_data

        with open(INVITE_CODES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _save_codes(self, data: Dict):
        """Save invite codes to JSON file"""
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(INVITE_CODES_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def validate_code(self, code: str) -> tuple[bool, Optional[str]]:
        """
        Validate invite code and check daily limit
        Returns: (is_valid, error_message)
        """
        if code not in self.codes_data.get("codes", {}):
            return False, "邀请码无效"

        code_info = self.codes_data["codes"][code]
        today = str(date.today())

        # Check daily usage
        daily_usage = code_info.get("daily_usage", {})
        today_count = daily_usage.get(today, 0)

        if today_count >= DAILY_WORD_LIMIT:
            return False, "今日额度已用完，明天再来"

        return True, None

    def record_usage(self, code: str, word_count: int):
        """Record usage for an invite code"""
        today = str(date.today())

        if code not in self.codes_data["codes"]:
            return

        code_info = self.codes_data["codes"][code]

        # Update daily usage
        if "daily_usage" not in code_info:
            code_info["daily_usage"] = {}

        code_info["daily_usage"][today] = code_info["daily_usage"].get(today, 0) + word_count

        # Update total usage
        code_info["total_usage"] = code_info.get("total_usage", 0) + word_count
        code_info["last_used"] = datetime.now().isoformat()

        self._save_codes(self.codes_data)

        # Log to JSONL
        self._log_usage(code, word_count)

    def _log_usage(self, code: str, word_count: int):
        """Append usage log to JSONL file"""
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        log_entry = {
            "code": code,
            "timestamp": datetime.now().isoformat(),
            "word_count": word_count
        }

        with open(USAGE_LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')

    def get_remaining_quota(self, code: str) -> int:
        """Get remaining daily quota for a code"""
        if code not in self.codes_data.get("codes", {}):
            return 0

        code_info = self.codes_data["codes"][code]
        today = str(date.today())
        daily_usage = code_info.get("daily_usage", {})
        today_count = daily_usage.get(today, 0)

        return max(0, DAILY_WORD_LIMIT - today_count)


# Global instance
invite_code_manager = InviteCodeManager()
