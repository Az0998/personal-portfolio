# HydroBench · 水文双工作台

纯前端工具台：室内集成 **数据格式 / 图片处理 / 公式计算**；另备 **户外应急离线台**（无网录入、速算、清单、本地缓存导出）。

与 [hydro-info-platform](../hydro-info-platform) 并列——那边偏站网态势演示，本项目偏作业/实习工具。

个人站挂载：**https://zhangsjqaq.vexr.dev/hydrobench**（主导航「水文工作台」）。静态副本在 `personal-portfolio/public/hydrobench/`。

## 打开方式

推荐本地静态服务（样本载入需同源）：

```powershell
cd d:\deep-learning\code\hydro-workbench
python -m http.server 8765
```

浏览器打开：http://127.0.0.1:8765

也可直接双击 `index.html`（部分浏览器限制 `file://` 下 `fetch` 样本，可改用粘贴/选文件）。

## 两套工作台

| 入口 | 路径 | 用途 |
|------|------|------|
| 门户 | `index.html` | 分流 + 全量备份导入导出 |
| 室内 Studio | `studio/index.html` | DAT/CSV/水位解析、照片标注、断面/过程线出图、公式 |
| 户外 Field | `field/index.html` | 测次录入、应急速算、检查清单、JSON/CSV 导出（无 CDN） |

## 存储一致性

| 键 / 层 | 内容 | 上云？ |
|---------|------|--------|
| `hydrobench:*` | 测次、清单、公式历史、meta | 否，仅本浏览器同源 |
| 个人站 Profile / Works | 姓名简介与作品卡片 | 是（Prisma，与本台无关） |
| `novel-studio-web-demo-v1` | 写作演示 | 否，另一套键 |

生产站与 `localhost` / `file://` **不同源**，数据不自动互通；用入口页「导出本机全量备份」迁移。

挂到个人站后请保持 `public/hydrobench` 与本目录同步：

```powershell
robocopy d:\deep-learning\code\hydro-workbench d:\deep-learning\code\personal-portfolio\public\hydrobench /E /XD .git .cursor
```

## 样本

- [`samples/section_demo.dat`](samples/section_demo.dat) — 大断面：`点号,备注,X,Y,Z`
- [`samples/level_demo.csv`](samples/level_demo.csv) — 逐日水位

室内台可点「载入样本」或拖入文件。

## 数据约定

**DAT**（对齐实习脚本 `cross-section-survey-0718/process_dat.py`）：

```text
点号,备注,X,Y,Z
```

含「水」的备注视为水边；以点 2 与末点连线为断面轴投影起点距；偏距过大标为控制点。

**水位文本**：`日期,水位` 或 `月,日,水位`；支持截断小数相对修正。

**户外导出**：Field → 导出 JSON（`type: hydrobench-field`）→ 室内台粘贴框可作通用文本解析，或回城后用 CSV。

## 公式（离线）

梯形过水面积、曼宁流量、局部水头损失、水尺→水位、水位–面积插值（需先解析断面）。

## 技术说明

- 无构建步骤、无后端、无 CDN 硬依赖
- 状态：`localStorage` 键前缀 `hydrobench:`
- 图：Canvas PNG 下载

## License

MIT · 学习与实习工具用途
