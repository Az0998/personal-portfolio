import type { Metadata } from "next";
import { LifeSimApp } from "@/components/life-sim/LifeSimApp";
import "../life-sim.css";

export const metadata: Metadata = {
  title: "修仙同人 · 人生模拟",
  description: "山门、秘境、渡劫与道侣——修仙类型同人风命运转盘（原创桥段）。",
};

export default function XianxiaPage() {
  return <LifeSimApp domainId="xianxia" />;
}
