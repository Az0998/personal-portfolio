import { prisma } from "@/lib/db";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import Link from "next/link";
import { User, FolderOpen, Eye, Star } from "lucide-react";

export default async function DashboardPage() {
  const profile = await prisma.profile.findFirst();
  const works = await prisma.work.findMany();
  const published = works.filter((w) => w.published).length;
  const featured = works.filter((w) => w.featured).length;

  const stats = [
    { label: "作品总数", value: works.length, icon: FolderOpen, color: "text-accent-light" },
    { label: "已发布", value: published, icon: Eye, color: "text-green-400" },
    { label: "精选作品", value: featured, icon: Star, color: "text-yellow-400" },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title={`你好，${profile?.name ?? "管理员"}`}
        description="欢迎回来，这里是你的作品集管理面板"
      />

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-3xl font-bold">{value}</span>
            </div>
            <p className="text-sm text-ink-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/admin/profile"
          className="glass rounded-2xl p-6 hover:border-accent/30 transition-colors group"
        >
          <User className="w-8 h-8 text-accent-light mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-accent-light transition-colors">
            编辑个人信息
          </h3>
          <p className="text-sm text-ink-400">
            更新姓名、简介、头像、联系方式和社交链接
          </p>
        </Link>

        <Link
          href="/admin/works"
          className="glass rounded-2xl p-6 hover:border-accent/30 transition-colors group"
        >
          <FolderOpen className="w-8 h-8 text-accent-light mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-accent-light transition-colors">
            管理作品
          </h3>
          <p className="text-sm text-ink-400">
            添加、编辑或删除项目、论文、设计等各类作品
          </p>
        </Link>
      </div>
    </AdminLayout>
  );
}
