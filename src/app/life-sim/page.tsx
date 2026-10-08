import type { Metadata } from "next";
import Link from "next/link";
import { DOMAINS } from "@/lib/life-sim/domains";
import "./life-sim.css";

export const metadata: Metadata = {
  title: "人生模拟枢纽 · 多领域命运转盘",
  description:
    "CS、凡人、水职场、都市夜谈，以及修仙/异世界/魔法学院/机甲等同人题材风转盘。",
};

const REALITY = new Set(["cs", "mortal", "hydro", "night"]);

export default function LifeSimHubPage() {
  const reality = DOMAINS.filter((d) => REALITY.has(d.id));
  const fanfic = DOMAINS.filter((d) => !REALITY.has(d.id));

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
        <p className="ls-kicker">加权转盘 · 同人题材风 · 自适应后续</p>
        <h1>人生模拟枢纽</h1>
        <p className="ls-hub-lead">
          现实支线与同人题材风都在这里。同人包用原创桥段致敬爆款类型（修仙、转生、学院、机甲），不搬运官方角色名与设定原文——好玩优先，合理有趣即可。
        </p>

        <h2 className="ls-hub-section">现实与日常</h2>
        <ul className="ls-domain-list">
          {reality.map((d) => (
            <li key={d.id}>
              <Link href={d.href} style={{ ["--d-accent" as string]: d.accent }}>
                <h2>{d.title}</h2>
                <p>{d.tagline}</p>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="ls-hub-section">同人题材风</h2>
        <ul className="ls-domain-list">
          {fanfic.map((d) => (
            <li key={d.id}>
              <Link href={d.href} style={{ ["--d-accent" as string]: d.accent }}>
                <h2>{d.title}</h2>
                <p>{d.tagline}</p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="ls-hub-foot">
          笔记：仓库 <code>docs/life-sim-sources.md</code>。同人包为类型致敬 Demo，与任何官方作品无关。
        </p>
      </div>
    </div>
  );
}
