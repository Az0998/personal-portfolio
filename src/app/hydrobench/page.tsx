import type { Metadata } from "next";
import { Suspense } from "react";
import { HydroHub } from "@/components/hydro/HydroHub";
import "../hydro/hydro.css";
import "./hydrobench.css";

export const metadata: Metadata = {
  title: "智慧水利 | 张森捷",
  description: "水情态势、室内作业台与户外应急台，同一入口三页签直达",
};

export default function HydroBenchPage() {
  return (
    <Suspense fallback={<div className="hb-root hb-loading">加载中…</div>}>
      <HydroHub />
    </Suspense>
  );
}
