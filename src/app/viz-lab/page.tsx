import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { VizLabApp } from "@/components/viz-lab/VizLabApp";
import "./viz-lab.css";

export const metadata: Metadata = {
  title: "平面动画 | 张森捷",
  description:
    "十八个可调参数的平面动画：降雨过程、混沌轨迹、斑图生长、柔软布料、液态熔球与粒子烟花等。",
  openGraph: {
    title: "平面动画 | 张森捷",
    description: "边调参数边看结果的即时演算动画。",
  },
};

export default function VizLabPage() {
  return (
    <>
      <SiteBackground />
      <div className="relative z-[1] min-h-dvh flex flex-col">
        <Navbar name="张森捷" />
        <main className="flex-1 relative z-[2]">
          <Suspense
            fallback={
              <div className="viz-shell">
                <p className="viz-lead">正在点亮实验室…</p>
              </div>
            }
          >
            <VizLabApp />
          </Suspense>
        </main>
        <Footer name="张森捷" />
      </div>
    </>
  );
}
