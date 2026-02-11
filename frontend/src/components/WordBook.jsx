import React, { useState } from 'react';

function WordBook({ books, onUseBook, onCreateBook, onDeleteBook, onUpdateBook }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBookName, setNewBookName] = useState('');
    const [expandedBookId, setExpandedBookId] = useState(null);
    const [editingBookId, setEditingBookId] = useState(null);
    const [editName, setEditName] = useState('');

    const handleCreate = () => {
        if (!newBookName.trim()) return;
        onCreateBook(newBookName.trim());
        setNewBookName('');
        setShowCreateModal(false);
    };

    const handleStartEdit = (book) => {
        setEditingBookId(book.id);
        setEditName(book.name);
    };

    const handleSaveEdit = (bookId) => {
        if (editName.trim()) {
            onUpdateBook(bookId, { name: editName.trim() });
        }
        setEditingBookId(null);
    };

    const handleRemoveWord = (bookId, word) => {
        const book = books.find(b => b.id === bookId);
        if (book) {
            const updatedWords = book.words.filter(w => w !== word);
            onUpdateBook(bookId, { words: updatedWords });
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <section className="wordbook-section">
            <div className="wordbook-header">
                <h2 className="card-title">
                    📖 单词本
                </h2>
                <button
                    className="wordbook-add-btn"
                    onClick={() => setShowCreateModal(true)}
                >
                    + 新建
                </button>
            </div>

            {books.length === 0 ? (
                <div className="card empty-state">
                    <div className="icon">📖</div>
                    <p>还没有单词本，创建一个开始整理你的单词吧</p>
                </div>
            ) : (
                <div className="wordbook-grid">
                    {books.map((book) => (
                        <div key={book.id} className={`wordbook-card ${expandedBookId === book.id ? 'expanded' : ''}`}>
                            <div className="wordbook-card-top">
                                <div className="wordbook-info" onClick={() => setExpandedBookId(expandedBookId === book.id ? null : book.id)}>
                                    {editingBookId === book.id ? (
                                        <input
                                            className="wordbook-name-input"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onBlur={() => handleSaveEdit(book.id)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(book.id); }}
                                            autoFocus
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="wordbook-title">{book.name}</div>
                                    )}
                                    <div className="wordbook-meta">
                                        {book.word_count} 个单词 · {formatDate(book.updated_at)}
                                    </div>
                                </div>
                                <button
                                    className="wordbook-use-btn"
                                    onClick={(e) => { e.stopPropagation(); onUseBook(book); }}
                                    title="使用此单词本"
                                >
                                    📤
                                </button>
                            </div>

                            {/* Expanded word list */}
                            {expandedBookId === book.id && (
                                <div className="wordbook-detail">
                                    <div className="wordbook-tags">
                                        {book.words && book.words.length > 0 ? (
                                            book.words.map((word, idx) => (
                                                <span key={idx} className="word-tag">
                                                    {word}
                                                    <button
                                                        className="word-tag-remove"
                                                        onClick={() => handleRemoveWord(book.id, word)}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))
                                        ) : (
                                            <span className="wordbook-empty-hint">暂无单词，从资料库中添加</span>
                                        )}
                                    </div>
                                    <div className="wordbook-actions">
                                        <button
                                            className="wordbook-action-btn"
                                            onClick={() => handleStartEdit(book)}
                                        >
                                            ✏️ 重命名
                                        </button>
                                        <button
                                            className="wordbook-action-btn delete"
                                            onClick={() => onDeleteBook(book.id)}
                                        >
                                            🗑️ 删除
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">📖 新建单词本</h3>
                        <div className="modal-body">
                            <input
                                className="wordbook-create-input"
                                type="text"
                                placeholder="输入单词本名称，如：三年级英语Unit3"
                                value={newBookName}
                                onChange={e => setNewBookName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                                autoFocus
                            />
                        </div>
                        <div className="modal-actions">
                            <button
                                className="modal-btn cancel"
                                onClick={() => { setShowCreateModal(false); setNewBookName(''); }}
                            >
                                取消
                            </button>
                            <button
                                className="modal-btn confirm"
                                onClick={handleCreate}
                                disabled={!newBookName.trim()}
                            >
                                创建
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default WordBook;
