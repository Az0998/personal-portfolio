import type { Metadata } from "next";
import Link from "next/link";
import { DOMAINS } from "@/lib/life-sim/domains";
import "./life-sim.css";

export const metadata: Metadata = {
  title: "人生模拟枢纽 · 多领域命运转盘",
  description:
    "CS 职业、凡人重开、水信息职场等多领域人生模拟：条件事件池、自适应权重、长程 flag 依赖。",
};

export default function LifeSimHubPage() {
  return (
    <div className="ls-root">
      <header className="ls-top">
        <Link href="/" className="ls-back">
          ← 主站
        </Link>
        <span className="ls-pill">Life Sim Hub</span>
        <span className="ls-ghost" aria-hidden>
          {" "}
        </span>
      </header>
      <div className="ls-hub">
        <p className="ls-kicker">加权转盘 · 条件池 · 自适应后续</p>
        <h1>人生模拟枢纽</h1>
        <p className="ls-hub-lead">
          主站作品档案的附属玩法：CS 是深链，凡人重开与水信息职场共用「Logit + Softmax
          温度 + 回声偏置」引擎。节点年龄会举行阶段典礼；落幕时给出称号碑文。机制参考
          BitLife / 人生重开，选项合理有趣即可浮动，不写死唯一正解。
        </p>
        <ul className="ls-domain-list">
          {DOMAINS.map((d) => (
            <li key={d.id}>
              <Link href={d.href} style={{ ["--d-accent" as string]: d.accent }}>
                <h2>{d.title}</h2>
                <p>{d.tagline}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="ls-hub-foot">
          机制与信息源笔记：仓库 <code>docs/life-sim-sources.md</code>。CS
          赛果为公开 Major 考据示意，非 HLTV 实时爬取。
        </p>
      </div>
    </div>
  );
}
