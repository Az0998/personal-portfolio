"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HydroGuideBar } from "@/components/hydro/HydroGuideBar";

const WatershedMapApp = dynamic(
  () =>
    import("@/components/watershed-map/WatershedMapApp").then((m) => m.WatershedMapApp),
  {
    ssr: false,
    loading: () => (
      <div className="wm-shell">
        <div className="wm-side">
          <p className="wm-muted">正在初始化地图引擎…</p>
        </div>
        <div className="wm-map-wrap">
          <div className="wm-loading">加载 Leaflet…</div>
        </div>
      </div>
    ),
  }
);

const HYDRO_HUB_URL =
  process.env.NEXT_PUBLIC_HYDRO_HUB_URL?.trim() || "/hydrobench?tab=info";

function HydroHubLink({ className }: { className?: string }) {
  const external = /^https?:\/\//i.test(HYDRO_HUB_URL);
  if (external) {
    return (
      <a href={HYDRO_HUB_URL} className={className} target="_blank" rel="noopener noreferrer">
        智慧水利
      </a>
    );
  }
  return (
    <Link href={HYDRO_HUB_URL} className={className}>
      智慧水利
    </Link>
  );
}

function WatershedBody() {
  const search = useSearchParams();
  const embed = search.get("embed") === "1";

  return (
    <div className={`wm-root hydro-skin${embed ? " wm-embed" : ""}`}>
      {!embed && (
        <Suspense fallback={null}>
          <HydroGuideBar stepHint={2} />
        </Suspense>
      )}
      {!embed && (
        <header className="wm-top">
          <Link href="/" className="wm-back">
            ← 返回主站
          </Link>
          <div>
            <div className="wm-top-title">流域「一张图」</div>
            <div className="wm-top-sub">空间 · 水系 / 子流域 / 测站叠图</div>
          </div>
          <div className="wm-top-actions">
            <HydroHubLink className="wm-pill" />
            <span className="hydro-badge-sketch">示意</span>
            <span className="hb-kind">空间</span>
          </div>
        </header>
      )}
      <WatershedMapApp hydroHubUrl={HYDRO_HUB_URL} />
      {!embed && (
        <footer className="wm-foot">
          智慧水利「空间」入口：叠图与断面示意在此完成；态势 / 作业台见{" "}
          <HydroHubLink className="wm-foot-link" />。
        </footer>
      )}
    </div>
  );
}

export function WatershedMapClient() {
  return (
    <Suspense fallback={<div className="wm-root hydro-skin wm-loading-page">加载流域图…</div>}>
      <WatershedBody />
    </Suspense>
  );
}
