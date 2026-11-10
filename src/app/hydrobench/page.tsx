import type { Metadata } from "next";
import { Suspense } from "react";
import { HydroHub } from "@/components/hydro/HydroHub";
import "../hydro/hydro.css";
import "./hydrobench.css";

export const metadata: Metadata = {
  title: "智慧水利总览 | 张森捷",
  description:
    "课上走采集课堂（微型蒸渗仪七步）。面试走五分钟导览：作业→空间→态势→模型→文档。",
};

export default function HydroBenchPage() {
  return (
    <Suspense fallback={<div className="hb-root hb-loading">加载中…</div>}>
      <HydroHub />
    </Suspense>
  );
}
