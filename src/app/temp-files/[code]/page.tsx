import type { Metadata } from "next";
import Link from "next/link";
import { TempFileDownload } from "@/components/temp-files/TempFileDownload";
import "../temp-files.css";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `临时文件 ${code} | 张森捷`,
    description: "下载临时分享文件",
    robots: { index: false, follow: false },
  };
}

export default async function TempFileSharePage({ params }: Props) {
  const { code } = await params;
  return (
    <div className="tf-root">
      <header className="tf-top">
        <Link href="/temp-files" className="tf-back">
          ← 临时文件柜
        </Link>
        <div className="font-display text-lg text-sakura-soft">文件下载</div>
        <span className="tf-pill">{code}</span>
      </header>
      <div className="max-w-xl mx-auto px-6 py-10">
        <TempFileDownload code={code} />
      </div>
    </div>
  );
}
