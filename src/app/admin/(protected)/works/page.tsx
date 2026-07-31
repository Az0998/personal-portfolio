"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout, PageHeader, AddButton } from "@/components/admin/AdminLayout";
import { Edit, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { getWorkCategoryLabel } from "@/lib/utils";

interface Work {
  id: string;
  title: string;
  category: string;
  featured: boolean;
  published: boolean;
  locked: boolean;
  sortOrder: number;
  coverImage: string | null;
}

export default function WorksListPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/works?all=true")
      .then((r) => r.json())
      .then(setWorks)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这个作品吗？")) return;
    await fetch(`/api/works/${id}`, { method: "DELETE" });
    setWorks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <AdminLayout>
      <PageHeader
        title="作品管理"
        description="管理你的项目、论文、设计等各类作品"
        action={<AddButton href="/admin/works/new" />}
      />

      {loading ? (
        <p className="text-ink-400">加载中...</p>
      ) : works.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-ink-400 mb-4">还没有任何作品</p>
          <AddButton href="/admin/works/new" />
        </div>
      ) : (
        <div className="space-y-3">
          {works.map((work) => (
            <div
              key={work.id}
              className="glass rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                {work.coverImage ? (
                  <img src={work.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-500 text-xl font-display">
                    {work.title.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium truncate">{work.title}</h3>
                  {work.featured && <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                  {!work.published && <EyeOff className="w-4 h-4 text-ink-500 flex-shrink-0" />}
                  {work.locked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-aqua/20 text-aqua shrink-0">
                      已保护
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-400">
                  {getWorkCategoryLabel(work.title, work.category)} · 排序 {work.sortOrder}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/works/${work.id}`}
                  target="_blank"
                  className="p-2 text-ink-400 hover:text-white transition-colors"
                  title="预览"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <Link
                  href={`/admin/works/${work.id}`}
                  className="p-2 text-ink-400 hover:text-accent-light transition-colors"
                  title="编辑"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(work.id)}
                  className="p-2 text-ink-400 hover:text-red-400 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
