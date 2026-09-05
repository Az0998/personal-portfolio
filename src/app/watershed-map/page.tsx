import type { Metadata } from "next";
import Link from "next/link";
import { WatershedMapClient } from "@/components/watershed-map/WatershedMapClient";
import "./watershed-map.css";

export const metadata: Metadata = {
  title: "流域一张图 · 波托马克 GIS | 张森捷",
  description:
    "公开流域 GIS 小站：水系、子流域、水文站、水库图层开关与点选统计，坡度示意。Leaflet + GeoJSON。",
};

export default function WatershedMapPage() {
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
        <div className="flex items-center gap-2">
          <Link href="/hydrobench" className="wm-pill">
            智慧水利
          </Link>
          <span className="wm-pill">EPSG:4326</span>
        </div>
      </header>
      <WatershedMapClient />
    </div>
  );
}
