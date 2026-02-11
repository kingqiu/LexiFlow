import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

function ShareModal({ shareUrl, audioUrl, filename, onClose }) {
    const [copied, setCopied] = useState(false);
    const qrCanvasRef = useRef(null);

    useEffect(() => {
        if (shareUrl && qrCanvasRef.current) {
            QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#334155',
                    light: '#ffffff',
                },
            });
        }
    }, [shareUrl]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNativeShare = async () => {
        if (!navigator.share) return;

        try {
            await navigator.share({
                title: 'LexiFlow 听写音频',
                text: '我为你生成了一段听写音频，点击链接即可播放。',
                url: shareUrl,
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">🔗 分享听写音频</h3>

                <div className="share-link-section">
                    <div className="share-link-row">
                        <input
                            className="share-link-input"
                            type="text"
                            value={shareUrl}
                            readOnly
                            onClick={e => e.target.select()}
                        />
                        <button
                            className={`share-copy-btn ${copied ? 'copied' : ''}`}
                            onClick={handleCopy}
                        >
                            {copied ? '✓ 已复制' : '📋 复制'}
                        </button>
                    </div>
                </div>

                <div className="share-qr-section">
                    <canvas ref={qrCanvasRef} className="share-qr-canvas" />
                    <p className="share-qr-hint">手机扫码即可播放</p>
                </div>

                <div className="share-actions">
                    {navigator.share && (
                        <button className="share-action-item" onClick={handleNativeShare}>
                            <span className="share-action-icon">📤</span>
                            <span>系统分享</span>
                        </button>
                    )}
                    <a href={audioUrl} className="share-action-item" download={filename}>
                        <span className="share-action-icon">📥</span>
                        <span>下载音频</span>
                    </a>
                </div>

                <div className="modal-actions">
                    <button className="modal-btn cancel" onClick={onClose}>
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
