import type { Metadata } from "next";
import { LifeSimApp } from "@/components/life-sim/LifeSimApp";
import "../life-sim.css";

export const metadata: Metadata = {
  title: "异世界转生 · 人生模拟",
  description: "外挂、小队、迷宫与传送门——异世界同人梗命运转盘。",
};

export default function IsekaiPage() {
  return <LifeSimApp domainId="isekai" />;
}
