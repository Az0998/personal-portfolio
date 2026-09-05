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
              <span>
                <strong className="text-ink-200">锁定作品不会被 seed 覆盖。</strong>{" "}
                默认同步：新建缺失作品；已锁定跳过；未锁定仅轻量更新分类 / 精选 / 排序 /
                标签 / 链接（保留正文与封面）。头像、赞助码、反馈与点击数据始终保留。勾选下方「强制覆盖」才会改写锁定条目——面试前勿误开。
              </span>
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
            强制用仓库种子覆盖文案（含已锁定，危险）
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
