import type { Metadata } from "next";
import Link from "next/link";
import { HydroDashboard } from "@/components/hydro/HydroDashboard";
import "./hydro.css";

export const metadata: Metadata = {
  title: "HydroInfo · 水情信息平台 | 张森捷",
  description:
    "智慧水利演示：国内示范站网、Leaflet 地图、洪水 CSI 回放、LSTM 指标与可变要素出图",
};

export default function HydroPage() {
  return (
    <div className="hydro-root">
      <header className="hydro-top">
        <Link href="/" className="hydro-back">
          ← 返回作品集
        </Link>
        <div className="hydro-brand">
          <span className="hydro-mark">◈</span>
          <div>
            <div className="hydro-title">HydroInfo</div>
            <div className="hydro-sub">智慧水利 · 水情信息平台 · 在线演示</div>
          </div>
        </div>
        <div className="hydro-links">
          <a href="https://github.com/Az0998/hydro-info-platform" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://github.com/Az0998/hydro-ml-paper" target="_blank" rel="noreferrer">
            LSTM 论文仓
          </a>
        </div>
      </header>
      <HydroDashboard />
    </div>
  );
}
