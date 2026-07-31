# 部署到 zhangsjqaq.vexr.dev

本项目使用 SQLite，适合部署到 **Render Web Service**。头像/封面以压缩后的 data URL 写入数据库，不依赖本地磁盘。

## 内容怎么改才不会丢

**日常改站点内容：只在后台改。** 保存作品后会自动「保护」；部署 / 默认同步**不会**覆盖已有作品、头像、赞助码、反馈与点击数据。

| 操作 | 是否覆盖后台已改内容 |
|------|----------------------|
| `git push` 自动部署 + `db:seed`（`FORCE_SEED=0`） | 否，只补缺失作品；资料不覆盖 |
| 后台「立即同步」（默认） | 否，同上 |
| 后台勾选「强制覆盖已锁定」 | 会覆盖作品文案（危险） |
| `FORCE_SEED=1` 构建 | 仅覆盖**未保护**作品 |

站点：https://zhangsjqaq.vexr.dev  
仓库：https://github.com/Az0998/personal-portfolio

挂载演示：

- `/hydrobench` — **智慧水利**（主导航一页三签）：水情态势 / 室内台 / 户外台
- `/hydro` → 重定向到 `/hydrobench?tab=info`
- `/temp-files` — 临时文件柜
- `/novel-studio` — Novel Studio（作品进入）
- `/yili` — 易理占筮（作品进入）

### 数据 / 缓存分层（勿混用）

| 层 | 位置 | 说明 |
|----|------|------|
| 个人资料 + 作品 | Prisma（SQLite） | 后台全面管理；seed **不覆盖**已有；作品可锁定 |
| 意见反馈 | `Feedback` 表 | 前台表单 → 后台「意见反馈」 |
| 点击 / 注意力 | `AnalyticsEvent` 表 | 前台埋点 → 后台「点击/注意力」 |
| 临时文件柜 | SQLite + `data/temp-files/` | Render Free 重部署可能丢磁盘文件 |
| HydroBench | `localStorage` `hydrobench:*` | 不上云 |
| Novel Studio | `novel-studio-web-demo-v1` | 不上云 |
| HydroInfo | `public/hydro/*.json` | 静态包 |

> Render Free 实例**整盘重部署**仍可能重置 SQLite 文件本身。若需跨部署永久保留，请把 `DATABASE_URL` 换到 [Turso](https://turso.tech) / Neon，或挂付费持久盘。代码层已保证「版本同步」不会抹掉后台内容。

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
- 临时文件柜依赖本机磁盘：过期会自动删，但 **Redeploy 也会清空未过期文件**。需要跨部署保留时，接 Cloudflare R2（见下方）。
- 长期正式使用建议升级磁盘方案，或改用 Turso / PostgreSQL + 云存储。

## 五、可免费接入的服务（推荐）

| 用途 | 服务 | 免费额度（约） | 和本站怎么配合 |
|------|------|----------------|----------------|
| **站点主机（已在用）** | [Render](https://render.com) Web Service | 免费实例会休眠 | 当前 `render.yaml` / Node + SQLite |
| **对象存储（临时文件持久化）** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) | 10 GB 存储 + 每月出站免费额度 | 以后把 `data/temp-files` 换成 R2；国内访问也可挂自定义域名 |
| **数据库托管** | [Turso](https://turso.tech) / [Neon](https://neon.tech) | 免费 SQLite/Postgres 层 | 解决 Render 重部署丢库 |
| **边缘/静态备选** | [Cloudflare Pages](https://pages.cloudflare.com) | 免费 | 纯静态友好；本站有 Node API+SQLite，不如继续用 Render |
| **Hobby 备选** | [Railway](https://railway.app) / [Fly.io](https://fly.io) | 有试用额度 | 可挂持久卷，比 Render Free 更适合文件柜 |
| **域名** | 已有 `vexr.dev` 子域 | — | CNAME → Render |

**临时文件柜当前策略（零额外账号）：** 直接用 Render 本机磁盘 + SQLite 元数据 + TTL（1h–7d）。适合作业互传；不适合当网盘。

**想更稳（仍免费）的下一步：**

1. 注册 Cloudflare → R2 → 建 bucket（如 `portfolio-temp`）  
2. 创建 API Token（Object Read & Write）  
3. 以后可在环境变量加：`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET`（代码预留扩展位，默认仍走本地磁盘）  
4. 或把整站迁到 Fly/Railway 并挂 **Persistent Volume**
