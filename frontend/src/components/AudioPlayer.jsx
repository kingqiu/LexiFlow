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
                        <svg width="20" height="20" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                            <path d="M666.2 463.6c-13.6 0-24.8-10-24.8-22.3s11.1-22.3 24.8-22.3 24.8 10 24.8 22.3-11.2 22.3-24.8 22.3z m-158.4 0c-13.6 0-24.8-10-24.8-22.3s11.1-22.3 24.8-22.3 24.8 10 24.8 22.3-11.2 22.3-24.8 22.3zM826.9 368.5c0-109.9-106.3-199-237.2-199s-237.2 89.1-237.2 199c0 109.9 106.3 199 237.2 199 26.6 0 52.4-4.1 76.5-11.4l112.9 61c4.5 2.4 10.4-0.8 10.4-5.9v-90c46.7-36.9 77.4-90.8 77.4-152.7zM476.3 646.4c0-3.5 0.1-6.9 0.4-10.4-94.8-24.1-165.7-93.5-165.7-178 0-16.7 2.1-34.1 6.7-49.1C205.7 392.5 125 456.3 125 531.1c0 68 65.5 125.1 161 143.2v67.1c0 4.1 4.7 6.4 8 3.9l87.5-62.8c23.2 4.1 47.9 6.2 72.8 6.2 8.7 0 17.5-0.3 26.1-1 4.3 0.1 8.6 0.2 12.9 0.2 110.1-0.1 199.3-71.1 199.3-158.4 0-14.7-2.6-28.8-7.3-42.2-22.2 60.1-98 104.3-189 104.3-5 0-9.9-0.1-14.9-0.2z m-114-111.4c-11.2 0-20.2-8.1-20.2-18s9.1-18 20.2-18 20.2 8.1 20.2 18-9 18-20.2 18z m-129 0c-11.2 0-20.2-8.1-20.2-18s9.1-18 20.2-18 20.2 8.1 20.2 18-9.1 18-20.2 18z" fill="#07C160" />
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
