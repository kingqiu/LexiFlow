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
                    <button className="action-btn" onClick={handleShare} style={{ gap: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, shapeRendering: 'geometricPrecision' }}>
                            <path d="M8.5 13.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm4 0a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM16.5 11.5c0 2.761-2.686 5-6 5a6.007 6.007 0 0 1-2.28-.45L6 17.5l.583-1.92a4.915 4.915 0 0 1-2.916-4.58V11c0-2.761 2.686-5 6-5s6 2.239 6 5v.5zm4.5 2.167c0 1.745-1.312 3.265-3.417 4l-.417 1.45-1.833-.817c-.551.134-1.132.2-1.742.2-1.21 0-2.33-.27-3.25-.74 1.76-.82 2.91-2.08 2.91-3.49 0-2.064-2.165-3.733-4.834-3.733h.083c3 0 5.5 1.866 5.5 4.15 0 1.343-.816 2.533-2.083 3.317l1.667.75-.417-1.4c2-1.096 3.417-2.796 3.417-4.717 0-1.183-.584-2.261-1.583-3.084.083.2.133.4.133.634 0 1.25-.796 2.366-2.033 3.116 1.566.1 2.9.892 2.9 1.934z" fill="#07C160" />
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
