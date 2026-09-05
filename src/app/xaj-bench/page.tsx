import type { Metadata } from "next";
import Link from "next/link";
import { XajBenchApp } from "@/components/xaj-bench/XajBenchApp";
import "./xaj-bench.css";

export const metadata: Metadata = {
  title: "新安江机理预报对照台 | 张森捷",
  description:
    "日降水→新安江三水源产汇流→出口流量；与 Persistence / Lag-LSTM 同数据对照 NSE。会讲产汇流的机理对照台。",
};

export default function XajBenchPage() {
  return (
    <div className="xaj-root">
      <header className="xaj-top">
        <Link href="/" className="xaj-back">
          ← 返回主站
        </Link>
        <div className="xaj-pill">/xaj-bench</div>
      </header>
      <XajBenchApp />
    </div>
  );
}
