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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '2px' }}>
                            <path d="M8.5 13.5C8.22386 13.5 8 13.2761 8 13C8 12.7239 8.22386 12.5 8.5 12.5C8.77614 12.5 9 12.7239 9 13C9 13.2761 8.77614 13.5 8.5 13.5ZM12.5 13.5C12.2239 13.5 12 13.2761 12 13C12 12.7239 12.2239 12.5 12.5 12.5C12.7761 12.5 13 12.7239 13 13C13 13.2761 12.7761 13.5 12.5 13.5ZM16.3333 11.3333C16.3333 14.15 13.6167 16.4167 10.25 16.4167C9.36667 16.4167 8.53333 16.2667 7.78333 16L5.5 17L6.08333 15.0833C4.28333 13.9833 3.16667 12.2333 3.16667 10.25C3.16667 7.43333 5.88333 5.16667 9.25 5.16667C12.6167 5.16667 15.3333 7.43333 15.3333 10.25V11.3333H16.3333ZM20.8333 13.5C20.8333 11.75 19.8667 10.1833 18.2833 9.16667C18.3167 9.51667 18.3333 9.88333 18.3333 10.25C18.3333 13.3333 15.5833 15.8333 12.1667 15.8333C11.6667 15.8333 11.1833 15.7833 10.7167 15.7C11.5833 16.8167 13.0167 17.5833 14.6667 17.5833C15.2833 17.5833 15.8833 17.5167 16.4333 17.3833L18.0833 18.0833L17.6667 16.6333C19.5833 15.8333 20.8333 14.7667 20.8333 13.5Z" fill="#07C160" />
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
