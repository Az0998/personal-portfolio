import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { PhysicsLabApp } from "@/components/physics-3d/PhysicsLabApp";
import "./physics-3d.css";

export const metadata: Metadata = {
  title: "三维物理实验室 | 张森捷",
  description:
    "Three.js + Cannon 三维刚体：碰撞堆叠、斜面摩擦、浮力水面、多米诺、绳链、磁力、粒子喷泉与交互沙盒。",
  openGraph: {
    title: "三维物理实验室 | 张森捷",
    description: "碰撞、浮力、绳链约束、磁力吸引与粒子喷泉的实时 3D 小品。",
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
