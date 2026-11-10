import type { Metadata } from "next";
import Link from "next/link";
import { FreqApp } from "@/components/freq/FreqApp";
import "./freq.css";

export const metadata: Metadata = {
  title: "水文频率小算盘 | 张森捷",
  description: "年最大系列矩法与 P-III 近似设计值。教学计算，不是审查适线。",
};

export default function FreqPage() {
  return (
    <div className="freq-root">
      <header className="freq-top">
        <Link href="/hydrobench">← 智慧水利</Link>
        <span>/freq</span>
      </header>
      <FreqApp />
    </div>
  );
}
