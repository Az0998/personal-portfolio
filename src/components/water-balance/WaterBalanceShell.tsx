"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WaterBalanceApp } from "@/components/water-balance/WaterBalanceApp";
import { HydroGuideBar } from "@/components/hydro/HydroGuideBar";
import { indoorNavFromEnv } from "@/lib/water-balance/nav";

const NAV = indoorNavFromEnv();

function WbrBody() {
  const search = useSearchParams();
  const embed = search.get("embed") === "1";

  return (
    <div className={`wbr-root hydro-skin${embed ? " wbr-embed" : ""}`}>
      {!embed && (
        <Suspense fallback={null}>
          <HydroGuideBar stepHint={5} />
        </Suspense>
      )}
      {!embed && (
        <header className="wbr-top">
          <Link href="/hydrobench" className="wbr-back">
            ← 智慧水利总览
          </Link>
          <div className="wbr-brand">
            <span className="wbr-mark">衡</span>
            <div>
              <div className="wbr-title">水平衡论证草稿</div>
              <div className="wbr-sub">文档 · 取用水结构 → 可导出报告</div>
            </div>
          </div>
          <nav className="wbr-nav" aria-label="相关入口">
            <span className="hb-kind">文档</span>
            <span className="hydro-badge-demo">演示</span>
            <Link href={NAV.hydroInfo}>态势</Link>
            <Link href={NAV.hydroBench}>作业台</Link>
            <Link href={NAV.watershedMap}>空间</Link>
          </nav>
        </header>
      )}
      <WaterBalanceApp />
    </div>
  );
}

export function WaterBalanceShell() {
  return (
    <Suspense fallback={<div className="wbr-root hydro-skin">加载论证草稿…</div>}>
      <WbrBody />
    </Suspense>
  );
}
