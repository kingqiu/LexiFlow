# LexiFlow 部署指南

## 后端部署到 Railway

### 1. 准备工作
- 注册 Railway 账号：https://railway.app
- 安装 Railway CLI（可选）：`npm install -g @railway/cli`

### 2. 通过 Railway 网页部署

1. 登录 Railway：https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权并选择 LexiFlow 仓库
5. Railway 会自动检测到 Python 项目

### 3. 配置环境变量

在 Railway 项目设置中添加以下环境变量：

```
LISTENHUB_API_KEY=你的ListenHub API Key
PORT=8000
```

### 4. 配置启动命令

Railway 会自动使用 `Procfile` 中的命令：
```
web: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 5. 部署

- Railway 会自动构建和部署
- 部署完成后会得到一个 URL，类似：`https://lexiflow-production.up.railway.app`

### 6. 验证部署

访问：`https://你的域名.railway.app/api/health`

应该返回：
```json
{"status": "ok", "service": "LexiFlow API"}
```

---

## 前端部署到 Vercel

### 1. 准备工作
- 注册 Vercel 账号：https://vercel.com
- 安装 Vercel CLI（可选）：`npm install -g vercel`

### 2. 配置前端 API 地址

修改 `frontend/src/App.jsx` 中的 API_BASE：

```javascript
const API_BASE = 'https://你的Railway域名.railway.app/api';
```

或者使用环境变量（推荐）：

创建 `frontend/.env.production`：
```
VITE_API_BASE=https://你的Railway域名.railway.app/api
```

然后修改 `App.jsx`：
```javascript
const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000/api`;
```

### 3. 通过 Vercel 网页部署

1. 登录 Vercel：https://vercel.com
2. 点击 "Add New Project"
3. 导入 LexiFlow 仓库
4. 配置项目：
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 4. 配置环境变量

在 Vercel 项目设置中添加：
```
VITE_API_BASE=https://你的Railway域名.railway.app/api
```

### 5. 部署

- Vercel 会自动构建和部署
- 部署完成后会得到一个 URL，类似：`https://lexiflow.vercel.app`

### 6. 验证部署

访问 Vercel 提供的 URL，应该能看到 LexiFlow 界面

---

## 邀请码

已生成的邀请码（在 `backend/data/invite_codes.json`）：

```
G-NR2UZA
06GE5AGU
GQZBMBZT
HWASOEYG
6IBDD8YJ
DPK1AVJV
MUHNYVRC
L1L8WN4B
8W2SI0OK
FUKYJG8E
```

每个邀请码每天可生成 50 个单词。

---

## 故障排查

### 后端问题

1. **Railway 构建失败**
   - 检查 `requirements.txt` 是否完整
   - 检查 Python 版本（runtime.txt）

2. **API 调用失败**
   - 检查 LISTENHUB_API_KEY 环境变量
   - 检查 Railway 日志

### 前端问题

1. **无法连接后端**
   - 检查 API_BASE 配置
   - 检查 CORS 设置（后端 main.py）

2. **邀请码验证失败**
   - 确保后端已部署 invite_codes.json
   - 检查后端日志

---

## 下一步

部署完成后：

1. 把 Vercel URL 发给朋友
2. 给每个朋友一个独立的邀请码
3. 一周后收集反馈
