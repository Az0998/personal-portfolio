import { prisma } from "@/lib/db";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { SyncPanel } from "@/components/admin/SyncPanel";
import Link from "next/link";
import { User, FolderOpen, Eye, Star } from "lucide-react";

export default async function DashboardPage() {
  const profile = await prisma.profile.findFirst();
  const works = await prisma.work.findMany();
  const published = works.filter((w) => w.published).length;
  const featured = works.filter((w) => w.featured).length;

  const stats = [
    { label: "作品总数", value: works.length, icon: FolderOpen, color: "text-sakura-soft" },
    { label: "已发布", value: published, icon: Eye, color: "text-green-400" },
    { label: "精选作品", value: featured, icon: Star, color: "text-aqua" },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title={`你好，${profile?.name ?? "管理员"}`}
        description="懒人模式：改仓库文案 / 点同步，不必手填每一条进展"
      />

      <SyncPanel />

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="anime-card p-6">
            <div className="flex items-center justify-between mb-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-3xl font-bold font-cute">{value}</span>
            </div>
            <p className="text-sm text-ink-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/admin/profile"
          className="anime-card p-6 hover:border-sakura/40 transition-colors group"
        >
          <User className="w-8 h-8 text-sakura-soft mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-sakura-soft transition-colors">
            编辑个人信息
          </h3>
          <p className="text-sm text-ink-400">
            头像会压缩后存进数据库，Render 上也能稳定显示
          </p>
        </Link>

        <Link
          href="/admin/works"
          className="anime-card p-6 hover:border-sakura/40 transition-colors group"
        >
          <FolderOpen className="w-8 h-8 text-aqua mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-aqua transition-colors">
            管理作品
          </h3>
          <p className="text-sm text-ink-400">
            精选介绍以数据源为准；也可在此微调单条内容
          </p>
        </Link>
      </div>
    </AdminLayout>
  );
}
