import React from 'react';

function AudioPlayer({ audioUrl, filename, result }) {
    return (
        <div className="card audio-result-card">
            <div className="result-header">
                <div className="success-badge">
                    ✨ 生成成功
                </div>
                <a href={audioUrl} className="download-link" download={filename}>
                    📥 下载音频
                </a>
            </div>

            {/* Audio Controls */}
            <div className="audio-controls" style={{ marginBottom: '20px' }}>
                <audio
                    className="audio-player-simple"
                    controls
                    src={audioUrl}
                    preload="metadata"
                />
            </div>

            {/* Generation Stats */}
            {result && (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', fontSize: '0.9rem' }}>
                    <p style={{ color: '#475569', fontWeight: '500' }}>{result.message}</p>
                    {result.failedCount > 0 && (
                        <p style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                            未能识别: {result.failedWords.join(', ')}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default AudioPlayer;
