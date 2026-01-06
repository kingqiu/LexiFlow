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
                    <button className="action-btn" onClick={handleShare} style={{ gap: '6px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, transform: 'translateZ(0)', shapeRendering: 'geometricPrecision' }}>
                            <path d="M15.333 11.333c0-2.833-2.733-5.166-6.083-5.166S3.167 8.5 3.167 11.333c0 1.95 1.283 3.65 3.25 4.6l-.583 1.917L8.167 17a9.412 9.412 0 0 0 2.25-.267c-.033-.333-.083-.65-.083-.983 0-3.083 2.75-5.583 6.167-5.583.133 0 .266.017.399.033v-1.033zm-4.333-1c-.267 0-.5-.217-.5-.5s.233-.5.5-.5.5.217.5.5-.233.5-.5.5zm4.333 0c-.267 0-.5-.217-.5-.5s.233-.5.5-.5.5.217.5.5-.233.5-.5.5zm1.5 1.667c-2.75 0-5 2.017-5 4.5s2.25 4.5 5 4.5c.617 0 1.2-.1 1.75-.283l1.533.683-.416-1.333c1.55-.834 2.133-2.184 2.133-3.567 0-2.483-2.25-4.5-5-4.5zm-1.667 4.166c-.25 0-.416-.25-.416-.5s.166-.417.416-.417.417.167.417.417-.167.5-.417.5zm3.334 0c-.25 0-.417-.25-.417-.5s.167-.417.417-.417.416.167.416.417-.166.5-.416.5z" fill="#07C160" />
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
