"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  Copy,
  Download,
  FileUp,
  Link2,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";

type Config = {
  maxBytes: number;
  maxLabel: string;
  ttlHours: number[];
  defaultTtlHours: number;
  note: string;
};

type UploadResult = {
  code: string;
  name: string;
  sizeLabel: string;
  expiresAt: string;
  deleteToken: string;
  shareUrl: string;
  downloadUrl: string;
};

const TTL_LABEL: Record<number, string> = {
  1: "1 小时",
  6: "6 小时",
  24: "1 天",
  72: "3 天",
  168: "7 天",
};

function formatRemain(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "已过期";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 48) return `${Math.floor(h / 24)} 天 ${h % 24} 小时`;
  if (h > 0) return `${h} 小时 ${m} 分`;
  return `${m} 分钟`;
}

export function TempFilesApp() {
  const [config, setConfig] = useState<Config | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ttl, setTtl] = useState(24);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [copied, setCopied] = useState<"share" | "delete" | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch("/api/temp-files")
      .then((r) => r.json())
      .then((data: Config) => {
        setConfig(data);
        setTtl(data.defaultTtlHours);
      })
      .catch(() => setError("无法加载配置"));
  }, []);

  const onPick = useCallback((f: File | null) => {
    setError("");
    setResult(null);
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onPick(f);
    },
    [onPick]
  );

  async function upload() {
    if (!file) {
      setError("请先选择文件");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("ttlHours", String(ttl));
      const res = await fetch("/api/temp-files", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      setResult(data);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, kind: "share" | "delete") {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1600);
  }

  async function remove() {
    if (!result) return;
    if (!confirm("确定立即删除该临时文件？")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/temp-files/${result.code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteToken: result.deleteToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      setResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  const ttlOptions = useMemo(() => config?.ttlHours ?? [1, 6, 24, 72, 168], [config]);

  return (
    <div className="tf-shell">
      <section className="tf-hero glass">
        <div className="tf-badge">
          <UploadCloud className="w-4 h-4" />
          临时文件柜
        </div>
        <h1 className="font-display text-3xl md:text-4xl gradient-text">
          上传 · 分享 · 到期自动消失
        </h1>
        <p className="text-ink-300 mt-3 max-w-2xl leading-relaxed">
          适合作业稿、截图、压缩包等短期互传。单文件上限{" "}
          <span className="text-sakura-soft">{config?.maxLabel ?? "…"}</span>
          ，过期后自动清理。{config?.note}
        </p>
      </section>

      <section className="tf-grid">
        <div className="tf-card glass">
          <h2 className="tf-card-title">
            <FileUp className="w-5 h-5 text-sakura" />
            上传文件
          </h2>

          <div
            className={`tf-drop ${dragOver ? "tf-drop-active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              id="tf-file"
              type="file"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />
            <label htmlFor="tf-file" className="tf-drop-label">
              <UploadCloud className="w-10 h-10 text-sakura/80 mb-3" />
              <span className="text-ink-100 font-medium">
                {file ? file.name : "拖拽到这里，或点击选择"}
              </span>
              {file && (
                <span className="text-ink-400 text-sm mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </label>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 text-sm text-ink-300 mb-2">
              <Clock className="w-4 h-4" />
              有效期
            </div>
            <div className="flex flex-wrap gap-2">
              {ttlOptions.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTtl(h)}
                  className={`tf-chip ${ttl === h ? "tf-chip-on" : ""}`}
                >
                  {TTL_LABEL[h] ?? `${h}h`}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="tf-error mt-4">{error}</p>}

          <button
            type="button"
            className="btn-primary mt-6 w-full justify-center disabled:opacity-50"
            disabled={busy || !file}
            onClick={upload}
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                上传中…
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                生成分享链接
              </>
            )}
          </button>
        </div>

        <div className="tf-card glass">
          <h2 className="tf-card-title">
            <Link2 className="w-5 h-5 text-aqua" />
            分享结果
          </h2>

          {!result ? (
            <div className="tf-empty">
              <p>上传成功后，这里会出现分享链接与删除令牌。</p>
              <p className="text-ink-500 text-sm mt-2">请妥善保存删除令牌，离开页面后无法再找回。</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="tf-meta">
                <div>
                  <div className="text-ink-400 text-xs">文件</div>
                  <div className="text-ink-100 font-medium break-all">{result.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-ink-400 text-xs">大小</div>
                    <div>{result.sizeLabel}</div>
                  </div>
                  <div>
                    <div className="text-ink-400 text-xs">剩余</div>
                    <div>{formatRemain(result.expiresAt)}</div>
                  </div>
                </div>
              </div>

              <Field
                label="分享链接"
                value={result.shareUrl}
                onCopy={() => copy(result.shareUrl, "share")}
                copied={copied === "share"}
              />
              <Field
                label="删除令牌（仅你可见）"
                value={result.deleteToken}
                onCopy={() => copy(result.deleteToken, "delete")}
                copied={copied === "delete"}
                secret
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <a href={result.downloadUrl} className="btn-outline">
                  <Download className="w-4 h-4" />
                  下载
                </a>
                <button type="button" className="btn-outline text-sakura-soft border-sakura/40" onClick={remove} disabled={busy}>
                  <Trash2 className="w-4 h-4" />
                  立即删除
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
  copied,
  secret,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  secret?: boolean;
}) {
  return (
    <div>
      <div className="text-ink-400 text-xs mb-1">{label}</div>
      <div className="tf-field">
        <code className={secret ? "blur-[3px] hover:blur-0 transition" : ""}>{value}</code>
        <button type="button" onClick={onCopy} className="tf-copy" title="复制">
          {copied ? <Check className="w-4 h-4 text-aqua" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
