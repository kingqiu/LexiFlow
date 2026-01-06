import React from 'react';

const REPEAT_OPTIONS = [1, 2, 3, 4, 5];
const INTERVAL_OPTIONS = [2, 3, 5, 8, 10];

function SettingsPanel({
    speakers,
    selectedSpeaker,
    onSpeakerChange,
    repeatCount,
    onRepeatChange,
    intervalSeconds,
    onIntervalChange,
    onGenerate,
    isGenerating,
    disabled
}) {
    return (
        <div className="card settings-panel">
            <h2 className="card-title">
                ⚙️ 生成设置
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                {/* Speaker Selection */}
                <div className="setting-group">
                    <label className="setting-label">选择音色</label>
                    <select
                        className="clean-select"
                        value={selectedSpeaker?.id || ''}
                        onChange={(e) => {
                            const speaker = speakers.find(s => s.id === e.target.value);
                            onSpeakerChange(speaker);
                        }}
                    >
                        {speakers.map(speaker => (
                            <option key={speaker.id} value={speaker.id}>
                                {speaker.name} ({speaker.language === 'zh' ? '中文' : speaker.language === 'en' ? '英文' : speaker.language})
                            </option>
                        ))}
                    </select>
                    <p style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                        💡 系统将根据内容自动匹配地道的中/英文配音。
                    </p>
                </div>

                {/* Repeat Count */}
                <div className="setting-group">
                    <label className="setting-label">重复次数</label>
                    <div className="option-tabs">
                        {REPEAT_OPTIONS.map(count => (
                            <button
                                key={count}
                                className={`tab-item ${repeatCount === count ? 'active' : ''}`}
                                onClick={() => onRepeatChange(count)}
                            >
                                {count}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interval */}
                <div className="setting-group">
                    <label className="setting-label">间隔时长</label>
                    <div className="option-tabs">
                        {INTERVAL_OPTIONS.map(seconds => (
                            <button
                                key={seconds}
                                className={`tab-item ${intervalSeconds === seconds ? 'active' : ''}`}
                                onClick={() => onIntervalChange(seconds)}
                            >
                                {seconds}s
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <button
                className="create-btn"
                onClick={onGenerate}
                disabled={disabled || isGenerating}
            >
                {isGenerating ? (
                    <>
                        <span className="spinner-white"></span>
                        正在努力生成中...
                    </>
                ) : (
                    <>
                        🚀 立即创作音频
                    </>
                )}
            </button>
        </div>
    );
}

export default SettingsPanel;
