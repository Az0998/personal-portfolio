import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { AtlasApp } from "@/components/atlas/AtlasApp";
import "./atlas.css";

export const metadata: Metadata = {
  title: "作品展厅 | 张森捷",
  description:
    "用轨道、地图、列表三种方式浏览项目：智慧水利、在线演示、论文与工具，可筛选并进入演示或介绍页。",
  openGraph: {
    title: "作品展厅 | 张森捷",
    description: "浏览全部项目，并打开演示或介绍页。",
  },
};

export default function AtlasPage() {
  return (
    <>
      <SiteBackground />
      <div className="relative z-[1] min-h-dvh flex flex-col">
        <Navbar name="张森捷" />
        <main className="flex-1 relative z-[2]">
          <Suspense
            fallback={
              <div className="atlas-shell">
                <p className="atlas-empty">正在展开展馆…</p>
              </div>
            }
          >
            <AtlasApp />
          </Suspense>
        </main>
        <Footer name="张森捷" />
      </div>
    </>
  );
}
