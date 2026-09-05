import type { Metadata } from "next";
import { WaterBalanceShell } from "@/components/water-balance/WaterBalanceShell";
import { WORK_BLURB } from "@/lib/water-balance/nav";
import "./water-balance.css";

export const metadata: Metadata = {
  title: "水平衡论证草稿 | 张森捷",
  description: WORK_BLURB,
};

export default function WaterBalanceReportPage() {
  return <WaterBalanceShell />;
}
