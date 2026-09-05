"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

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

/** Default: in-site Hydro hub. Override with NEXT_PUBLIC_HYDRO_HUB_URL (absolute or path). */
const HYDRO_HUB_URL =
  process.env.NEXT_PUBLIC_HYDRO_HUB_URL?.trim() || "/hydrobench";

function HydroHubLink({ className }: { className?: string }) {
  const external = /^https?:\/\//i.test(HYDRO_HUB_URL);
  if (external) {
    return (
      <a
        href={HYDRO_HUB_URL}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
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

export function WatershedMapClient() {
  return (
    <div className="wm-root">
      <header className="wm-top">
        <Link href="/" className="wm-back">
          ← 返回主站
        </Link>
        <div>
          <div className="wm-top-title">流域「一张图」GIS 小站</div>
          <div className="wm-top-sub">/watershed-map · GeoJSON · Leaflet · 空间统计</div>
        </div>
        <div className="wm-top-actions">
          <HydroHubLink className="wm-pill" />
          <span className="wm-pill">EPSG:4326</span>
        </div>
      </header>
      <WatershedMapApp hydroHubUrl={HYDRO_HUB_URL} />
      <footer className="wm-foot">
        本页是智慧水利「空间一张图」入口：GIS 叠图与阈值示意在此完成；水情态势 / 室内台 / 户外台由{" "}
        <HydroHubLink className="wm-foot-link" />（HydroInfo + HydroBench）承接过程线与业务台账。
      </footer>
    </div>
  );
}
