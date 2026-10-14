import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { LabsHub } from "@/components/labs/LabsHub";
import "./labs.css";

export const metadata: Metadata = {
  title: "效果集成馆 | 张森捷",
  description:
    "星图、Canvas 可视化实验室与三维物理实验室的集成入口：反应扩散、柔体、Metaball、绳链、磁力、喷泉等交互小品。",
  openGraph: {
    title: "效果集成馆 | 张森捷",
    description: "作品星图 · 2D 视效 · 3D 物理——一座馆逛完好玩的运动与渲染。",
  },
};

export default function LabsPage() {
  return (
    <>
      <SiteBackground />
      <div className="relative z-[1] min-h-dvh flex flex-col">
        <Navbar name="张森捷" />
        <main className="flex-1 relative z-[2]">
          <LabsHub />
        </main>
        <Footer name="张森捷" />
      </div>
    </>
  );
}
