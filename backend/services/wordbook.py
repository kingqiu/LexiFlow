"""
LexiFlow - Word Book Service
Manages user word book collections stored in local JSON file.
"""
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

# Word book file path
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
WORDBOOK_FILE = DATA_DIR / "wordbooks.json"


class WordBookService:
    """Service class for managing word book collections."""

    def __init__(self):
        self.wordbook_file = WORDBOOK_FILE
        self._ensure_file()

    def _ensure_file(self) -> None:
        """Ensure the wordbook file exists."""
        if not self.wordbook_file.exists():
            with open(self.wordbook_file, "w") as f:
                json.dump([], f)

    def _load(self) -> List[Dict]:
        """Load word books from file."""
        try:
            with open(self.wordbook_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _save(self, books: List[Dict]) -> None:
        """Save word books to file."""
        with open(self.wordbook_file, "w", encoding="utf-8") as f:
            json.dump(books, f, ensure_ascii=False, indent=2)

    def create_book(
        self,
        name: str,
        words: List[str] = None,
        description: str = "",
        invite_code: str = ""
    ) -> Dict:
        """
        Create a new word book.

        Returns:
            The created word book record
        """
        books = self._load()
        now = datetime.now().isoformat()

        # Deduplicate words while preserving order
        unique_words = list(dict.fromkeys(words)) if words else []

        book = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "words": unique_words,
            "word_count": len(unique_words),
            "created_at": now,
            "updated_at": now,
            "invite_code": invite_code
        }

        books.insert(0, book)
        self._save(books)
        return book

    def get_books(self, invite_code: str = "") -> List[Dict]:
        """Get word books, filtered by invite_code if provided, sorted by updated_at descending."""
        books = self._load()
        if invite_code:
            books = [b for b in books if b.get("invite_code") == invite_code]
        books.sort(key=lambda b: b.get("updated_at", ""), reverse=True)
        return books

    def get_book(self, book_id: str, invite_code: str = "") -> Optional[Dict]:
        """Get a specific word book by ID."""
        books = self._load()
        for book in books:
            if book.get("id") == book_id:
                if invite_code and book.get("invite_code") != invite_code:
                    return None
                return book
        return None

    def update_book(
        self,
        book_id: str,
        name: Optional[str] = None,
        words: Optional[List[str]] = None,
        description: Optional[str] = None,
        invite_code: str = ""
    ) -> Optional[Dict]:
        """
        Update a word book's name, words, or description.

        Returns:
            The updated record, or None if not found
        """
        books = self._load()

        for book in books:
            if book.get("id") == book_id:
                if invite_code and book.get("invite_code") != invite_code:
                    return None
                if name is not None:
                    book["name"] = name
                if description is not None:
                    book["description"] = description
                if words is not None:
                    unique_words = list(dict.fromkeys(words))
                    book["words"] = unique_words
                    book["word_count"] = len(unique_words)
                book["updated_at"] = datetime.now().isoformat()
                self._save(books)
                return book

        return None

    def delete_book(self, book_id: str, invite_code: str = "") -> bool:
        """Delete a word book by ID, only if invite_code matches."""
        books = self._load()
        original_len = len(books)
        if invite_code:
            books = [b for b in books if not (b.get("id") == book_id and b.get("invite_code") == invite_code)]
        else:
            books = [b for b in books if b.get("id") != book_id]

        if len(books) < original_len:
            self._save(books)
            return True
        return False

    def add_words(self, book_id: str, words: List[str], invite_code: str = "") -> Optional[Dict]:
        """
        Append words to an existing word book (deduplicates).

        Returns:
            The updated record, or None if not found
        """
        books = self._load()

        for book in books:
            if book.get("id") == book_id:
                if invite_code and book.get("invite_code") != invite_code:
                    return None
                existing = book.get("words", [])
                # Merge and deduplicate while preserving order
                merged = list(dict.fromkeys(existing + words))
                book["words"] = merged
                book["word_count"] = len(merged)
                book["updated_at"] = datetime.now().isoformat()
                self._save(books)
                return book

        return None

    def remove_words(self, book_id: str, words: List[str], invite_code: str = "") -> Optional[Dict]:
        """
        Remove specific words from a word book.

        Returns:
            The updated record, or None if not found
        """
        books = self._load()
        words_to_remove = set(words)

        for book in books:
            if book.get("id") == book_id:
                if invite_code and book.get("invite_code") != invite_code:
                    return None
                book["words"] = [w for w in book.get("words", []) if w not in words_to_remove]
                book["word_count"] = len(book["words"])
                book["updated_at"] = datetime.now().isoformat()
                self._save(books)
                return book

        return None


# Singleton instance
wordbook_service = WordBookService()
