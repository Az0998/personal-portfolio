import type { Metadata } from "next";
import Link from "next/link";
import "./yili.css";

export const metadata: Metadata = {
  title: "易理占筮 · 太极八卦六十四阵 | 张森捷",
  description:
    "周易象数与韦特塔罗学习演示：一事一占、事不过三、因地制宜、六爻梅花与塔罗对照",
};

export default function YiliPage() {
  return (
    <div className="yili-root">
      <header className="yili-top">
        <Link href="/#works" className="yili-back">
          ← 作品集
        </Link>
        <a className="yili-open" href="/yili/app.html" target="_blank" rel="noreferrer">
          新窗口
        </a>
      </header>
      <iframe
        className="yili-frame"
        title="易理占筮"
        src="/yili/app.html?embed=1"
        allow="clipboard-write"
      />
    </div>
  );
}
