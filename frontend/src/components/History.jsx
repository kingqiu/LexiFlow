import React from 'react';

function History({ records, onPlay, onDelete }) {
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
        return words.length > 3 ? `${preview}...` : preview;
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
                        <div key={record.id} className="history-card">
                            <div className="history-card-top">
                                <div className="history-info">
                                    <div className="history-title" title={record.words?.join(', ')}>
                                        {formatWords(record.words)}
                                    </div>
                                    <div className="history-date">
                                        {formatDate(record.timestamp)} · {record.speaker_name}
                                    </div>
                                </div>
                                <button
                                    className="play-action-btn"
                                    onClick={() => onPlay(record)}
                                    title="播放"
                                >
                                    ▶️
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{record.word_count}个单词</span>
                                <button
                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', opacity: 0.6 }}
                                    onClick={() => onDelete(record.id)}
                                >
                                    删除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default History;
