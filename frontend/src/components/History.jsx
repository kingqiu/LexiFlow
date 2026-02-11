import React, { useState } from 'react';

function History({ records, onPlay, onDelete, onSaveToBook }) {
    const [hoveredCard, setHoveredCard] = useState(null);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatWords = (words) => {
        if (!words || words.length === 0) return '无内文';
        const preview = words.slice(0, 3).join(', ');
        return words.length > 3 ? `${preview}…` : preview;
    };

    return (
        <section className="history-section">
            <h2 className="card-title">
                📚 资料库
            </h2>

            {records.length === 0 ? (
                <div className="card empty-state">
                    <div className="icon">🥡</div>
                    <p>暂无生成记录，快去创作一段音频吧</p>
                </div>
            ) : (
                <div className="history-grid">
                    {records.map((record) => (
                        <div
                            key={record.id}
                            className="history-card"
                            tabIndex="0"
                            aria-label={`听写记录: ${record.words.slice(0, 3).join(', ')}…`}
                        >
                            <div className="history-card-top">
                                <div className="history-info">
                                    <div
                                        className="history-title"
                                        style={{ position: 'relative' }}
                                        onMouseEnter={() => setHoveredCard(record.id)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                    >
                                        {formatWords(record.words)}
                                        {hoveredCard === record.id && record.words && record.words.length > 0 && (
                                            <div className="word-tooltip" role="tooltip">
                                                <div className="tooltip-content">
                                                    {record.words.join(', ')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="history-date">
                                        {formatDate(record.timestamp)} · {record.speaker_name}
                                    </div>
                                </div>
                                <button
                                    className="play-action-btn"
                                    onClick={() => onPlay(record)}
                                    title="播放音频"
                                    aria-label={`播放由 ${record.speaker_name} 生成的音频`}
                                >
                                    ▶️
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span
                                    style={{ fontSize: '0.75rem', color: '#94a3b8' }}
                                    aria-label={`包含 ${record.word_count} 个单词`}
                                >
                                    {record.word_count} 个单词
                                </span>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', opacity: 0.8 }}
                                        onClick={() => onSaveToBook(record.words)}
                                        title="存入单词本"
                                        aria-label="将这些单词存入我的单词本"
                                    >
                                        📌 存入单词本
                                    </button>
                                    <button
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', opacity: 0.6 }}
                                        onClick={() => onDelete(record.id)}
                                        title="删除记录"
                                        aria-label="删除此条历史记录"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default History;
