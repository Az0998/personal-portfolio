import type { Metadata } from "next";
import { CsLifeApp } from "@/components/cs-life/CsLifeApp";
import "./cs-life.css";
import "../life-sim/life-sim.css";

export const metadata: Metadata = {
  title: "CS 人生模拟转盘 · AI 事件发展",
  description:
    "加权命运转盘驱动的 CS 职业人生示意：开局特质、六维成长、自适应赛季事件，可保存分享。",
};

export default function CsLifePage() {
  return <CsLifeApp />;
}
