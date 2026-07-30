import type { Metadata } from "next";
import Link from "next/link";
import { AnonSurveyApp } from "@/components/anon-survey/AnonSurveyApp";
import "./survey.css";

export const metadata: Metadata = {
  title: "匿名问卷 · 讨论与汇总 | 张森捷",
  description:
    "浏览器端匿名问卷：公开/私密分发、匿名填写、汇总、结果快照与匿名讨论区。导师评价与学校评价场景演示。",
};

export default function SurveyPage() {
  return (
    <div className="as-root">
      <div className="as-atmosphere" aria-hidden>
        <div className="as-blob a" />
        <div className="as-blob b" />
        <div className="as-blob c" />
        <div className="as-stamp">
          Anon
          <br />
          only
        </div>
      </div>
      <header className="as-top">
        <Link href="/#works" className="as-back">
          ← 返回作品集
        </Link>
        <div className="as-brand">
          <span className="as-mark">A</span>
          <div>
            <div className="as-title">匿名问卷</div>
            <div className="as-sub">分发 · 填写 · 汇总 · 匿名讨论</div>
          </div>
        </div>
        <span className="as-badge">非主导航 · 项目内进入</span>
      </header>
      <AnonSurveyApp />
    </div>
  );
}
