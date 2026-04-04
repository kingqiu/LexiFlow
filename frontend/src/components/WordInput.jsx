import React, { useRef, useState } from 'react';

function WordInput({ text, onTextChange, onFileUpload, onImageExtract, wordCount, isLarge, warning, isExtracting }) {
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext === 'txt' || ext === 'md') {
                onFileUpload(file);
            } else {
                alert('仅支持 .txt 和 .md 文件');
            }
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    const handleImageClick = () => {
        imageInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageExtract(file);
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    };

    return (
        <div className="word-input-section">
            <h2 className="card-title">
                📝 输入内容
            </h2>

            <div
                className={`word-input-container ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <textarea
                    id="word_input"
                    name="word_input"
                    className="word-textarea"
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    placeholder="向 LexiFlow 输入您要听写的单词或短语，以回车或逗号分隔…"
                    autoComplete="off"
                    spellCheck="false"
                />

                <div className="input-bottom-bar">
                    <div className={`file-upload-mini ${isExtracting ? 'extracting' : ''}`} onClick={!isExtracting ? handleImageClick : undefined}>
                        <input
                            type="file"
                            ref={imageInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            capture="environment"
                        />
                        <span>{isExtracting ? '⏳ 识别中...' : '📷 拍照识字'}</span>
                    </div>

                    <div className="file-upload-mini" onClick={handleFileClick}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".txt,.md"
                        />
                        <span>📎 导入文件 (.txt, .md)</span>
                    </div>

                    <div className={`word-count ${isLarge ? 'warning' : ''}`}>
                        {wordCount} 个单词
                    </div>
                </div>
            </div>

            {/* Warning */}
            {warning && (
                <div className="status-message warning">
                    ⚠️ {warning}
                </div>
            )}
        </div>
    );
}

export default WordInput;
