# 流域「一张图」模块

长期维护入口：本目录。Next 站挂载路径仍为 `/watershed-map`。

## 目录树

```
modules/watershed-map/
├── README.md                 ← 本文件
├── screenshots/              ← 作品集截图（见 screenshots/README.md）
├── data/geojson/             ← 权威数据（pretty JSON，可 diff）
│   ├── catalog.json
│   ├── schema.json
│   └── basins/
│       ├── potomac/
│       └── hanjiang-schematic/
└── scripts/generate.py       ← 生成 data/geojson 并同步到 public/

仓库内挂载（勿在此手改运行时数据，请改 data 后 regenerate）：
public/watershed-map/         ← Next 静态资源（compact JSON）
src/app/watershed-map/        ← 路由页 + CSS
src/components/watershed-map/ ← Leaflet UI / 过程线抽屉
src/lib/watershed-schema.ts   ← 属性字典
src/lib/map-basemap.ts        ← 零密钥底图
```

## 本地启动

```bash
cd personal-portfolio
npm install
python modules/watershed-map/scripts/generate.py   # 或: npm run wm:generate
npm run dev
```

打开 http://localhost:3000/watershed-map

## 静态导出 / 挂到个人站

本模块 **GeoJSON + series 已是纯静态文件**，由 `public/watershed-map/**` 提供。

| 场景 | 做法 |
|------|------|
| 现有 Next（推荐） | `npm run build && npm start`，路由 `/watershed-map` 已接入 |
| Render / Vercel | push `main`；无需额外配置；可选 `NEXT_PUBLIC_HYDRO_HUB_URL` |
| 纯静态托管 | 复制 `public/watershed-map/`；页面需自带 Leaflet 壳，或继续用本站 Next 构建产物中的 `/watershed-map` HTML |
| 全站静态导出 | 在 `next.config` 设 `output: 'export'`（需评估 Prisma API；本 GIS 页为客户端，资源可静态化） |

**不要**把 API Key 写进仓库；底图默认 Esri Dark Gray。

## 性能约定

- 坡度示意网格 ≤ 6×6；首屏 **不** 加载 `slope-hint.geojson`（勾选图层后再拉）
- `public/` 内 GeoJSON 为 compact（无缩进）；`data/geojson` 保持 pretty 便于 Git diff
- 河网为示意折线，顶点很少，无需额外简化

## 无障碍 / 移动端

- 小屏侧栏默认折叠，顶部「图层与统计」按钮展开；地图占满剩余高度
- 过程线抽屉支持 Esc / 背景点击关闭（见组件）

## 作品集文案（≤80 字）

示意流域 GIS「一张图」：图层开关、测距与阈值过程线，数据谱系可讲清，挂载 /watershed-map。

**技能标签：** GIS · GeoJSON · 空间统计

## 再生数据

```bash
npm run wm:generate
# 等价于
python modules/watershed-map/scripts/generate.py
```
