import type { Metadata } from "next";
import { LifeSimApp } from "@/components/life-sim/LifeSimApp";
import "../life-sim.css";

export const metadata: Metadata = {
  title: "机甲星际同人 · 人生模拟",
  description: "同步率、机库午夜与星域裂缝——机甲星际同人风命运转盘。",
};

export default function MechaPage() {
  return <LifeSimApp domainId="mecha" />;
}
