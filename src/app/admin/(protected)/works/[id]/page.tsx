"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { WorkForm, WorkFormData } from "@/components/admin/WorkForm";
import { Save } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export default function EditWorkPage({ params }: PageProps) {
  const router = useRouter();
  const [workId, setWorkId] = useState<string>("");
  const [initial, setInitial] = useState<Partial<WorkFormData> | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setWorkId(id);
      fetch(`/api/works/${id}`)
        .then((r) => r.json())
        .then(setInitial)
        .finally(() => setLoading(false));
    });
  }, [params]);

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

    const res = await fetch(`/api/works/${workId}`, { method: "PUT", body: formData });
    if (res.ok) {
      router.push("/admin/works");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-ink-400">加载中...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader title="编辑作品" description="修改作品信息和内容" />
      <WorkForm
        initial={initial ?? undefined}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={
          <>
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "保存更改"}
          </>
        }
      />
    </AdminLayout>
  );
}
