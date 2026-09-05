import type { Metadata } from "next";
import { Suspense } from "react";
import { HydroHub } from "@/components/hydro/HydroHub";
import "../hydro/hydro.css";
import "./hydrobench.css";

export const metadata: Metadata = {
  title: "智慧水利总览 | 张森捷",
  description:
    "总览→态势·作业台·空间·模型·文档：站网态势、室内/户外作业、流域一张图、产汇流对照与水平衡论证草稿",
};

export default function HydroBenchPage() {
  return (
    <Suspense fallback={<div className="hb-root hb-loading">加载中…</div>}>
      <HydroHub />
    </Suspense>
  );
}
