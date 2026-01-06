import React, { useState, useEffect, useCallback } from 'react';
import WordInput from './components/WordInput';
import SettingsPanel from './components/SettingsPanel';
import AudioPlayer from './components/AudioPlayer';
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

    // Fetch speakers on mount
    useEffect(() => {
        fetchSpeakers();
        fetchHistory();
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

    // Generate speech
    const handleGenerate = async (confirmed = false) => {
        if (!words.length) {
            setError('请输入至少一个单词');
            return;
        }

        setError(null);
        setIsGenerating(true);

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
                <p>解说万物，一键生成听写音频</p>
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
                    />
                )}

                <History
                    records={history}
                    onPlay={handlePlayHistory}
                    onDelete={handleDeleteHistory}
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
        </div>
    );
}

export default App;
