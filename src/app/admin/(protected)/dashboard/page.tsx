import { prisma } from "@/lib/db";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { SyncPanel } from "@/components/admin/SyncPanel";
import Link from "next/link";
import {
  FolderOpen,
  Eye,
  Star,
  Activity,
  MessageSquare,
  User,
  MousePointerClick,
  Timer,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await prisma.profile.findFirst();
  const works = await prisma.work.findMany();
  const published = works.filter((w) => w.published).length;
  const featured = works.filter((w) => w.featured).length;
  const unreadFeedback = await prisma.feedback.count({ where: { read: false } });
  const feedbackTotal = await prisma.feedback.count();

  const since = new Date(Date.now() - 14 * 86400000);
  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { type: true, path: true, target: true, duration: true },
  });

  const byPath: Record<string, number> = {};
  const byTarget: Record<string, number> = {};
  const attention: Record<string, { total: number; n: number }> = {};
  for (const e of events) {
    byPath[e.path] = (byPath[e.path] || 0) + 1;
    if (e.target) byTarget[e.target] = (byTarget[e.target] || 0) + 1;
    if (e.type === "attention" && e.target && e.duration) {
      if (!attention[e.target]) attention[e.target] = { total: 0, n: 0 };
      attention[e.target].total += e.duration;
      attention[e.target].n += 1;
    }
  }
  const topPaths = Object.entries(byPath).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topClicks = Object.entries(byTarget).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topAttention = Object.entries(attention)
    .map(([k, v]) => [k, Math.round(v.total / Math.max(v.n, 1))] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const stats = [
    { label: "作品总数", value: works.length, icon: FolderOpen },
    { label: "已发布", value: published, icon: Eye },
    { label: "精选", value: featured, icon: Star },
    { label: "14 日事件", value: events.length, icon: Activity },
    { label: "未读反馈", value: unreadFeedback, icon: MessageSquare },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title={`你好，${profile?.name ?? "管理员"}`}
        description="作品文案随仓库同步；点击量与反馈在下方与侧栏查看"
      />

      <SyncPanel />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="anime-card p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-5 h-5 text-ember-soft" />
              <span className="text-2xl font-bold">{value}</span>
            </div>
            <p className="text-sm text-ink-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="anime-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4" /> 热门点击（14 日）
          </h3>
          {topClicks.length === 0 ? (
            <p className="text-sm text-ink-500">尚无埋点数据，前台浏览后会在此出现。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topClicks.map(([target, count]) => (
                <li key={target} className="flex justify-between gap-3 border-b border-white/5 pb-2">
                  <span className="text-ink-200 truncate">{target}</span>
                  <span className="text-ember-soft font-mono">{count}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/analytics" className="inline-block mt-4 text-sm text-teal-soft hover:underline">
            打开完整分析 →
          </Link>
        </div>

        <div className="anime-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Timer className="w-4 h-4" /> 注意力点（平均停留 ms）
          </h3>
          {topAttention.length === 0 ? (
            <p className="text-sm text-ink-500">区块进入视口超过约 0.8s 会记一次注意力。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topAttention.map(([target, avg]) => (
                <li key={target} className="flex justify-between gap-3 border-b border-white/5 pb-2">
                  <span className="text-ink-200 truncate">{target}</span>
                  <span className="text-teal-soft font-mono">{avg} ms</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-xs text-ink-500">
            路径热度：{topPaths.map(([p, c]) => `${p}(${c})`).join(" · ") || "—"}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/admin/profile" className="anime-card p-6 hover:border-ember/40 transition-colors">
          <User className="w-8 h-8 text-ember-soft mb-3" />
          <h3 className="font-semibold mb-1">个人信息 / 赞助</h3>
          <p className="text-sm text-ink-400">头像、赞助外链与收款码</p>
        </Link>
        <Link href="/admin/works" className="anime-card p-6 hover:border-ember/40 transition-colors">
          <FolderOpen className="w-8 h-8 text-teal-soft mb-3" />
          <h3 className="font-semibold mb-1">管理作品</h3>
          <p className="text-sm text-ink-400">精选介绍以仓库数据源为准</p>
        </Link>
        <Link href="/admin/feedback" className="anime-card p-6 hover:border-ember/40 transition-colors">
          <MessageSquare className="w-8 h-8 text-ember-soft mb-3" />
          <h3 className="font-semibold mb-1">意见反馈</h3>
          <p className="text-sm text-ink-400">
            共 {feedbackTotal} 条 · 未读 {unreadFeedback}
          </p>
        </Link>
      </div>
    </AdminLayout>
  );
}
