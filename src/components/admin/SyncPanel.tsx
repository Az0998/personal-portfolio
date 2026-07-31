"use client";

import { useState } from "react";
import { RefreshCw, Github, Shield } from "lucide-react";

export function SyncPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const [updateProfile, setUpdateProfile] = useState(false);

  async function handleSync() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUser: "Az0998",
          forceOverwrite,
          updateProfile,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "同步失败");
      } else {
        setMessage(data.message || "同步完成");
        setTimeout(() => window.location.reload(), 900);
      }
    } catch {
      setMessage("网络错误，请稍后重试");
    }
    setLoading(false);
  }

  return (
    <div className="anime-card p-6 mb-8 border-sakura/20">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg text-sakura-soft mb-1 flex items-center gap-2">
              <Github className="w-5 h-5" />
              仓库同步
            </h3>
            <p className="text-sm text-ink-400 flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 shrink-0 text-aqua" />
              默认只补全新作品，绝不覆盖已有条目。后台保存的作品文案/封面、头像、赞助码、反馈与点击数据，不会因网站版本更新而丢失。
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

        <div className="flex flex-col sm:flex-row gap-4 text-sm text-ink-300">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={forceOverwrite}
              onChange={(e) => setForceOverwrite(e.target.checked)}
            />
            强制覆盖已锁定作品文案（危险）
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={updateProfile}
              onChange={(e) => setUpdateProfile(e.target.checked)}
            />
            覆盖姓名/简介等资料文案（保留头像与赞助）
          </label>
        </div>
      </div>
      {message && <p className="text-sm text-aqua mt-4">{message}</p>}
    </div>
  );
}
