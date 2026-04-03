"""
Generate initial invite codes for LexiFlow
"""
import json
import secrets
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
INVITE_CODES_FILE = DATA_DIR / "invite_codes.json"

def generate_code():
    """Generate a random 8-character invite code"""
    return secrets.token_urlsafe(6)[:8].upper()

def main():
    # Generate 10 unique codes
    codes = {}
    for i in range(10):
        code = generate_code()
        # Ensure uniqueness
        while code in codes:
            code = generate_code()

        codes[code] = {
            "created_at": "2026-04-03",
            "total_usage": 0,
            "daily_usage": {},
            "last_used": None
        }

    # Save to file
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    data = {"codes": codes}

    with open(INVITE_CODES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("Generated invite codes:")
    print("=" * 50)
    for code in codes.keys():
        print(f"  {code}")
    print("=" * 50)
    print(f"\nSaved to: {INVITE_CODES_FILE}")

if __name__ == "__main__":
    main()
