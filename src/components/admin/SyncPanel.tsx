"use client";

import { useState } from "react";
import { RefreshCw, Github } from "lucide-react";

export function SyncPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSync() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUser: "Az0998" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "同步失败");
      } else {
        setMessage(data.message || "同步完成");
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      setMessage("网络错误，请稍后重试");
    }
    setLoading(false);
  }

  return (
    <div className="anime-card p-6 mb-8 border-sakura/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-sakura-soft mb-1 flex items-center gap-2">
            <Github className="w-5 h-5" />
            自动同步进展
          </h3>
          <p className="text-sm text-ink-400">
            从仓库精选文案（works-content）更新介绍，并拉取 GitHub 公开仓库卡片。
            日常改进展：改本地数据 → push → Render 自动部署即可。
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          className="btn-primary disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "同步中..." : "立即同步"}
        </button>
      </div>
      {message && <p className="text-sm text-aqua mt-4">{message}</p>}
    </div>
  );
}
