# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LexiFlow 是一个智能单词语音生成器，前后端分离架构：
- **前端**: React + Vite (端口 5173)
- **后端**: FastAPI + Python (端口 8000)
- **核心功能**: 批量生成单词朗读音频，集成 ListenHub TTS API

## 常用命令

### 启动服务
```bash
# 一键启动（推荐）
./start.sh

# 重启服务
./start.sh -restart

# 停止服务
./start.sh -stop

# 查看状态
./start.sh -status
```

### 手动启动
```bash
# 后端（需要先配置 .env）
cd backend && python main.py

# 前端
cd frontend && npm run dev
```

### 开发命令
```bash
# 前端构建
cd frontend && npm run build

# 安装依赖
cd backend && pip install -r requirements.txt
cd frontend && npm install
```

## 架构要点

### 后端服务层 (backend/services/)
- **listenhub.py** - ListenHub TTS API 集成，处理文本转语音
- **audio_processor.py** - 音频合成与处理（FFmpeg + pydub）
- **history.py** - 生成历史记录管理
- **wordbook.py** - 单词本功能
- **share.py** - 分享功能

### 前端组件 (frontend/src/components/)
主应用在 `App.jsx`，组件化设计

### 数据存储
- `backend/data/` - 历史记录、单词本等数据
- `OutputAudios/` - 生成的音频文件
- `InputDocs/` - 用户上传的文档

## 环境配置

后端需要配置 `.env` 文件：
```bash
cp backend/.env.example backend/.env
# 必须填入 ListenHub API Key
```

## 依赖要求
- Python 3.9+
- Node.js 18+
- FFmpeg（音频处理必需）
