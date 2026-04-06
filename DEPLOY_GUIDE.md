# 🎯 LexiFlow 网页部署教程（10分钟搞定）

克克，跟着这个教程一步步做，10分钟就能部署好。

---

## 第一部分：部署后端到 Railway（5分钟）

### 1. 注册 Railway 账号

1. 打开浏览器，访问：https://railway.app
2. 点击右上角 **"Login"**
3. 选择 **"Login with GitHub"**（用你的 GitHub 账号登录）
4. 授权 Railway 访问你的 GitHub

### 2. 创建新项目

1. 登录后，点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 如果是第一次，需要点击 **"Configure GitHub App"** 授权
4. 在弹出的窗口中，找到并选择 **"LexiFlow"** 仓库
5. 点击 **"Deploy Now"**

### 3. 等待自动部署

Railway 会自动：
- 检测到这是 Python 项目
- 读取 `Procfile` 和 `requirements.txt`
- 开始构建和部署

你会看到一个构建日志界面，等待几分钟直到显示 **"Success"**。

### 4. 配置环境变量（重要！）

1. 在项目页面，点击你的服务（应该叫 "LexiFlow" 或 "web"）
2. 点击顶部的 **"Variables"** 标签
3. 点击 **"+ New Variable"**
4. 添加：
   ```
   Variable: LISTENHUB_API_KEY
   Value: 你的ListenHub API Key
   ```
5. 点击 **"Add"**

Railway 会自动重新部署。

### 5. 获取后端 URL

1. 等待重新部署完成（大约1分钟）
2. 点击 **"Settings"** 标签
3. 找到 **"Domains"** 部分
4. 点击 **"Generate Domain"**
5. Railway 会生成一个域名，类似：
   ```
   lexiflow-production-xxxx.up.railway.app
   ```
6. **复制这个域名**（后面要用）

### 6. 验证后端

在浏览器打开：
```
https://你的Railway域名/api/health
```

应该看到：
```json
{"status":"ok","service":"LexiFlow API"}
```

如果看到这个，说明后端部署成功了！✅

---

## 第二部分：部署前端到 Vercel（5分钟）

### 1. 注册 Vercel 账号

1. 打开浏览器，访问：https://vercel.com
2. 点击右上角 **"Sign Up"**
3. 选择 **"Continue with GitHub"**
4. 授权 Vercel 访问你的 GitHub

### 2. 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在 **"Import Git Repository"** 下找到 **"LexiFlow"**
3. 点击 **"Import"**

### 3. 配置项目

在配置页面：

**Framework Preset:**
- 选择 **"Vite"**

**Root Directory:**
- 点击 **"Edit"**
- 输入：`frontend`
- 点击 **"Continue"**

**Build and Output Settings:**
- Build Command: `npm run build`（默认就是这个）
- Output Directory: `dist`（默认就是这个）

### 4. 添加环境变量（重要！）

在同一个配置页面，往下滚动找到 **"Environment Variables"**：

1. 点击展开
2. 添加：
   ```
   Name: VITE_API_BASE
   Value: https://你的Railway域名/api
   ```
   （把第一部分第5步复制的域名填进去，记得加 `/api`）
3. 确保选择了 **"Production"**

### 5. 部署

1. 点击页面底部的 **"Deploy"**
2. Vercel 会开始构建，大约2-3分钟
3. 等待直到看到 **"Congratulations!"** 页面

### 6. 获取前端 URL

部署成功后，Vercel 会显示你的网站地址，类似：
```
https://lexiflow-xxxx.vercel.app
```

点击 **"Visit"** 或直接访问这个 URL。

### 7. 验证前端

1. 打开 Vercel 给你的 URL
2. 应该看到邀请码输入界面
3. 输入一个邀请码
4. 应该能进入主界面，看到 "今日剩余额度：50个单词"

如果看到这个，说明前端部署成功了！✅

---

## 第三部分：测试完整流程（2分钟）

1. 在前端界面输入几个单词，比如：
   ```
   apple
   banana
   orange
   ```

2. 选择音色，点击 **"生成音频"**

3. 等待几秒，应该能听到生成的音频

4. 如果一切正常，恭喜你部署成功了！🎉

---

## 🎫 邀请码

邀请码通过 VPS 上的 `.env` 文件配置（`INVITE_CODES` 环境变量），不在代码仓库中存储。

---

## 📱 发给朋友

把这个消息发给你的3个朋友：

```
嘿，我做了个小工具帮你给孩子做听写训练，试试看：

🔗 链接：https://你的Vercel域名.vercel.app
🎫 邀请码：[给他一个独立的码]

每天可以生成50个单词，够用了。
试试看好不好用，有问题随时跟我说！
```

---

## ❓ 遇到问题？

### 后端问题

**Q: Railway 构建失败，显示 "Error installing requirements"**
A: 检查 `backend/requirements.txt` 文件是否存在，确保所有依赖都列出来了

**Q: 访问 /api/health 显示 404**
A: 检查 Railway 的 Procfile 是否正确，应该是：
```
web: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Q: 邀请码验证失败**
A: 确保 `backend/data/invite_codes.json` 文件已经提交到 git 并推送到 GitHub

### 前端问题

**Q: Vercel 构建失败**
A: 检查 `frontend/package.json` 是否存在，确保 `npm install` 能正常运行

**Q: 前端打开后显示 "无法连接后端"**
A: 检查 Vercel 的环境变量 `VITE_API_BASE` 是否正确设置，确保包含 `/api`

**Q: 邀请码输入后没反应**
A: 打开浏览器开发者工具（F12），查看 Console 是否有错误信息

---

## 📊 一周后的任务

7天后，问你的3个朋友：
1. 你用了几次？
2. 最麻烦的是哪一步？
3. 愿意每月付15元继续用吗？

根据他们的回答，再决定下一步。

---

**需要帮助？** 随时问我！

祝部署顺利！🎉
