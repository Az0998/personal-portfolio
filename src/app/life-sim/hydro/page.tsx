import type { Metadata } from "next";
import { LifeSimApp } from "@/components/life-sim/LifeSimApp";
import "../life-sim.css";

export const metadata: Metadata = {
  title: "水信息职场 · 人生模拟",
  description: "测站、论证、信息化交付与考研编制分支的趣味职场模拟。",
};

export default function HydroCareerLifePage() {
  return <LifeSimApp domainId="hydro" />;
}
