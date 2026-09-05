import type { Metadata } from "next";
import Link from "next/link";
import { WaterBalanceApp } from "@/components/water-balance/WaterBalanceApp";
import "./water-balance.css";

export const metadata: Metadata = {
  title: "水资源论证 / 水平衡报告生成器 | 张森捷",
  description:
    "室内岗演示：填取水、退水、保证率与需水结构，生成水平衡表与取用水合理性简述，下载 Word / Markdown。简化水资源论证章节，非正式文本。",
};

export default function WaterBalanceReportPage() {
  return (
    <div className="wbr-root">
      <header className="wbr-top">
        <Link href="/#works" className="wbr-back">
          ← 作品集
        </Link>
        <div className="wbr-brand">
          <span className="wbr-mark">衡</span>
          <div>
            <div className="wbr-title">水平衡报告生成器</div>
            <div className="wbr-sub">水资源论证简化章节 · 室内岗文档自动化</div>
          </div>
        </div>
        <span className="wbr-chip">/water-balance-report</span>
      </header>
      <WaterBalanceApp />
    </div>
  );
}
