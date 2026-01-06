import re

def detect_language(text: str) -> str:
    """
    Detect if the text is primarily Chinese or English.
    
    Args:
        text: The text to analyze
        
    Returns:
        'zh' if Chinese characters are found, otherwise 'en'
    """
    # Unicode range for Chinese characters: \u4e00-\u9fff
    if re.search(r'[\u4e00-\u9fff]', text):
        return 'zh'
    return 'en'
