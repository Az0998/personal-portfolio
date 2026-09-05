# 新安江机理预报对照台（XAJ Bench）

**卖点：** 不是只会刷深度学习，会讲产汇流。

## 本地

```bash
npm run xaj:generate   # → public/xaj-bench/benchmark.json
npm run dev
# http://localhost:3000/xaj-bench
```

## 内容

- 示意小流域日尺度：P / EM → **新安江三水源** → Q
- 同数据对照：Persistence、Lag-LSTM（滞后脊回归示意）、可调参 XAJ
- 指标：NSE、RMSE；参数含义与手工率定思路写在页内
- TS 实现：`src/lib/xaj/model.ts`（与生成脚本同构，可浏览器重跑）

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
