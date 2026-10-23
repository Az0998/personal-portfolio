import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "微型蒸渗仪实验站 | 张森捷",
  description: "榆中萃英山七步质控：接入、曲线、旗标、订正、水平衡、验证、报告。",
};

export default function SflLabPage() {
  const src = (process.env.SFL_LAB_UPSTREAM || "").replace(/\/$/, "");
  if (!src) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#102a43] px-6 text-white">
        <p>实验站正在接入个人站，稍后刷新。</p>
      </main>
    );
  }
  return (
    <iframe
      src={src}
      title="微型蒸渗仪实验站"
      className="fixed inset-0 h-dvh w-full border-0 bg-white"
    />
  );
}
