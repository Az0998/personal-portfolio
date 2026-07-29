"use client";

import { useEffect, useState } from "react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { Save, Upload } from "lucide-react";
import { compressImage } from "@/lib/image";

interface Profile {
  id?: string;
  name: string;
  title: string;
  tagline: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  twitter: string;
  website: string;
  wechat: string;
  resumeUrl: string;
  avatar?: string | null;
}

const emptyProfile: Profile = {
  name: "", title: "", tagline: "", bio: "",
  email: "", phone: "", location: "",
  github: "", linkedin: "", twitter: "", website: "", wechat: "", resumeUrl: "",
};

export default function ProfileEditPage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) setProfile({ ...emptyProfile, ...data });
      });
  }, []);

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setMessage("正在压缩头像...");
    try {
      const compressed = await compressImage(file, { maxSize: 480, quality: 0.8 });
      setAvatarFile(compressed);
      setPreview(URL.createObjectURL(compressed));
      setMessage("头像已就绪，点保存即可");
    } catch {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
      setMessage("压缩失败，将尝试原图上传");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData();
    Object.entries(profile).forEach(([key, value]) => {
      if (key !== "id" && key !== "avatar" && value) formData.append(key, value);
    });
    if (avatarFile) formData.append("avatar", avatarFile);

    const res = await fetch("/api/profile", { method: "PUT", body: formData });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setProfile({ ...emptyProfile, ...data });
      setAvatarFile(null);
      setPreview(null);
      setMessage("保存成功！前台刷新即可看到头像");
    } else {
      setMessage(data.error || "保存失败，请换更小的图片重试");
    }
    setSaving(false);
  }

  function updateField(field: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  const avatarSrc = preview || profile.avatar || null;

  return (
    <AdminLayout>
      <PageHeader
        title="个人信息"
        description="头像会自动压缩并写入数据库，适合 Render 部署环境"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="anime-card p-6 space-y-4">
          <h3 className="font-semibold mb-2">基本资料</h3>

          <div className="flex items-center gap-6 mb-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 border border-sakura/20">
              {avatarSrc ? (
                <img src={avatarSrc} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-500">
                  <Upload className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="btn-outline text-sm cursor-pointer inline-flex">
                <Upload className="w-4 h-4" />
                选择头像
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="text-xs text-ink-500">建议正方形 JPG/PNG，选完会自动压缩</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">姓名 *</label>
              <input className="input-field" value={profile.name} onChange={(e) => updateField("name", e.target.value)} required />
            </div>
            <div>
              <label className="label-field">职位/头衔 *</label>
              <input className="input-field" value={profile.title} onChange={(e) => updateField("title", e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="label-field">一句话介绍</label>
            <input className="input-field" value={profile.tagline} onChange={(e) => updateField("tagline", e.target.value)} />
          </div>

          <div>
            <label className="label-field">个人简介</label>
            <textarea
              className="input-field min-h-[120px] resize-y"
              value={profile.bio}
              onChange={(e) => updateField("bio", e.target.value)}
            />
          </div>
        </div>

        <div className="anime-card p-6 space-y-4">
          <h3 className="font-semibold mb-2">联系方式</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">邮箱</label>
              <input className="input-field" type="email" value={profile.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>
            <div>
              <label className="label-field">电话</label>
              <input className="input-field" value={profile.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>
            <div>
              <label className="label-field">位置</label>
              <input className="input-field" value={profile.location} onChange={(e) => updateField("location", e.target.value)} />
            </div>
            <div>
              <label className="label-field">微信</label>
              <input className="input-field" value={profile.wechat} onChange={(e) => updateField("wechat", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="anime-card p-6 space-y-4">
          <h3 className="font-semibold mb-2">社交链接</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">GitHub</label>
              <input className="input-field" value={profile.github} onChange={(e) => updateField("github", e.target.value)} placeholder="https://github.com/Az0998" />
            </div>
            <div>
              <label className="label-field">LinkedIn</label>
              <input className="input-field" value={profile.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
            </div>
            <div>
              <label className="label-field">Twitter / X</label>
              <input className="input-field" value={profile.twitter} onChange={(e) => updateField("twitter", e.target.value)} />
            </div>
            <div>
              <label className="label-field">个人网站</label>
              <input className="input-field" value={profile.website} onChange={(e) => updateField("website", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "保存更改"}
          </button>
          {message && (
            <span className={message.includes("成功") || message.includes("就绪") ? "text-green-400" : "text-sakura-soft"}>
              {message}
            </span>
          )}
        </div>
      </form>
    </AdminLayout>
  );
}
