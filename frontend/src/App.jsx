import React, { useState, useEffect, useCallback } from 'react';
import WordInput from './components/WordInput';
import SettingsPanel from './components/SettingsPanel';
import AudioPlayer from './components/AudioPlayer';
import ShareModal from './components/ShareModal';
import WordBook from './components/WordBook';
import History from './components/History';

const API_BASE = `http://${window.location.hostname}:8000/api`;

function App() {
    // Word list state
    const [text, setText] = useState('');
    const [words, setWords] = useState([]);
    const [wordCount, setWordCount] = useState(0);
    const [isLarge, setIsLarge] = useState(false);
    const [warning, setWarning] = useState(null);

    // Settings state
    const [speakers, setSpeakers] = useState([]);
    const [selectedSpeaker, setSelectedSpeaker] = useState(null);
    const [repeatCount, setRepeatCount] = useState(2);
    const [intervalSeconds, setIntervalSeconds] = useState(3);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAudio, setGeneratedAudio] = useState(null);
    const [generationResult, setGenerationResult] = useState(null);
    const [error, setError] = useState(null);

    // History state
    const [history, setHistory] = useState([]);

    // Confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Word Book state
    const [wordbooks, setWordbooks] = useState([]);
    const [showSaveToBookModal, setShowSaveToBookModal] = useState(false);
    const [saveToBookWords, setSaveToBookWords] = useState([]);

    // Share state
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    // Fetch speakers on mount
    useEffect(() => {
        fetchSpeakers();
        fetchHistory();
        fetchWordBooks();
    }, []);

    const fetchSpeakers = async () => {
        try {
            const response = await fetch(`${API_BASE}/speakers`);
            const data = await response.json();
            setSpeakers(data.speakers || []);
            if (data.speakers && data.speakers.length > 0) {
                const defaultSpeaker = data.speakers.find(s => s.id === data.default) || data.speakers[0];
                setSelectedSpeaker(defaultSpeaker);
            }
        } catch (err) {
            console.error('Failed to fetch speakers:', err);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${API_BASE}/history`);
            const data = await response.json();
            setHistory(data.records || []);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    // Word Book API methods
    const fetchWordBooks = async () => {
        try {
            const response = await fetch(`${API_BASE}/wordbooks`);
            const data = await response.json();
            setWordbooks(data.books || []);
        } catch (err) {
            console.error('Failed to fetch wordbooks:', err);
        }
    };

    const handleCreateWordBook = async (name) => {
        try {
            await fetch(`${API_BASE}/wordbooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            fetchWordBooks();
        } catch (err) {
            console.error('Failed to create wordbook:', err);
        }
    };

    const handleDeleteWordBook = async (bookId) => {
        try {
            await fetch(`${API_BASE}/wordbooks/${bookId}`, { method: 'DELETE' });
            fetchWordBooks();
        } catch (err) {
            console.error('Failed to delete wordbook:', err);
        }
    };

    const handleUpdateWordBook = async (bookId, updates) => {
        try {
            await fetch(`${API_BASE}/wordbooks/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            fetchWordBooks();
        } catch (err) {
            console.error('Failed to update wordbook:', err);
        }
    };

    const handleUseWordBook = (book) => {
        const wordText = book.words.join('\n');
        handleTextChange(wordText);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveToWordBook = async (bookId, words) => {
        try {
            await fetch(`${API_BASE}/wordbooks/${bookId}/words`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', words }),
            });
            fetchWordBooks();
            setShowSaveToBookModal(false);
            setSaveToBookWords([]);
        } catch (err) {
            console.error('Failed to save to wordbook:', err);
        }
    };

    const handleSaveToNewBook = async (bookName, words) => {
        try {
            await fetch(`${API_BASE}/wordbooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: bookName, words }),
            });
            fetchWordBooks();
            setShowSaveToBookModal(false);
            setSaveToBookWords([]);
        } catch (err) {
            console.error('Failed to create wordbook with words:', err);
        }
    };

    const handleOpenSaveToBook = (words) => {
        setSaveToBookWords(words);
        setShowSaveToBookModal(true);
    };

    // Share handler
    const handleShare = async () => {
        if (!generatedAudio) return;
        try {
            const response = await fetch(`${API_BASE}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio_filename: generatedAudio.filename,
                    words: generationResult?.words || words,
                    speaker_name: selectedSpeaker?.name || '',
                    repeat_count: repeatCount,
                    interval_seconds: intervalSeconds,
                }),
            });
            const data = await response.json();
            setShareUrl(data.share_url);
            setShowShareModal(true);
        } catch (err) {
            console.error('Failed to create share:', err);
            alert('创建分享链接失败，请重试');
        }
    };

    // Parse text when it changes
    const handleTextChange = useCallback(async (newText) => {
        setText(newText);
        if (!newText.trim()) {
            setWords([]);
            setWordCount(0);
            setIsLarge(false);
            setWarning(null);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('text', newText);
            const response = await fetch(`${API_BASE}/parse`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setWords(data.words);
            setWordCount(data.word_count);
            setIsLarge(data.is_large);
            setWarning(data.warning);
        } catch (err) {
            console.error('Failed to parse text:', err);
        }
    }, []);

    // Handle file upload
    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                setError(errData.detail || '文件上传失败');
                return;
            }

            const data = await response.json();
            setText(data.raw_content);
            setWords(data.words);
            setWordCount(data.word_count);
            setIsLarge(data.is_large);
            setWarning(data.warning);
        } catch (err) {
            setError('文件上传失败，请重试');
            console.error('Upload error:', err);
        }
    };

    // Generate speech with real-time streaming updates
    const handleGenerate = async (confirmed = false) => {
        if (!words.length) {
            setError('请输入至少一个单词');
            return;
        }

        setError(null);
        setIsGenerating(true);
        setGeneratedAudio(null);
        setGenerationResult(null);

        try {
            const response = await fetch(`${API_BASE}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    speaker_id: selectedSpeaker?.id || 'keke-1',
                    speaker_name: selectedSpeaker?.name || '克克-1',
                    repeat_count: repeatCount,
                    interval_seconds: intervalSeconds,
                    confirmed: confirmed,
                }),
            });

            const data = await response.json();

            if (data.message === 'CONFIRM_REQUIRED') {
                setShowConfirmModal(true);
                setIsGenerating(false);
                return;
            }

            if (data.success) {
                setGeneratedAudio({
                    url: `${API_BASE.replace('/api', '')}${data.audio_url}`,
                    filename: data.audio_filename,
                });
                setGenerationResult({
                    wordCount: data.word_count,
                    successCount: data.success_count,
                    failedCount: data.failed_count,
                    failedWords: data.failed_words,
                    words: data.words || words, // Store the words used for this generation
                    message: data.message,
                });
                fetchHistory(); // Refresh history
            } else {
                setError(data.message || '生成失败');
            }
        } catch (err) {
            setError('生成失败，请检查网络连接');
            console.error('Generate error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = () => {
        setShowConfirmModal(false);
        handleGenerate(true);
    };

    const handleDeleteHistory = async (recordId) => {
        try {
            await fetch(`${API_BASE}/history/${recordId}`, { method: 'DELETE' });
            fetchHistory();
        } catch (err) {
            console.error('Failed to delete history:', err);
        }
    };

    const handlePlayHistory = (record) => {
        setGeneratedAudio({
            url: `${API_BASE.replace('/api', '')}/api/audio/${record.audio_filename}`,
            filename: record.audio_filename,
        });
        setGenerationResult({
            wordCount: record.word_count,
            successCount: record.success_count,
            failedCount: record.failed_count,
            failedWords: record.failed_words || [],
            words: record.words || [], // Include words from history record
            message: `来自历史记录 - ${record.speaker_name}`,
        });
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <h1>
                    <span style={{ color: '#f97316' }}>L</span>
                    <span style={{ color: '#3b82f6' }}>exi</span>
                    Flow
                </h1>
                <p>万物皆可听，一键生成听写音频</p>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <WordInput
                    text={text}
                    onTextChange={handleTextChange}
                    onFileUpload={handleFileUpload}
                    wordCount={wordCount}
                    isLarge={isLarge}
                    warning={warning}
                />

                <SettingsPanel
                    speakers={speakers}
                    selectedSpeaker={selectedSpeaker}
                    onSpeakerChange={setSelectedSpeaker}
                    repeatCount={repeatCount}
                    onRepeatChange={setRepeatCount}
                    intervalSeconds={intervalSeconds}
                    onIntervalChange={setIntervalSeconds}
                    onGenerate={() => handleGenerate(false)}
                    isGenerating={isGenerating}
                    disabled={!words.length}
                />

                {error && (
                    <div className="status-message error" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', textAlign: 'center' }}>
                        ❌ {error}
                    </div>
                )}

                {generatedAudio && (
                    <AudioPlayer
                        audioUrl={generatedAudio.url}
                        filename={generatedAudio.filename}
                        result={generationResult}
                        onShare={handleShare}
                    />
                )}

                <WordBook
                    books={wordbooks}
                    onUseBook={handleUseWordBook}
                    onCreateBook={handleCreateWordBook}
                    onDeleteBook={handleDeleteWordBook}
                    onUpdateBook={handleUpdateWordBook}
                />

                <History
                    records={history}
                    onPlay={handlePlayHistory}
                    onDelete={handleDeleteHistory}
                    onSaveToBook={handleOpenSaveToBook}
                />
            </main>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">⚠️ 大量单词警告</h3>
                        <div className="modal-body">
                            <p>您输入了 <strong>{wordCount}</strong> 个单词。</p>
                            <p>生成音频可能需要较长时间并产生 API 费用。</p>
                            <p>确定要继续吗？</p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                取消
                            </button>
                            <button
                                className="modal-btn confirm"
                                onClick={handleConfirm}
                            >
                                确认生成
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save to Word Book Modal */}
            {showSaveToBookModal && (
                <SaveToBookModal
                    words={saveToBookWords}
                    books={wordbooks}
                    onSaveToExisting={handleSaveToWordBook}
                    onSaveToNew={handleSaveToNewBook}
                    onClose={() => { setShowSaveToBookModal(false); setSaveToBookWords([]); }}
                />
            )}

            {/* Share Modal */}
            {showShareModal && generatedAudio && (
                <ShareModal
                    shareUrl={shareUrl}
                    audioUrl={generatedAudio.url}
                    filename={generatedAudio.filename}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
}

// SaveToBookModal sub-component
function SaveToBookModal({ words, books, onSaveToExisting, onSaveToNew, onClose }) {
    const [mode, setMode] = useState(books.length > 0 ? 'existing' : 'new');
    const [selectedBookId, setSelectedBookId] = useState(books.length > 0 ? books[0].id : '');
    const [newBookName, setNewBookName] = useState('');

    const handleSave = () => {
        if (mode === 'existing' && selectedBookId) {
            onSaveToExisting(selectedBookId, words);
        } else if (mode === 'new' && newBookName.trim()) {
            onSaveToNew(newBookName.trim(), words);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">📌 存入单词本</h3>
                <div className="modal-body">
                    <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '0.9rem' }}>
                        将 <strong>{words.length}</strong> 个单词存入单词本
                    </p>

                    <div className="save-to-book-tabs">
                        {books.length > 0 && (
                            <button
                                className={`tab-item ${mode === 'existing' ? 'active' : ''}`}
                                onClick={() => setMode('existing')}
                            >
                                已有单词本
                            </button>
                        )}
                        <button
                            className={`tab-item ${mode === 'new' ? 'active' : ''}`}
                            onClick={() => setMode('new')}
                        >
                            新建单词本
                        </button>
                    </div>

                    {mode === 'existing' ? (
                        <select
                            className="clean-select"
                            value={selectedBookId}
                            onChange={e => setSelectedBookId(e.target.value)}
                            style={{ marginTop: '12px' }}
                        >
                            {books.map(book => (
                                <option key={book.id} value={book.id}>
                                    {book.name} ({book.word_count} 个单词)
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            className="wordbook-create-input"
                            type="text"
                            placeholder="输入新单词本名称"
                            value={newBookName}
                            onChange={e => setNewBookName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                            autoFocus
                            style={{ marginTop: '12px' }}
                        />
                    )}
                </div>
                <div className="modal-actions">
                    <button className="modal-btn cancel" onClick={onClose}>取消</button>
                    <button
                        className="modal-btn confirm"
                        onClick={handleSave}
                        disabled={mode === 'new' ? !newBookName.trim() : !selectedBookId}
                    >
                        存入
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
