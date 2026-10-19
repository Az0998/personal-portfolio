import type { Metadata } from "next";
import Link from "next/link";
import "./sfl.css";

export const metadata: Metadata = {
  title: "微型蒸渗仪数据处理 | 张森捷",
  description: "SmartField 微型蒸渗仪：DT80 CSV 质控、10 分钟降水与午夜蒸散",
};

export default function SflPage() {
  return (
    <div className="sfl-root">
      <header className="sfl-top">
        <Link href="/hydrobench" className="sfl-back">
          ← 智慧水利
        </Link>
        <a className="sfl-open" href="/sfl/index.html" target="_blank" rel="noreferrer">
          新窗口
        </a>
      </header>
      <iframe className="sfl-frame" title="微型蒸渗仪数据处理" src="/sfl/index.html?embed=1" />
    </div>
  );
}
