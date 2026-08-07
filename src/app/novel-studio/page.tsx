import type { Metadata } from "next";
import Link from "next/link";
import { NovelStudioApp } from "@/components/novel-studio/NovelStudioApp";
import "./studio.css";

export const metadata: Metadata = {
  title: "Novel Studio · AI 写作工作台 | 张森捷",
  description:
    "网页演示：新建书向导、流水线、赞助发码与功能验证。桌面端负责本机 LLM 与发布引擎。",
};

export default function NovelStudioPage() {
  return (
    <div className="ns-root">
      <header className="ns-top">
        <Link href="/#works" className="ns-back">
          ← 返回作品集
        </Link>
        <div className="ns-brand">
          <span className="ns-mark">N</span>
          <div>
            <div className="ns-title">Novel Studio</div>
            <div className="ns-sub">网页演示 · 流水线与赞助验证</div>
          </div>
        </div>
      </header>
      <NovelStudioApp />
    </div>
  );
}
