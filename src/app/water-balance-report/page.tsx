import type { Metadata } from "next";
import Link from "next/link";
import { WaterBalanceApp } from "@/components/water-balance/WaterBalanceApp";
import { WORK_BLURB, indoorNavFromEnv } from "@/lib/water-balance/nav";
import "./water-balance.css";

export const metadata: Metadata = {
  title: "水资源论证 / 水平衡报告生成器 | 张森捷",
  description: WORK_BLURB,
};

const NAV = indoorNavFromEnv();

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
            <div className="wbr-sub">室内岗 · 论证草稿 · 文档自动化</div>
          </div>
        </div>
        <nav className="wbr-nav" aria-label="室内岗导航">
          <span className="wbr-chip indoor">INDOOR</span>
          <Link href={NAV.hydroInfo}>HydroInfo</Link>
          <Link href={NAV.hydroBench}>HydroBench</Link>
          <Link href={NAV.watershedMap}>流域一张图</Link>
        </nav>
      </header>
      <WaterBalanceApp />
    </div>
  );
}
