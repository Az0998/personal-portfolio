import type { Metadata } from "next";
import { LifeSimApp } from "@/components/life-sim/LifeSimApp";
import "../life-sim.css";

export const metadata: Metadata = {
  title: "都市夜谈 · 人生模拟",
  description: "天台、末班车、洗衣房与关东煮审判——短而跳的夜游命运转盘。",
};

export default function NightLifePage() {
  return <LifeSimApp domainId="night" />;
}
