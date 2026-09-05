"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XajBenchApp } from "@/components/xaj-bench/XajBenchApp";
import { HydroGuideBar } from "@/components/hydro/HydroGuideBar";

const HYDRO_ML_URL =
  process.env.NEXT_PUBLIC_HYDRO_ML_URL?.trim() || "/presentations/hydro-ml";
const HYDRO_INFO_URL =
  process.env.NEXT_PUBLIC_HYDRO_INFO_URL?.trim() || "/hydrobench?tab=info";

function XajBody() {
  const search = useSearchParams();
  const embed = search.get("embed") === "1";

  return (
    <div className={`xaj-root hydro-skin${embed ? " xaj-embed" : ""}`}>
      {!embed && (
        <Suspense fallback={null}>
          <HydroGuideBar stepHint={4} />
        </Suspense>
      )}
      {!embed && (
        <header className="xaj-top">
          <Link href="/hydrobench" className="xaj-back">
            ← 智慧水利总览
          </Link>
          <div className="xaj-top-bridge">
            <span className="xaj-bridge-copy">同口径数据驱动对照见</span>
            <Link href={HYDRO_ML_URL} className="xaj-pill">
              学习预报
            </Link>
            <Link href={HYDRO_INFO_URL} className="xaj-pill">
              站网态势
            </Link>
          </div>
          <div className="xaj-top-actions">
            <span className="hb-kind">机理</span>
            <span className="hydro-badge-demo">演示</span>
          </div>
        </header>
      )}
      <XajBenchApp hydroMlUrl={HYDRO_ML_URL} hydroInfoUrl={HYDRO_INFO_URL} />
    </div>
  );
}

export function XajBenchShell() {
  return (
    <Suspense fallback={<div className="xaj-root hydro-skin">加载机理对照…</div>}>
      <XajBody />
    </Suspense>
  );
}
