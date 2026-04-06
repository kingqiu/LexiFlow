"""
User Activity Tracker
Tracks invite code user behavior: login, audio generation, playback, download.
Stores logs in JSONL format and enriches with device/location info.
"""
import json
import re
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

# Data directory
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
ACTIVITY_LOG_FILE = DATA_DIR / "user_activity.jsonl"

# GeoIP database path (GeoLite2-City.mmdb)
GEOIP_DB_PATH = Path(__file__).parent.parent / "data" / "GeoLite2-City.mmdb"

# Try to import geoip2, gracefully degrade if not available
try:
    import geoip2.database
    HAS_GEOIP = True
except ImportError:
    HAS_GEOIP = False


def parse_user_agent(ua: str) -> Dict[str, str]:
    """
    Parse User-Agent string to extract device type, OS, and browser.
    No external dependencies needed.

    Returns:
        {
            "device_type": "iPhone" | "iPad" | "Android" | "Windows PC" | "Mac" | "Linux" | "Unknown",
            "os": "iOS 17.4" | "Android 14" | "Windows 10" | "macOS" | ...,
            "browser": "Safari" | "Chrome" | "WeChat" | "Firefox" | "Edge" | ...
        }
    """
    result = {"device_type": "Unknown", "os": "Unknown", "browser": "Unknown"}

    if not ua:
        return result

    # --- Device Type & OS ---
    if "iPhone" in ua:
        result["device_type"] = "iPhone"
        os_match = re.search(r"iPhone OS (\d+[_\d]*)", ua)
        if os_match:
            result["os"] = "iOS " + os_match.group(1).replace("_", ".")
        else:
            result["os"] = "iOS"
    elif "iPad" in ua:
        result["device_type"] = "iPad"
        os_match = re.search(r"CPU OS (\d+[_\d]*)", ua)
        if os_match:
            result["os"] = "iPadOS " + os_match.group(1).replace("_", ".")
        else:
            result["os"] = "iPadOS"
    elif "Android" in ua:
        result["device_type"] = "Android"
        os_match = re.search(r"Android (\d+[\.\d]*)", ua)
        if os_match:
            result["os"] = "Android " + os_match.group(1)
        else:
            result["os"] = "Android"
    elif "Windows" in ua:
        result["device_type"] = "Windows PC"
        if "Windows NT 10.0" in ua:
            result["os"] = "Windows 10/11"
        elif "Windows NT 6.3" in ua:
            result["os"] = "Windows 8.1"
        elif "Windows NT 6.1" in ua:
            result["os"] = "Windows 7"
        else:
            result["os"] = "Windows"
    elif "Macintosh" in ua:
        result["device_type"] = "Mac"
        os_match = re.search(r"Mac OS X (\d+[_\d]*)", ua)
        if os_match:
            result["os"] = "macOS " + os_match.group(1).replace("_", ".")
        else:
            result["os"] = "macOS"
    elif "Linux" in ua:
        result["device_type"] = "Linux"
        result["os"] = "Linux"

    # --- Browser (order matters: check specific ones first) ---
    if "MicroMessenger" in ua:
        # WeChat browser
        wechat_match = re.search(r"MicroMessenger/([\d\.]+)", ua)
        result["browser"] = "WeChat " + (wechat_match.group(1) if wechat_match else "")
    elif "MiniProgramEnv" in ua or "miniProgram" in ua:
        result["browser"] = "WeChat Mini Program"
    elif "DingTalk" in ua:
        result["browser"] = "DingTalk"
    elif "CriOS/" in ua:
        # Chrome on iOS
        crios_match = re.search(r"CriOS/([\d\.]+)", ua)
        result["browser"] = "Chrome iOS " + (crios_match.group(1) if crios_match else "")
    elif "FxiOS/" in ua:
        # Firefox on iOS
        fxios_match = re.search(r"FxiOS/([\d\.]+)", ua)
        result["browser"] = "Firefox iOS " + (fxios_match.group(1) if fxios_match else "")
    elif "Edg/" in ua or "EdgiOS/" in ua:
        edge_match = re.search(r"(?:Edg|EdgiOS)/([\d\.]+)", ua)
        result["browser"] = "Edge " + (edge_match.group(1) if edge_match else "")
    elif "OPR/" in ua or "Opera" in ua:
        result["browser"] = "Opera"
    elif "Chrome/" in ua and "Safari/" in ua:
        chrome_match = re.search(r"Chrome/([\d\.]+)", ua)
        result["browser"] = "Chrome " + (chrome_match.group(1) if chrome_match else "")
    elif "Safari/" in ua and "Chrome" not in ua:
        safari_match = re.search(r"Version/([\d\.]+)", ua)
        result["browser"] = "Safari " + (safari_match.group(1) if safari_match else "")
    elif "Firefox/" in ua:
        ff_match = re.search(r"Firefox/([\d\.]+)", ua)
        result["browser"] = "Firefox " + (ff_match.group(1) if ff_match else "")
    else:
        result["browser"] = "Other"

    return result


def get_client_ip(request) -> str:
    """
    Extract real client IP from request, considering reverse proxy headers.
    Nginx should set X-Forwarded-For or X-Real-IP.
    """
    # Try X-Forwarded-For first (may contain multiple IPs: client, proxy1, proxy2)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        # First IP is the real client
        return forwarded_for.split(",")[0].strip()

    # Try X-Real-IP
    real_ip = request.headers.get("x-real-ip", "")
    if real_ip:
        return real_ip.strip()

    # Fallback to direct connection IP
    if request.client:
        return request.client.host

    return "Unknown"


def get_location(ip: str) -> str:
    """
    Get geographic location from IP address using GeoLite2 offline database.
    Returns a string like "广东省深圳市" or "Unknown" if unavailable.
    """
    if not HAS_GEOIP or not GEOIP_DB_PATH.exists():
        return f"Unknown (GeoIP DB not found)"

    try:
        with geoip2.database.Reader(str(GEOIP_DB_PATH)) as reader:
            response = reader.city(ip)
            # Prefer Chinese names, fallback to English
            country = response.country.names.get("zh-CN", response.country.name or "")
            subdivision = ""
            if response.subdivisions:
                subdivision = response.subdivisions.most_specific.names.get(
                    "zh-CN", response.subdivisions.most_specific.name or ""
                )
            city = response.city.names.get("zh-CN", response.city.name or "")

            parts = [p for p in [country, subdivision, city] if p]
            return " ".join(parts) if parts else "Unknown"
    except Exception:
        return "Unknown"


class UserTracker:
    """Tracks user activity and logs to JSONL file."""

    def log_event(
        self,
        code: str,
        event: str,
        request,
        details: Optional[Dict] = None
    ) -> Dict:
        """
        Log a user activity event.

        Args:
            code: Invite code
            event: Event type (login, generate, playback, download)
            request: FastAPI Request object
            details: Optional extra data (e.g., word count, speaker name)

        Returns:
            The logged event record
        """
        ua_string = request.headers.get("user-agent", "")
        ip = get_client_ip(request)
        ua_info = parse_user_agent(ua_string)
        location = get_location(ip)
        language = request.headers.get("accept-language", "Unknown")

        record = {
            "code": code,
            "event": event,
            "timestamp": datetime.now().isoformat(),
            "ip": ip,
            "device_type": ua_info["device_type"],
            "os": ua_info["os"],
            "browser": ua_info["browser"],
            "language": language,
            "location": location,
            "user_agent_raw": ua_string,
        }

        if details:
            record["details"] = details

        # Append to JSONL file
        try:
            with open(ACTIVITY_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[UserTracker] Failed to write activity log: {e}")

        return record

    def record_first_login(self, code: str, request, codes_data: Dict) -> bool:
        """
        Record first login info into invite_codes.json if not already recorded.

        Args:
            code: Invite code
            request: FastAPI Request object
            codes_data: The codes data dict (from InviteCodeManager)

        Returns:
            True if this was the first login, False if already recorded
        """
        if code not in codes_data.get("codes", {}):
            return False

        code_info = codes_data["codes"][code]

        # Already has first_login recorded
        if code_info.get("first_login"):
            return False

        ua_string = request.headers.get("user-agent", "")
        ip = get_client_ip(request)
        ua_info = parse_user_agent(ua_string)
        location = get_location(ip)

        code_info["first_login"] = {
            "timestamp": datetime.now().isoformat(),
            "ip": ip,
            "device_type": ua_info["device_type"],
            "os": ua_info["os"],
            "browser": ua_info["browser"],
            "location": location,
        }

        return True


# Singleton instance
user_tracker = UserTracker()
