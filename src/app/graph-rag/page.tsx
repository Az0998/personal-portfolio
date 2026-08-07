import type { Metadata } from "next";
import Link from "next/link";
import "./graph-rag.css";

export const metadata: Metadata = {
  title: "Graph-RAG Vault · 知识图谱检索 | 张森捷",
  description:
    "Obsidian 式双向链接 × Graph-RAG：TF-IDF 种子检索、邻居扩展、关系图高亮出处。浏览器内离线可玩。",
};

export default function GraphRagPage() {
  return (
    <div className="gr-root">
      <header className="gr-top">
        <Link href="/#works" className="gr-back">
          ← 作品集
        </Link>
        <div className="gr-brand">
          <span className="gr-mark">G</span>
          <div>
            <div className="gr-title">Graph-RAG Vault</div>
            <div className="gr-sub">双向链接 · 种子检索 · 邻居扩展</div>
          </div>
        </div>
        <a className="gr-open" href="/graph-rag/index.html" target="_blank" rel="noreferrer">
          新窗口
        </a>
      </header>
      <iframe
        className="gr-frame"
        title="Graph-RAG Vault"
        src="/graph-rag/index.html?embed=1"
        allow="clipboard-write"
      />
    </div>
  );
}
