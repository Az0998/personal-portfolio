import type { Metadata } from "next";
import { WatershedMapClient } from "@/components/watershed-map/WatershedMapClient";
import "./watershed-map.css";

export const metadata: Metadata = {
  title: "流域一张图 · 波托马克 GIS | 张森捷",
  description:
    "公开流域 GIS 小站：水系、子流域、水文站、水库图层开关与点选统计，坡度示意。Leaflet + GeoJSON。",
};

export default function WatershedMapPage() {
  return <WatershedMapClient />;
}
