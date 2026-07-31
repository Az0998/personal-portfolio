"use client";

import { useEffect, useState } from "react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { Icon } from "@iconify/react";

type Summary = {
  total: number;
  byType: Record<string, number>;
  topPaths: { path: string; count: number }[];
  topClicks: { target: string; count: number }[];
  attentionPoints: { target: string; avgMs: number; samples: number }[];
  recent: {
    id: string;
    type: string;
    path: string;
    target: string | null;
    label: string | null;
    duration: number | null;
    createdAt: string;
  }[];
};

export default function AnalyticsAdminPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [days, setDays] = useState(14);

  useEffect(() => {
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [days]);

  return (
    <AdminLayout>
      <PageHeader
        title="点击量与注意力"
        description="前台埋点：pageview / click / cta / attention（视口停留）"
        action={
          <select
            className="input-field w-auto"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>近 7 日</option>
            <option value={14}>近 14 日</option>
            <option value={30}>近 30 日</option>
          </select>
        }
      />

      {!data ? (
        <p className="text-ink-400">加载中…</p>
      ) : (
        <>
          <div className="anime-card p-5 mb-6 flex flex-wrap gap-4 text-sm">
            <span>
              事件总数 <strong className="text-ember-soft">{data.total}</strong>
            </span>
            {Object.entries(data.byType || {}).map(([k, v]) => (
              <span key={k} className="text-ink-400">
                {k}: <strong className="text-ink-100">{v}</strong>
              </span>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Panel title="页面热度" icon="mdi:file-document-outline">
              {data.topPaths.map((r) => (
                <Row key={r.path} left={r.path} right={String(r.count)} />
              ))}
            </Panel>
            <Panel title="点击目标" icon="mdi:cursor-default-click">
              {data.topClicks.map((r) => (
                <Row key={r.target} left={r.target} right={String(r.count)} />
              ))}
            </Panel>
            <Panel title="注意力点" icon="mdi:timer-outline">
              {data.attentionPoints.map((r) => (
                <Row
                  key={r.target}
                  left={`${r.target} · n=${r.samples}`}
                  right={`${r.avgMs} ms`}
                />
              ))}
            </Panel>
          </div>

          <div className="anime-card p-6">
            <h3 className="font-semibold mb-4">最近事件</h3>
            <div className="overflow-x-auto text-sm">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-white/10">
                    <th className="py-2 pr-3">时间</th>
                    <th className="py-2 pr-3">类型</th>
                    <th className="py-2 pr-3">路径</th>
                    <th className="py-2 pr-3">目标</th>
                    <th className="py-2">停留</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((e) => (
                    <tr key={e.id} className="border-b border-white/5">
                      <td className="py-2 pr-3 text-ink-400 whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">{e.type}</td>
                      <td className="py-2 pr-3">{e.path}</td>
                      <td className="py-2 pr-3">{e.target || e.label || "—"}</td>
                      <td className="py-2">{e.duration != null ? `${e.duration} ms` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="anime-card p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <Icon icon={icon} /> {title}
      </h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 pb-2">
      <span className="truncate text-ink-200">{left}</span>
      <span className="font-mono text-ember-soft shrink-0">{right}</span>
    </div>
  );
}
