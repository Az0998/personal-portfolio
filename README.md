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

## 地图底图（零密钥默认）

`/watershed-map` 与 Hydro 地图**默认不需要 API Key**，使用 Esri World Dark/Light Gray Canvas 或 OSM 标准瓦片（见 `src/lib/map-basemap.ts`）。

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_MAP_TILE_URL` | 可选。自定义瓦片模板，例如 Carto / Mapbox |
| `NEXT_PUBLIC_MAP_TILE_ATTR` | 可选。attribution HTML |
| `NEXT_PUBLIC_MAP_TILE_SUBDOMAINS` | 可选。如 `abcd` |
| `NEXT_PUBLIC_HYDRO_HUB_URL` | 可选。流域图顶栏「智慧水利」链接，默认 `/hydrobench`；可设完整 URL |

示例（**密钥只放环境变量 / Render 面板，勿提交仓库**）：

```bash
# Mapbox dark（示例）
NEXT_PUBLIC_MAP_TILE_URL=https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN
NEXT_PUBLIC_MAP_TILE_ATTR=© Mapbox © OpenStreetMap

# Carto（新账号常需 key；无 key 会出现 API KEY REQUIRED 水印，勿再硬编码无密钥 URL）
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
NEXT_PUBLIC_MAP_TILE_SUBDOMAINS=abcd
NEXT_PUBLIC_MAP_TILE_ATTR=© CARTO © OpenStreetMap
```

不设置以上变量时，流域图使用 Esri Dark Gray，可直接演示。

## 流域一张图：方法

- 公开示范流域（默认 Potomac；可选汉江丹江口以上示意）以 GeoJSON（EPSG:4326）分层：边界/子流域/水系/站/库/坡度示意。
- 前端 Leaflet 叠图 + Turf 点击测距；侧栏统计仅计可见图层；属性按统一字典渲染，缺失为「—」。
- 数据由 `scripts/generate_watershed_geojson.py` 再生；`schematic=true` 贯穿要素与 manifest。
- 属性字典见 `/watershed-map/schema.json`；谱系说明见各盆地 `manifest.json` → `lineage`。

## 流域一张图：局限

- 边界与河网为手绘简化，**非**官方划界/HUC/水利部矢量，不可用于工程或防洪决策。
- 坡度为合成 DEM 代理分级，不是实测地形产品。
- 中国示范流域站网为虚构示意点；Potomac 站码来自 USGS，坐标仅为近似叠图。
- 库容、面积等为公开量级或示意赋值，**不伪造测量精度**。

## 流域一张图：可扩展

- 替换为真实流域 GeoJSON（保持 `schema.json` 字段）即可接入生产数据。
- 可增 DEM/GeoTIFF 坡度、WMS/XYZ 业务图层，或 MapLibre 矢量切片。
- 属性可接 NWIS / 水文年鉴 API；统计可扩展为子流域内站点数等空间聚合。
- 多流域通过 `catalog.json` 注册，无需改交互主流程。

## 技术栈

- **Next.js 15** — React 全栈框架
- **Tailwind CSS** — 样式
- **Prisma + SQLite** — 数据库
- **Framer Motion** — 动画
- **React Markdown** — Markdown 渲染
- **Leaflet + Turf** — 流域一张图（`/watershed-map`；维护文档 `modules/watershed-map/README.md`）
