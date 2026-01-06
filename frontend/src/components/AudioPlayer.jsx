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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px', shapeRendering: 'geometricPrecision' }}>
                            <path d="M8.75 14.25c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zm4.5 0c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zM17.5 12c0 2.4-2.5 4.5-5.5 4.5-.8 0-1.6-.2-2.3-.5L7 17l.5-2c-1.5-1-2.5-2.5-2.5-4 0-2.4 2.5-4.5 5.5-4.5s5.5 2.1 5.5 4.5V12h2zm4.5 2.2c0 1.9-1.3 3.5-3.5 4l.3 1.3-1.8-.8c-.6.1-1.2.2-1.9.2-1 0-1.9-.2-2.7-.6 1.8-.8 3-2.1 3-3.6 0-2.1-2.2-3.8-5-3.8h.1c3 0 5.5 1.9 5.5 4.2 0 1.3-.8 2.5-2 3.3l1.5.7-.3-1.4c1.8-.5 3.3-1.8 3.3-3.5 0-1.2-.8-2.3-2.1-3 .1.1.1.3.1.5C22 10 21 8.5 19.5 7.5c1.5 1 2.5 2.5 2.5 4.2v.5z" fill="#07C160" />
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
