import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { AtlasApp } from "@/components/atlas/AtlasApp";
import "./atlas.css";

export const metadata: Metadata = {
  title: "作品星图 | 张森捷",
  description:
    "三维星轨与二维星图浏览个人站项目：智慧水利、在线演示、论文与工具，可筛选、检索并进入演示或汇报页。",
  openGraph: {
    title: "作品星图 | 张森捷",
    description: "把站点项目摊开成可逛的展馆：星轨、星图、展柜三种看法。",
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
