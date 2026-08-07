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
- `/graph-rag` — Graph-RAG Vault（作品进入）

### 数据 / 缓存分层（勿混用）

| 层 | 位置 | 说明 |
|----|------|------|
| 个人资料 + 作品 | Prisma（SQLite） | 后台全面管理；seed **不覆盖**已有；作品可锁定 |
| 意见反馈 | `Feedback` 表 | 前台表单 → 后台「意见反馈」 |
| 点击 / 注意力 | `AnalyticsEvent` 表 | 前台埋点 → 后台「点击/注意力」 |
| 临时文件柜 | SQLite 元数据 + **Cloudflare R2**（未配则本机磁盘） | 浏览器预签名直传；见第六节 |
| HydroBench | `localStorage` `hydrobench:*` | 不上云 |
| Novel Studio | `novel-studio-web-demo-v1` | 不上云 |
| Graph-RAG | `public/graph-rag/*` | 静态包（浏览器内检索） |
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

- Render Free **重新部署后** SQLite 可能重置；首次部署已自动 seed。之后改内容尽量在后台改，或本地改完再 `FORCE_SEED=1 npm run db:seed` 后重新部署。  
- **临时文件柜**已支持 **Cloudflare R2 浏览器直传**（见第六节）。未配置 `R2_*` 时本地开发会回退到本机磁盘。
- 长期正式使用建议 SQLite 迁 Turso / PostgreSQL，避免重部署丢库。

## 五、可免费接入的服务（推荐）

| 用途 | 服务 | 免费额度（约） | 和本站怎么配合 |
|------|------|----------------|----------------|
| **站点主机（已在用）** | [Render](https://render.com) Web Service | 免费实例会休眠 | 当前 `render.yaml` / Node + SQLite |
| **对象存储（临时文件）** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) | 10 GB 存储 | 浏览器预签名直传；见第六节 |
| **数据库托管** | [Turso](https://turso.tech) / [Neon](https://neon.tech) | 免费 SQLite/Postgres 层 | 解决 Render 重部署丢库 |
| **Hobby 备选** | [Railway](https://railway.app) / [Fly.io](https://fly.io) | 有试用额度 | 可挂持久卷 |
| **域名** | 已有 `vexr.dev` 子域 | — | CNAME → Render |

## 六、临时文件柜接 Cloudflare R2（推荐）

### 1）创建 Bucket 与 API Token

1. 打开 [Cloudflare Dashboard → R2](https://dash.cloudflare.com/?to=/:account/r2)  
2. **Create bucket**，名称例如 `portfolio-temp`  
3. **Manage R2 API Tokens** → Create API token  
   - 权限：Object Read & Write（可限定该 bucket）  
   - 记下：`Access Key ID`、`Secret Access Key`、账户 **Account ID**

### 2）配置 CORS（浏览器直传必需）

Bucket → **Settings → CORS policy** → 粘贴（按你的域名改）：

```json
[
  {
    "AllowedOrigins": [
      "https://zhangsjqaq.vexr.dev",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3）在 Render 环境变量添加

| Key | Value |
|-----|-------|
| `R2_ACCOUNT_ID` | Cloudflare 账户 ID |
| `R2_ACCESS_KEY_ID` | API Token Access Key |
| `R2_SECRET_ACCESS_KEY` | API Token Secret |
| `R2_BUCKET` | `portfolio-temp` |

本地开发可写入 `.env`（勿提交）。配置成功后打开 `/temp-files`，文案会显示「Cloudflare R2 浏览器直传」。

### 4）上传流程

1. 浏览器 `POST /api/temp-files`（JSON）拿预签名 PUT URL  
2. **浏览器直写 R2**（不经 Render 传文件体）  
3. `POST /api/temp-files/confirm` 校验对象存在  
4. 下载走预签名 GET（302 跳转）  
5. 过期后由站点清理元数据并 `DeleteObject`
