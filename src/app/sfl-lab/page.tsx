import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { SflLabLanding } from "@/components/sfl-lab/SflLabLanding";
import "./sfl-lab.css";

export const metadata: Metadata = {
  title: "微型蒸渗仪实验站 | 张森捷",
  description:
    "智慧水利分支：接入 DT80、旗标、Kapilaratne 订正与水平衡。泵不是雨，ET0 不是 ETa。页面独立，不挤进工作台页签。",
};

export default function SflLabPage() {
  const liveOrigin =
    process.env.NEXT_PUBLIC_SFL_LAB_ORIGIN ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:5173" : "");
  return (
    <>
      <SiteBackground />
      <div className="relative z-[1] min-h-dvh flex flex-col">
        <Navbar name="张森捷" />
        <main className="flex-1 relative z-[2]">
          <SflLabLanding liveOrigin={liveOrigin} />
        </main>
        <Footer name="张森捷" />
      </div>
    </>
  );
}
