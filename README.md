# LexiFlow

🎧 **LexiFlow** - 智能单词语音生成器，支持批量生成单词/词语的朗读音频。

## ✨ 功能特性

- 📷 **拍照识字** - 上传课本/练习册照片，由 AI（Gemini Vision）自动提取单词填入输入框
- 📝 **批量单词输入** - 支持直接输入或上传 TXT/MD 文件
- 🎙️ **多种音色选择** - 集成 ListenHub API，支持中英文多种音色
- 🔁 **自定义重复次数** - 每个单词可重复朗读 1-5 次
- ⏱️ **可调节间隔时间** - 灵活设置单词之间的间隔
- 📥 **音频下载** - 一键下载生成的 MP3 音频文件
- 📜 **历史记录** - 自动保存生成历史，方便回溯
- 📚 **单词本管理** - 保存常用词表，一键载入生成
- 🔗 **音频分享** - 生成含二维码的分享链接，支持手机扫码收听

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite |
| 后端 | FastAPI + Python |
| 音频处理 | FFmpeg + pydub |
| TTS 服务 | ListenHub API |
| 图片识字 | Google Gemini Vision API |

## 🚀 快速开始

### 环境要求

- Python 3.9+
- Node.js 18+
- FFmpeg (用于音频处理)

### 安装依赖

```bash
# 后端依赖
cd backend
pip install -r requirements.txt

# 前端依赖
cd frontend
npm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑 .env 文件，填入以下配置：
# LISTENHUB_API_KEY=...   (必填，TTS 服务)
# GEMINI_API_KEY=...      (必填，拍照识字功能)
# INVITE_CODES=CODE1,CODE2,CODE3  (邀请码列表，逗号分隔)
```

### 启动服务

使用一键启动脚本：

```bash
# 启动服务
./start.sh

# 重启服务
./start.sh -restart

# 停止服务
./start.sh -stop

# 查看服务状态
./start.sh -status

# 查看帮助
./start.sh -help
```

或手动分别启动：

```bash
# 终端 1: 启动后端
cd backend
python main.py

# 终端 2: 启动前端
cd frontend
npm run dev
```

### 访问应用

| 服务 | 地址 |
|------|------|
| 🎨 前端界面 | http://localhost:5173 |
| 📦 后端 API | http://localhost:8000 |
| 📚 API 文档 | http://localhost:8000/docs |

## 📁 项目结构

```
LexiFlow/
├── backend/                # 后端服务
│   ├── main.py            # FastAPI 主应用
│   ├── services/          # 业务逻辑服务
│   │   ├── listenhub.py   # ListenHub TTS 集成
│   │   ├── audio_processor.py  # 音频处理
│   │   └── history.py     # 历史记录管理
│   ├── utils/             # 工具函数
│   ├── data/              # 数据存储
│   └── requirements.txt   # Python 依赖
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── App.jsx        # 主组件
│   │   ├── components/    # React 组件
│   │   └── styles/        # 样式文件
│   └── package.json       # Node 依赖
├── InputDocs/             # 输入文档目录
├── OutputAudios/          # 生成的音频目录
├── start.sh               # 一键启动脚本
└── README.md              # 项目说明
```

## 🎨 设计语言

LexiFlow 采用「**优雅笔记本**」设计美学，专为家长帮孩子准备听写的场景打造：

- **配色**：米白纸张底色 + 橄榄绿主色 + 赤陶橙点缀
- **字体**：Cormorant Garamond（标题）+ DM Sans（正文）
- **视觉**：笔记本格纹背景、精致细边框卡片、便签样式单词标签
- **额度显示**：输入区标题栏实时显示剩余额度，不够时红色预警

## 📝 使用说明

1. **输入内容** — 第一步：输入或拍照导入听写单词
2. **生成设置** — 第二步：选择音色、重复次数、间隔时长
3. **立即创作** — 点击按钮生成音频
4. **下载/分享** — 试听满意后下载 MP3 或生成分享链接

> 额度不足时，输入区标题右侧会显示红色警告提示

## 🔧 管理命令

### 查看邀请码使用统计

```bash
cd backend
python stats.py
```

显示内容：
- 每个邀请码的使用情况（分配对象、绑定设备、使用量）
- 每日使用明细（最近7天）
- 生成失败记录
- 总体统计数据

### 生成新的邀请码

```bash
cd backend
python generate_codes.py
```

## 📄 License

MIT License
