import type { Metadata } from "next";
import Link from "next/link";
import { TempFilesApp } from "@/components/temp-files/TempFilesApp";
import "./temp-files.css";

export const metadata: Metadata = {
  title: "临时文件柜 · 上传分享 | 张森捷",
  description: "个人站临时文件存储：上传、分享链接、到期自动删除。适合作业与短时互传。",
};

export default function TempFilesPage() {
  return (
    <div className="tf-root">
      <header className="tf-top">
        <Link href="/" className="tf-back">
          ← 返回主页
        </Link>
        <div>
          <div className="font-display text-xl text-sakura-soft">临时文件柜</div>
          <div className="text-xs text-ink-400">Temp Drop · 到期自毁</div>
        </div>
        <span className="tf-pill">免费自托管</span>
      </header>
      <TempFilesApp />
    </div>
  );
}
