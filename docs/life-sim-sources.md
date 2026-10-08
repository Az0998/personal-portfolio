# 人生模拟 · 信息源与机制笔记

本站 `/life-sim` 共享引擎 + 多领域包；`/cs-life` 为 CS 深度线。**不做 HLTV HTML 实时爬取**，赛果用公开考据示意。

## CS / 电竞可学站点（只读参考）

| 来源 | 用途 | 注意 |
|------|------|------|
| [Liquipedia CS](https://liquipedia.net/counterstrike) | Major/选手/战队年表、赛制 | CC-BY-SA，引用需署名；适合 lore 不是实时 API |
| HLTV.org | 排名、Rating、赛事结果语境 | 有反爬与 ToS；本站用公开 Major 结果文案，不抓页 |
| [Valve CS2 Major 规程 / 官方公告](https://www.counter-strike.net/) | 赛制、RMR→Major 结构 | 权威但不含选手八卦 |
| FACEIT / 国服社区 lore | 趣味世界线、梗 | 娱乐向，勿当事实库 |
| 商业数据商（SCOPE.gg、GRID 等） | 若未来要正式数据 | 需商务授权，不适合个人站白嫖 |

技能向：可把「公开赛果表 → lore.ts 静态表」做成流水线；权重与叙事仍本地模拟。

## 人生模拟机制（市面可学）

| 项目/类型 | 可借机制 | 本站映射 |
|-----------|----------|----------|
| **BitLife** | 年龄推进、职业/婚恋分支、属性影响选项出现率 | `minAge/maxAge` + `eligible` + `adaptWeights` |
| **人生重开模拟器** | 开局加点、属性门槛事件、快乐抗负面 | `requireStats` / `forbidStats`；心态高负面 `delta` 减伤 |
| **转盘向短视频模拟**（含 CS 转盘） | 加权扇区、嵌套后续转盘 | `weight` + `enqueue` 深度优先队列 |
| **文字互动 / choice RPG** | flag 解锁后续剧情 | `includeFlags` / `excludeFlags` / `addFlags` |

原则：**后续选项灵活自适应**——只要合理有趣，用属性抬高 boost、压低 cut，不必写死唯一正解。

## 引擎要点（`src/lib/life-sim`）

1. **合格池**：年龄区间 + 属性上下限 + flag 包含/排除。
2. **自适应权重**：见下方算法；实现于 `weighting.ts`。
3. **长程依赖**：选项 `enqueue` 子事件；`addFlags` 改变未来池。
4. **阶段典礼**：`rite.ts` 在节点年龄 / 退役时生成称号与短赋。
5. **领域包**：`cs` + `mortal` / `hydro` / `night`；同人题材风 `xianxia` / `isekai` / `academy` / `mecha`（`fanfic.ts`，原创桥段致敬类型，不搬运官方设定原文）。

## 权重 / 差分 / 后续影响（好用算法）

| 手段 | 做法 | 适合什么 |
|------|------|----------|
| **Logit 线性** | `logit = log(w₀) + Σ βₖ·z(statₖ)` | 属性差分进对数域，避免连乘爆炸 |
| **Softmax 温度 T** | `wᵢ ∝ exp(logitᵢ / T)` | T↓ 更「一锤定音」；T↑ 更命运摇摆 |
| **Flag 亲和** | 有标签则 ±Δlogit | 长程剧情（编制/脱单/事故） |
| **回声 echo** | 上一选 → 下一卡 boost/cut + 调 T | 「刚夺冠下轮略顺」「刚崩盘先喘口气」 |
| **近期衰减** | 重复 pick 片段降权 | 防连刷同一梗 |
| **Soft floor** | 最低约 1.2% | 保留黑马/喜剧扇区 |

不推荐一上来上强化学习；内容向转盘用 **可解释的 logit + 温度** 就够玩、也好调。

Bradley-Terry / Elo 可把「选项两两谁更配当前属性」做成对战分，再转 softmax——内容多了再上。Thompson Sampling 适合要「跟玩家历史学习」的付费游戏，个人站静态池收益有限。

## 扩展建议

- 新领域：写 `EventCard[]` 池 + `DomainMeta`，挂到 `domains.ts`。
- 选项可加 `affinity: { aim: 0.4 }`（经 `adaptCardOptions`）。
- 勿把付费 API Key 或爬虫写进公开仓库。
