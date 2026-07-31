"use client";

import { useEffect, useState } from "react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { Icon } from "@iconify/react";

type Item = {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  page: string | null;
  read: boolean;
  createdAt: string;
};

export default function FeedbackAdminPage() {
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const res = await fetch("/api/admin/feedback");
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function mark(id: string, read: boolean) {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("删除这条反馈？")) return;
    await fetch(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <AdminLayout>
      <PageHeader title="意见反馈" description="前台「反馈」区块提交的内容" />
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-ink-400 text-sm">暂无反馈。</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={`anime-card p-5 ${item.read ? "opacity-70" : "border-ember/30"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div className="text-sm text-ink-400">
                {new Date(item.createdAt).toLocaleString()}
                {item.name ? ` · ${item.name}` : ""}
                {item.email ? ` · ${item.email}` : ""}
                {item.page ? ` · ${item.page}` : ""}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline text-xs py-1.5 px-3"
                  onClick={() => mark(item.id, !item.read)}
                >
                  <Icon icon={item.read ? "mdi:email-outline" : "mdi:email-open-outline"} width={14} />
                  {item.read ? "标为未读" : "标为已读"}
                </button>
                <button
                  type="button"
                  className="btn-outline text-xs py-1.5 px-3 text-red-300"
                  onClick={() => remove(item.id)}
                >
                  删除
                </button>
              </div>
            </div>
            <p className="text-ink-100 whitespace-pre-wrap leading-relaxed">{item.message}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
