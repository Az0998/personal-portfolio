import type { Metadata } from "next";
import { LifeSimApp } from "@/components/life-sim/LifeSimApp";
import "../life-sim.css";

export const metadata: Metadata = {
  title: "魔法学院同人 · 人生模拟",
  description: "原创四院、课堂事故与毕业钟楼——学院同人风命运转盘。",
};

export default function AcademyPage() {
  return <LifeSimApp domainId="academy" />;
}
