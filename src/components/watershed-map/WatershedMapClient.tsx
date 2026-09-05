"use client";

import dynamic from "next/dynamic";

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

export function WatershedMapClient() {
  return <WatershedMapApp />;
}
