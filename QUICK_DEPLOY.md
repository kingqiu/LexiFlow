# 🚀 LexiFlow 快速部署指南

克克，所有代码已经准备好了！现在只需要3个步骤就能部署上线。

## 📋 你已经完成的工作

✅ 后端邀请码系统（验证、每日限额50个单词、使用记录）
✅ 前端邀请码输入界面
✅ 生成了10个邀请码
✅ 部署配置文件（Railway + Vercel）

## 🎯 接下来的3个步骤

### 步骤1：部署后端到 Railway（5分钟）

1. 访问 https://railway.app 并登录（用 GitHub 账号）
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择 LexiFlow 仓库
4. Railway 会自动检测并开始部署
5. 部署完成后，点击项目 → "Settings" → "Environment"
6. 添加环境变量：
   ```
   LISTENHUB_API_KEY=你的ListenHub API Key
   ```
7. 保存后 Railway 会自动重新部署
8. 部署完成后，点击 "Deployments" → 最新部署 → 复制域名（类似 `lexiflow-production.up.railway.app`）

### 步骤2：部署前端到 Vercel（5分钟）

1. 访问 https://vercel.com 并登录（用 GitHub 账号）
2. 点击 "Add New Project" → 选择 LexiFlow 仓库
3. 配置项目：
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 添加环境变量：
   ```
   VITE_API_BASE=https://你的Railway域名/api
   ```
   （把步骤1复制的域名填进去，记得加 `/api`）
5. 点击 "Deploy"
6. 部署完成后，Vercel 会给你一个 URL（类似 `lexiflow.vercel.app`）

### 步骤3：测试并发给朋友（今天）

1. 访问 Vercel 给你的 URL
2. 输入一个邀请码测试（比如 `G-NR2UZA`）
3. 试着生成几个单词的音频
4. 如果一切正常，把链接和邀请码发给3个朋友：

**发给朋友的消息模板：**
```
嘿，我做了个小工具帮你给孩子做听写训练，试试看：

🔗 链接：https://你的域名.vercel.app
🎫 邀请码：[给他一个独立的码]

每天可以生成50个单词，够用了。
试试看好不好用，有问题随时跟我说！
```

## 📝 10个邀请码

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

建议：给每个朋友一个独立的码，这样你能知道谁在用、用了多少。

## 🔍 验证部署

**后端健康检查：**
访问 `https://你的Railway域名/api/health`
应该返回：`{"status":"ok","service":"LexiFlow API"}`

**前端测试：**
1. 打开 Vercel URL
2. 应该看到邀请码输入界面
3. 输入任意邀请码
4. 应该能看到主界面和"今日剩余额度：50个单词"

## ⚠️ 常见问题

**Q: Railway 构建失败？**
A: 检查 `backend/requirements.txt` 是否完整，确保 Python 版本正确

**Q: 前端无法连接后端？**
A: 检查 Vercel 环境变量 `VITE_API_BASE` 是否正确，确保包含 `/api`

**Q: 邀请码验证失败？**
A: 确保 Railway 已经部署了 `backend/data/invite_codes.json` 文件

## 📊 一周后的任务

7天后，问你的3个朋友：
1. 你用了几次？
2. 最麻烦的是哪一步？
3. 愿意每月付15元继续用吗？

根据他们的回答，再决定下一步。

---

**需要帮助？** 随时问我！

祝部署顺利！🎉
