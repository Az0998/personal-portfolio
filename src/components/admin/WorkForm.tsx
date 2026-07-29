"use client";

import { useState } from "react";
import { WORK_CATEGORIES } from "@/lib/utils";
import { Upload } from "lucide-react";

export interface WorkFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string;
  link: string;
  github: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  coverImage?: File | null;
  coverImageUrl?: string | null;
}

const defaults: WorkFormData = {
  title: "",
  description: "",
  content: "",
  category: "project",
  tags: "",
  link: "",
  github: "",
  featured: false,
  published: true,
  sortOrder: 0,
};

interface WorkFormProps {
  initial?: Partial<WorkFormData>;
  onSubmit: (data: WorkFormData) => void;
  saving: boolean;
  submitLabel: React.ReactNode;
}

export function WorkForm({ initial, onSubmit, saving, submitLabel }: WorkFormProps) {
  const [form, setForm] = useState<WorkFormData>({ ...defaults, ...initial });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  function update(field: keyof WorkFormData, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ ...form, coverImage: coverFile });
  }

  const previewUrl = coverFile
    ? URL.createObjectURL(coverFile)
    : initial?.coverImageUrl ?? (initial as { coverImage?: string })?.coverImage;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold">基本信息</h3>

        <div>
          <label className="label-field">封面图片</label>
          <div className="flex items-center gap-4">
            <div className="w-32 h-20 rounded-lg overflow-hidden bg-white/5">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-500">
                  <Upload className="w-5 h-5" />
                </div>
              )}
            </div>
            <label className="btn-outline text-sm cursor-pointer">
              选择图片
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="label-field">标题 *</label>
          <input
            className="input-field"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label-field">简短描述</label>
          <textarea
            className="input-field min-h-[80px] resize-y"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="一句话概括这个作品"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">分类</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {WORK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-ink-900">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">标签（逗号分隔）</label>
            <input
              className="input-field"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="Python, 深度学习, 开源"
            />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold">详细内容</h3>
        <div>
          <label className="label-field">正文（支持 Markdown）</label>
          <textarea
            className="input-field min-h-[200px] resize-y font-mono text-sm"
            value={form.content}
            onChange={(e) => update("content", e.target.value)}
            placeholder="## 项目背景&#10;&#10;详细描述你的工作..."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">项目链接</label>
            <input
              className="input-field"
              value={form.link}
              onChange={(e) => update("link", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="label-field">GitHub 链接</label>
            <input
              className="input-field"
              value={form.github}
              onChange={(e) => update("github", e.target.value)}
              placeholder="https://github.com/..."
            />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold">发布设置</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label-field">排序（越小越靠前）</label>
            <input
              type="number"
              className="input-field"
              value={form.sortOrder}
              onChange={(e) => update("sortOrder", parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-6">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="w-4 h-4 rounded accent-accent"
            />
            <span className="text-sm">精选作品</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer pt-6">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
              className="w-4 h-4 rounded accent-accent"
            />
            <span className="text-sm">立即发布</span>
          </label>
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
        {submitLabel}
      </button>
    </form>
  );
}
