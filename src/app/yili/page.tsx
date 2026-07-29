import type { Metadata } from "next";
import Link from "next/link";
import "./yili.css";

export const metadata: Metadata = {
  title: "易理占筮 · 太极八卦六十四阵 | 张森捷",
  description:
    "周易象数学习演示：一事一占、天时地利人和、六爻与梅花易数、体用生克与朱熹动爻玩辞法",
};

export default function YiliPage() {
  return (
    <div className="yili-root">
      <header className="yili-top">
        <Link href="/#works" className="yili-back">
          ← 返回作品集
        </Link>
        <div className="yili-brand">
          <span className="yili-mark">☯</span>
          <div>
            <div className="yili-title">易理占筮</div>
            <div className="yili-sub">太极八卦六十四阵 · 象数学习演示</div>
          </div>
        </div>
        <a className="yili-open" href="/yili/app.html" target="_blank" rel="noreferrer">
          新窗口打开
        </a>
      </header>
      <iframe
        className="yili-frame"
        title="易理占筮"
        src="/yili/app.html"
        allow="clipboard-write"
      />
    </div>
  );
}
