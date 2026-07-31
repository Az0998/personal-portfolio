"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Download, FileWarning, Loader2 } from "lucide-react";

type Meta = {
  code: string;
  name: string;
  sizeLabel: string;
  mimeType: string;
  expiresAt: string;
  downloadCount: number;
};

export function TempFileDownload({ code }: { code: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/temp-files/${code}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "加载失败");
        setMeta(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="tf-share glass">
        <Loader2 className="w-8 h-8 animate-spin text-sakura mx-auto" />
        <p className="text-center text-ink-300 mt-3">正在读取文件信息…</p>
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="tf-share glass text-center">
        <FileWarning className="w-10 h-10 text-sakura mx-auto mb-3" />
        <h1 className="font-display text-2xl text-ink-100">无法获取文件</h1>
        <p className="text-ink-400 mt-2">{error || "文件不存在或已过期"}</p>
        <Link href="/temp-files" className="btn-primary mt-6 inline-flex">
          去上传新文件
        </Link>
      </div>
    );
  }

  const remainMs = new Date(meta.expiresAt).getTime() - Date.now();
  const remain =
    remainMs <= 0
      ? "已过期"
      : remainMs > 86400000
        ? `${Math.floor(remainMs / 86400000)} 天`
        : `${Math.max(1, Math.floor(remainMs / 3600000))} 小时`;

  return (
    <div className="tf-share glass">
      <div className="tf-badge mb-4">临时文件</div>
      <h1 className="font-display text-2xl md:text-3xl text-ink-50 break-all">{meta.name}</h1>
      <div className="flex flex-wrap gap-4 mt-4 text-sm text-ink-300">
        <span>{meta.sizeLabel}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-4 h-4" />
          剩余 {remain}
        </span>
        <span>已下载 {meta.downloadCount} 次</span>
      </div>
      <a href={`/api/temp-files/${code}/download`} className="btn-primary mt-8 inline-flex">
        <Download className="w-4 h-4" />
        下载文件
      </a>
      <p className="text-ink-500 text-xs mt-6">过期后链接将失效，请尽快下载。</p>
    </div>
  );
}
