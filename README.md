# 个人作品集网站

一个带有后台 CMS 的现代个人作品集网站，支持展示项目、论文、设计等各类成果，可随时在后台编辑更新。

## 功能特点

- **精美前台展示** — 深色主题 + 玻璃拟态设计，流畅动画，响应式布局
- **后台 CMS** — 登录后台随时修改个人信息、上传作品、管理内容
- **多种作品类型** — 支持项目、论文、设计、代码、媒体等分类
- **Markdown 支持** — 作品详情页支持 Markdown 格式正文
- **文件上传** — 头像、封面图片一键上传
- **零依赖部署** — SQLite 本地数据库，无需外部服务

## 快速开始

```bash
cd personal-portfolio

# 安装依赖
npm install

# 初始化数据库并填充示例数据
npm run db:push
npm run db:seed

# 启动开发服务器
npm run dev
```

打开浏览器访问：

| 地址 | 说明 |
|------|------|
| http://localhost:3000 | 前台作品集网站 |
| http://localhost:3000/admin | 后台管理（默认账号 `admin` / `admin123`） |

## 后台管理

登录后台后可以：

1. **个人信息** — 编辑姓名、头衔、简介、头像、联系方式、社交链接
2. **作品管理** — 添加/编辑/删除作品，上传封面，设置分类和标签
3. **发布控制** — 设置精选作品、排序、发布/下架

## 部署

### Vercel 部署

```bash
npm run build
```

注意：Vercel 等 Serverless 平台的文件系统是临时的，SQLite 数据和上传文件在重启后会丢失。生产环境建议：

- 使用 [Turso](https://turso.tech/) 或 PostgreSQL 替代 SQLite
- 使用 [Cloudinary](https://cloudinary.com/) 或 S3 存储上传文件

### 自托管（推荐）

在 VPS 或本地服务器上运行，数据和文件持久保存：

```bash
npm run build
npm start
```

## 自定义

- 修改 `.env` 中的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 更改后台密码
- 编辑 `tailwind.config.ts` 调整配色方案
- 在 `src/app/globals.css` 中修改全局样式

## 技术栈

- **Next.js 15** — React 全栈框架
- **Tailwind CSS** — 样式
- **Prisma + SQLite** — 数据库
- **Framer Motion** — 动画
- **React Markdown** — Markdown 渲染
