import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { LabsHub } from "@/components/labs/LabsHub";
import "./labs.css";

export const metadata: Metadata = {
  title: "互动演示 | 张森捷",
  description:
    "作品展厅、平面动画与三维物理：可调参数的降雨过程、斑图生长、柔软布料、水面浮力、绳链与喷泉。",
  openGraph: {
    title: "互动演示 | 张森捷",
    description: "可逛的作品展厅，加上可玩的平面动画与三维物理。",
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
