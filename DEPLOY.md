# 部署到 zhangsjqaq.vexr.dev

本项目使用 SQLite + 本地上传，适合部署到 **Render Web Service**（单机常驻进程）。不建议用 Vercel Serverless（数据库和上传会丢）。

## 一、推到 GitHub

在 `personal-portfolio` 目录：

```powershell
cd d:\deep-learning\code\personal-portfolio
git init
git add .
git commit -m "Prepare portfolio for Render deploy"
```

到 https://github.com/new 新建仓库（例如 `personal-portfolio`），然后：

```powershell
git remote add origin https://github.com/你的用户名/personal-portfolio.git
git branch -M main
git push -u origin main
```

## 二、Render 部署

1. 打开 https://render.com ，用 GitHub 登录  
2. **New → Web Service** → 选择该仓库  
3. 设置：

| 项 | 值 |
|----|----|
| Name | `personal-portfolio` |
| Region | Singapore（或离你近的） |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run build` |
| Start Command | `npm start` |
| Instance | Free |

4. Environment Variables：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `file:./dev.db` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | 自己设一个强密码 |
| `NODE_VERSION` | `20` |

5. 点 **Create Web Service**，等构建成功。  
   你会得到类似：`https://personal-portfolio-xxxx.onrender.com`

> Free 实例会休眠，首次打开可能要等 30–60 秒。

## 三、绑定 zhangsjqaq.vexr.dev

### 1）在 vexr.dev 加 DNS

登录 https://vexr.dev → DNS Management，添加：

| Type | Name | Value |
|------|------|-------|
| `CNAME` | `@`（或按面板要求留空/根） | `personal-portfolio-xxxx.onrender.com` |

Value **不要**带 `https://`，换成你 Render 真实主机名。

### 2）在 Render 加自定义域名

Render 服务 → **Settings → Custom Domains** → Add：

`zhangsjqaq.vexr.dev`

按提示确认 DNS。生效通常几分钟到几十分钟。

## 四、验证

- 前台：https://zhangsjqaq.vexr.dev  
- 后台：https://zhangsjqaq.vexr.dev/admin  

用你在 Render 环境变量里设的管理员密码登录。

## 注意

- Render Free **重新部署后** SQLite / 上传文件可能重置；首次部署已自动 seed。之后改内容尽量在后台改，或本地改完再 `FORCE_SEED=1 npm run db:seed` 后重新部署。  
- 长期正式使用建议升级磁盘方案，或改用 Turso / PostgreSQL + 云存储。
