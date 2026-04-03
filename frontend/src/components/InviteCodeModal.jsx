import React, { useState, useEffect } from 'react';
import { generateDeviceId } from '../utils/deviceId';

const InviteCodeModal = ({ onCodeValidated }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000/api`;

    useEffect(() => {
        // Check if code exists in localStorage
        const savedCode = localStorage.getItem('invite_code');
        if (savedCode) {
            // Validate saved code
            validateCode(savedCode, true);
        }
    }, []);

    const validateCode = async (codeToValidate, isSavedCode = false) => {
        setIsValidating(true);
        setError('');

        try {
            const deviceId = generateDeviceId();
            const formData = new FormData();
            formData.append('code', codeToValidate);
            formData.append('device_id', deviceId);

            const response = await fetch(`${API_BASE}/validate-invite-code`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || '邀请码验证失败');
            }

            const data = await response.json();

            // Save to localStorage
            localStorage.setItem('invite_code', codeToValidate);

            // Notify parent
            onCodeValidated(codeToValidate, data.remaining_quota);

        } catch (err) {
            setError(err.message);
            if (isSavedCode) {
                // Clear invalid saved code
                localStorage.removeItem('invite_code');
            }
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('请输入邀请码');
            return;
        }
        validateCode(code.trim());
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2 style={styles.title}>🎧 欢迎使用 LexiFlow</h2>
                <p style={styles.subtitle}>请输入邀请码以继续</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="输入邀请码"
                        style={styles.input}
                        disabled={isValidating}
                        autoFocus
                    />

                    {error && (
                        <div style={styles.error}>{error}</div>
                    )}

                    <button
                        type="submit"
                        style={styles.button}
                        disabled={isValidating}
                    >
                        {isValidating ? '验证中...' : '验证邀请码'}
                    </button>
                </form>

                <div style={styles.hint}>
                    <p>💡 提示：</p>
                    <ul>
                        <li>每个邀请码每天可生成 50 个单词</li>
                        <li>每个邀请码只能绑定一台设备使用</li>
                        <li>换设备或清除缓存后需重新输入</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    },
    title: {
        margin: '0 0 8px 0',
        fontSize: '24px',
        textAlign: 'center',
        color: '#333'
    },
    subtitle: {
        margin: '0 0 24px 0',
        fontSize: '14px',
        textAlign: 'center',
        color: '#666'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    input: {
        padding: '12px',
        fontSize: '16px',
        border: '2px solid #ddd',
        borderRadius: '8px',
        textAlign: 'center',
        letterSpacing: '2px',
        fontFamily: 'monospace',
        textTransform: 'uppercase'
    },
    button: {
        padding: '12px',
        fontSize: '16px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    error: {
        padding: '12px',
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderRadius: '8px',
        fontSize: '14px',
        textAlign: 'center'
    },
    hint: {
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#666'
    }
};

export default InviteCodeModal;
