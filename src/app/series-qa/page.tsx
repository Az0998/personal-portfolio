import type { Metadata } from "next";
import Link from "next/link";
import { SeriesQaApp } from "@/components/series-qa/SeriesQaApp";
import "./series-qa.css";

export const metadata: Metadata = {
  title: "系列质检台 | 张森捷",
  description: "浏览器内检查时间序列 CSV：缺测、重复、倒序、负值与尖峰。文件不上传。",
};

export default function SeriesQaPage() {
  return (
    <div className="sqa-root">
      <header className="sqa-top">
        <Link href="/labs">← 互动演示</Link>
        <span>/series-qa</span>
      </header>
      <SeriesQaApp />
    </div>
  );
}
