import type { Metadata } from "next";
import { SflLabLanding } from "@/components/sfl-lab/SflLabLanding";
import "./sfl-lab.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "微型蒸渗仪实验站 | 张森捷",
  description: "榆中萃英山七步质控：接入、曲线、旗标、订正、水平衡、验证、报告。",
};

/**
 * Default: portfolio landing (browser-only demo curves).
 * Optional: set SFL_LAB_UPSTREAM to a live Java/Vite lab origin to iframe it instead.
 */
export default function SflLabPage() {
  const upstream = (process.env.SFL_LAB_UPSTREAM || "").trim().replace(/\/$/, "");
  if (upstream) {
    return (
      <iframe
        src={upstream}
        title="微型蒸渗仪实验站"
        className="fixed inset-0 h-dvh w-full border-0 bg-white"
      />
    );
  }
  return <SflLabLanding liveOrigin="" />;
}
