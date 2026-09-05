import type { Metadata } from "next";
import Link from "next/link";
import { XajBenchApp } from "@/components/xaj-bench/XajBenchApp";
import "./xaj-bench.css";

export const metadata: Metadata = {
  title: "新安江机理预报对照台 | 张森捷",
  description:
    "日降水→新安江产汇流→出口流量；同口径 NSE 对照数据驱动基线。浏览器可复现。",
};

const HYDRO_ML_URL =
  process.env.NEXT_PUBLIC_HYDRO_ML_URL?.trim() || "/presentations/hydro-ml";
const HYDRO_INFO_URL =
  process.env.NEXT_PUBLIC_HYDRO_INFO_URL?.trim() || "/hydrobench?tab=info";

export default function XajBenchPage() {
  return (
    <div className="xaj-root">
      <header className="xaj-top">
        <Link href="/" className="xaj-back">
          ← 返回主站
        </Link>
        <div className="xaj-top-bridge">
          <span className="xaj-bridge-copy">
            同流域或同评价指标下的数据驱动对照见
          </span>
          <Link href={HYDRO_ML_URL} className="xaj-pill">
            Hydro-ML
          </Link>
          <Link href={HYDRO_INFO_URL} className="xaj-pill">
            HydroInfo
          </Link>
        </div>
        <div className="xaj-pill muted">/xaj-bench</div>
      </header>
      <XajBenchApp hydroMlUrl={HYDRO_ML_URL} hydroInfoUrl={HYDRO_INFO_URL} />
    </div>
  );
}
