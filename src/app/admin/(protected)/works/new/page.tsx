"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { WorkForm, WorkFormData } from "@/components/admin/WorkForm";
import { Save } from "lucide-react";

export default function NewWorkPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: WorkFormData) {
    setSaving(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "coverImage" && value instanceof File) {
        formData.append("coverImage", value);
      } else if (value !== null && value !== undefined && key !== "coverImage") {
        formData.append(key, String(value));
      }
    });

    const res = await fetch("/api/works", { method: "POST", body: formData });
    if (res.ok) {
      router.push("/admin/works");
    }
    setSaving(false);
  }

  return (
    <AdminLayout>
      <PageHeader title="添加作品" description="创建一个新的作品展示" />
      <WorkForm
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={
          <>
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "创建作品"}
          </>
        }
      />
    </AdminLayout>
  );
}
