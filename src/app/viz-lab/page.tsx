import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { VizLabApp } from "@/components/viz-lab/VizLabApp";
import "./viz-lab.css";

export const metadata: Metadata = {
  title: "可视化实验室 | 张森捷",
  description:
    "交互式 Canvas 可视化：活塞、混沌、光电、流体、周转、鸟群、Julia、反应扩散、L-system、柔体、Metaball、烟花等十八场景。",
  openGraph: {
    title: "可视化实验室 | 张森捷",
    description: "物理机械、混沌、分形、反应扩散与粒子烟花的实时小品。",
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
