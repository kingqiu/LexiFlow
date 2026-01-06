"""
LexiFlow - Text Parser Utility
Parses and processes word lists from various input formats.
"""
import re
from typing import List, Tuple


def detect_language(text: str) -> str:
    """
    Detect the primary language of the text.
    
    Returns:
        'zh' for Chinese, 'en' for English, 'mixed' for both
    """
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    
    if chinese_chars > english_chars:
        return 'zh'
    elif english_chars > chinese_chars:
        return 'en'
    else:
        return 'mixed'


def parse_word_list(text: str) -> Tuple[List[str], str]:
    """
    Parse a word list from text input.
    Supports comma-separated, newline-separated, and mixed formats.
    
    Args:
        text: Raw text input
        
    Returns:
        Tuple of (list of words, detected language)
    """
    if not text or not text.strip():
        return [], 'unknown'
    
    # Normalize separators: replace various comma types and newlines
    normalized = text.strip()
    
    # Replace full-width comma, Chinese comma, semicolons with standard comma
    normalized = re.sub(r'[，、；;]', ',', normalized)
    
    # Replace multiple newlines with single comma
    normalized = re.sub(r'\n+', ',', normalized)
    
    # Split by comma
    words = normalized.split(',')
    
    # Clean up each word
    cleaned_words = []
    for word in words:
        word = word.strip()
        # Remove numbers, special characters (keep Chinese and English letters)
        word = re.sub(r'^[\d\.\)\]\-\s]+', '', word)  # Remove leading numbers/bullets
        word = word.strip()
        
        if word and len(word) > 0:
            cleaned_words.append(word)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_words = []
    for word in cleaned_words:
        if word.lower() not in seen:
            seen.add(word.lower())
            unique_words.append(word)
    
    # Detect language
    all_text = ' '.join(unique_words)
    language = detect_language(all_text)
    
    return unique_words, language


def validate_word_list(words: List[str]) -> dict:
    """
    Validate a word list and return validation info.
    
    Returns:
        Dict with validation results
    """
    return {
        "is_valid": len(words) > 0,
        "word_count": len(words),
        "is_large": len(words) > 200,
        "is_empty": len(words) == 0,
        "warning": "文档包含超过200个单词，生成可能需要较长时间并产生费用。" if len(words) > 200 else None
    }
