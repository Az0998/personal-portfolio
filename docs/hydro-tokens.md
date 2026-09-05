# Hydro Tokens · 一套 token、多皮肤

## 皮肤分工

| 皮肤 | 范围 | 源文件 |
|------|------|--------|
| **主站 rose/anime** | 首页、作品、关于 | [`src/app/globals.css`](../src/app/globals.css)（`--rose` 等） |
| **Hydro ops 深色** | `/hydrobench`、`/watershed-map`、`/xaj-bench`、`/water-balance-report`、`/hydro` | [`src/styles/hydro-tokens.css`](../src/styles/hydro-tokens.css) |

**禁止**再散落第三套无说明的深色变量。新 Hydro 页必须：

```css
@import "../../styles/hydro-tokens.css";
/* 根节点加 hydro-skin，颜色只用 var(--hydro-*) */
```

## 核心变量

- 背景：`--hydro-bg` / `--hydro-bg-deep` / `--hydro-bg-end`
- 卡片：`--hydro-panel`、`--hydro-line`、`--hydro-radius`、`--hydro-space`
- 主色：`--hydro-accent`（teal `#2ec4b6`）
- 文字：`--hydro-text` / `--hydro-muted`
- 语义：`--hydro-ok` / `--hydro-warn` / `--hydro-alert`
- 字体：`--hydro-font`

旧名 `--h-*` / `--hb-*` / `--wbr-*` 由 tokens 文件映射，逐步收敛即可。

## 主站主链标识

作品卡片若标题属于智慧水利主链，显示 **teal 左边条 +「主链」徽章**（逻辑：`isHydroChainTitle` in `src/lib/hydro-guide.ts`）。主站仍保留樱花/rose 气质。

## 截图式一致性检查（抽查三页）

对以下三页各截一张顶栏 + 一块内容区对照：

1. `/hydrobench`（总览）
2. `/watershed-map`
3. `/xaj-bench`（或 `/water-balance-report`）

检查项：

| 项 | 期望 |
|----|------|
| 背景 | 同 ops 深青底 + 青绿/蓝径向光，无第三套灰紫深色 |
| 标题层级 | 页标题 ≈1.05–1.2rem / 600–700；副标 12px muted |
| 按钮 | 主按钮 accent 填充；幽灵描边 `--hydro-line` |
| 徽章 | 「演示」用 `.hydro-badge-demo`；「示意」用 `.hydro-badge-sketch` |
| 卡片圆角 | ≈16px（`--hydro-radius`） |
| 导览条 | `?tour=1&from=guide` 时顶栏出现步骤 n/5 + 上一步/下一步 |

## 统一入口信息架构（`/hydrobench`）

```
总览 → 态势 | 作业台 | 空间 | 模型 | 文档
              └ 室内整编 / 户外应急
```

| 页签 | 业务含义 | 类型标注 | 内容 |
|------|----------|----------|------|
| 总览 | 分组卡片入口 + 5 分钟导览 | — | 看站网与作业 / 落空间 / 算预报与出文档 |
| 态势 | 站网过程线与异常 | 态势 | HydroInfo 看板 |
| 作业台 | 室内整编 · 户外应急（二级） | 作业 | `studio` / `field` iframe `embed=1` |
| 空间 | 流域一张图 | 空间 | `/watershed-map?embed=1` |
| 模型 | 产汇流机理对照 | 机理 | `/xaj-bench?embed=1` |
| 文档 | 水平衡论证草稿 | 文档 | `/water-balance-report?embed=1` |

兼容：`?tab=studio|field|info|map|model|doc`；旧别名 `workbench`→室内、`xaj`→模型、`wbr`→文档。独立路由仍可直达，`embed=1` 时隐藏各自顶栏以免双顶栏。

## 5 分钟导览

- 入口：总览「开始导览」→ `?tour=1&from=guide&step=1…5`（步骤 URL 均落在 `/hydrobench?tab=…`）
- 埋点：`guide-start` / `guide-step-n` / `guide-next` / `guide-complete` / `guide-copy-intro`（`trackCta`）
- 结束：`/hydrobench?tour=done` → 可复制自我介绍 + 三外链
