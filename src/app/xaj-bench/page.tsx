import type { Metadata } from "next";
import { XajBenchShell } from "@/components/xaj-bench/XajBenchShell";
import "./xaj-bench.css";

export const metadata: Metadata = {
  title: "产汇流机理对照 | 张森捷",
  description:
    "日降水→新安江产汇流→出口流量；同口径 NSE 对照数据驱动基线。浏览器可复现。",
};

export default function XajBenchPage() {
  return <XajBenchShell />;
}
