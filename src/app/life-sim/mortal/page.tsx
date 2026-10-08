import type { Metadata } from "next";
import { LifeSimApp } from "@/components/life-sim/LifeSimApp";
import "../life-sim.css";

export const metadata: Metadata = {
  title: "凡人重开 · 人生模拟",
  description: "年龄池 + 属性门槛 + 快乐抗性的凡人向命运转盘。",
};

export default function MortalLifePage() {
  return <LifeSimApp domainId="mortal" />;
}
