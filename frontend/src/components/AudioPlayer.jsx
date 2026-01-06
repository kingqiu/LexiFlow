import React from 'react';

function AudioPlayer({ audioUrl, filename, result }) {
    const handleShare = async () => {
        if (!navigator.share) {
            alert('当前浏览器不支持直接分享，请手动下载后转发。');
            return;
        }

        try {
            const response = await fetch(audioUrl);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: 'audio/mpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'LexiFlow 听写音频',
                    text: '我为你生成了一段听写音频，请查收。'
                });
            } else {
                alert('您的浏览器不支持分享此类文件，请尝试手动下载。');
            }
        } catch (err) {
            console.error('Sharing failed:', err);
            // Fallback for browsers that support sharing but fail for specific reasons
            try {
                await navigator.share({
                    title: 'LexiFlow 听写音频',
                    url: window.location.href,
                    text: `音频已生成: ${filename}`
                });
            } catch (innerErr) {
                alert('分享失败，建议您手动下载音频进行转发。');
            }
        }
    };

    return (
        <div className="card audio-result-card">
            <div className="result-header">
                <div className="success-badge">
                    ✨ 生成成功
                </div>
                <div className="action-group">
                    <button className="action-btn" onClick={handleShare}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '2px' }}>
                            <path d="M8.5 13.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm4 0c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM16.5 11.5c0 2.76-2.69 5-6 5-.81 0-1.58-.13-2.28-.37L6 17.5l.58-1.92c-1.8-1.1-2.91-2.85-2.91-4.75V10.5C3.67 7.74 6.36 5.5 9.67 5.5S15.67 7.74 15.67 10.5V11.5H16.5zm4.5 2.17c0 1.74-1.31 3.26-3.41 4l-.42 1.45-1.83-.82c-.55.13-1.13.2-1.74.2-1.21 0-2.33-.27-3.25-.74 1.76-.82 2.91-2.08 2.91-3.49 0-2.06-2.16-3.73-4.83-3.73h.08c3 0 5.5 1.86 5.5 4.15 0 1.34-.82 2.53-2.08 3.32l1.67.75-.42-1.4c2-1.1 3.42-2.8 3.42-4.72 0-1.18-.58-2.26-1.58-3.08.08.2.13.4.13.63C18.42 13.33 21 13.67 21 13.67z" fill="#07C160" />
                        </svg>
                        分享音频
                    </button>
                    <a href={audioUrl} className="action-btn" download={filename}>
                        📥 下载音频
                    </a>
                </div>
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
