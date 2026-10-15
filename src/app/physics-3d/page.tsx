import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { PhysicsLabApp } from "@/components/physics-3d/PhysicsLabApp";
import "./physics-3d.css";

export const metadata: Metadata = {
  title: "三维物理 | 张森捷",
  description:
    "可旋转的三维刚体演示：球堆碰撞、斜面滑动、水面浮力、多米诺、绳链、磁力、粒子喷泉与自由沙盒。",
  openGraph: {
    title: "三维物理 | 张森捷",
    description: "拖拽旋转视角，调参看碰撞、浮力与喷泉。",
  },
};

export default function Physics3DPage() {
  return (
    <>
      <SiteBackground />
      <div className="relative z-[1] min-h-dvh flex flex-col">
        <Navbar name="张森捷" />
        <main className="flex-1 relative z-[2]">
          <Suspense
            fallback={
              <div className="phys-shell">
                <p className="phys-lead">正在装载物理世界…</p>
              </div>
            }
          >
            <PhysicsLabApp />
          </Suspense>
        </main>
        <Footer name="张森捷" />
      </div>
    </>
  );
}
