import asyncio
import os
import sys

# Add the current directory to sys.path to find services
sys.path.append(os.getcwd())

from services.listenhub import listenhub_service

async def test():
    print("Fetching speakers for 'zh'...")
    zh_speakers = await listenhub_service.get_speakers(language='zh')
    print(f"ZH Speakers count: {len(zh_speakers)}")
    if zh_speakers:
        print(f"Example ZH speaker: {zh_speakers[0]}")
    
    print("\nFetching speakers for 'en'...")
    en_speakers = await listenhub_service.get_speakers(language='en')
    print(f"EN Speakers count: {len(en_speakers)}")
    if en_speakers:
        print(f"Example EN speaker: {en_speakers[0]}")

if __name__ == "__main__":
    asyncio.run(test())
