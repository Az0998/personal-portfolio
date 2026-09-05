# 新安江机理预报对照台（XAJ Bench）

**卖点：** 不是只会刷深度学习，会讲产汇流；内部过程可导出，水量平衡能检查闭合。

## 本地

```bash
npm run xaj:generate   # → public/xaj-bench/benchmark.json
npm run dev
# http://localhost:3000/xaj-bench
```

## 模型结构版本（实现说明）

| 项 | 约定 |
|----|------|
| 结构 | **三水源新安江**（赵人俊体系示意）：张力水蓄满产流 → 自由水水库分 RS/RI/RG → 线性水库汇流 |
| 计算步长 | **日**（`timestep: daily`）；强迫 P、EM 与状态更新同为 1 d |
| 状态初值 | `WU0=0.65·WUM`，`WL0=0.55·WLM`，`WD0=0.45·WDM`，`S0=0.15·SM`；汇流水库 `qs/qi/qg=0`；地表滞时队列长度 `L`、初值全 0（见 `initState`） |
| 流量换算 | `Q(m³/s) = (qs+qi+qg)·A / 86.4`，其中 `qs/qi/qg` 为日径流深（mm） |
| 水量平衡 | 示意：`ΣP ≈ ΣE + ΣQ + ΔS`，`S = WU+WL+WD+S自由 + 地表滞时队列`；产流层/自由水层各自闭合；残差相对 P 超过约 2% 告警 |
| 实现修正 | 蒸发与产流避免 PE 双重计入；不透水产流用 `PE·IMP` + 透水区蓄满曲线，保证质量守恒 |
| 代码 | 浏览器 TS：`src/lib/xaj/model.ts`；生成脚本 Python 同构：`modules/xaj-bench/scripts/generate.py` |

本页为教学/面试演示，**非业务预报系统**。

## 内容

- 示意小流域日尺度：P / EM → **新安江三水源** → Q
- 同数据对照：Persistence、Lag-LSTM（滞后脊回归示意）、可调参 XAJ
- **内部过程副图**（不改主对照图）：三水源堆叠 RS/RI/RG；张力水/自由水蓄量；水量平衡检查卡（残差告警）
- 顶栏桥接 Hydro-ML / HydroInfo（`NEXT_PUBLIC_HYDRO_ML_URL` / `NEXT_PUBLIC_HYDRO_INFO_URL`）
- 指标：NSE / RMSE / KGE（m³/s）；暖期 60 d 写死；末 30 d 留出盲测并列
- 数据协议面板：真值参数表、噪声、种子、段划分；醒目合成数据免责
- Baseline：Persistence、MA3；导出参数 JSON + 过程线 CSV（与图一致）
- 参数 UI 分组：蒸发 / 张力水·产流 / 自由水·分水源 / 汇流；符号+单位+范围
- 「率定向导」三步（蒸发平衡 → 产流涨水 → 洪峰基流）：高亮控件 +「观察什么」
- 过程线暖期半透明带；指标明确「暖期后」；单参 ±10% 敏感性表（heuristic / demo）
- 「恢复率定值」「恢复真值参数」；状态条区分 **真值 / 率定值 / 当前编辑**
- 改参即时重跑；越界标红；诚实表述：合成观测、Lag-LSTM 示意回归、非全局最优

## 目录

```
modules/xaj-bench/
  README.md
  scripts/generate.py
  data/benchmark.json
public/xaj-bench/benchmark.json
src/app/xaj-bench/
src/components/xaj-bench/
src/lib/xaj/model.ts
```

HEC-HMS：将导出序列写入 `benchmark.json` 的 `series` 字段即可挂图（保持字段名）。
