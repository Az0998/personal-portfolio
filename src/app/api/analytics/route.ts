import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 批量写入埋点（公开，限流靠体量控制） */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = Array.isArray(body.events) ? body.events : [body];
    const rows = events.slice(0, 40).map((e: Record<string, unknown>) => ({
      type: String(e.type || "click").slice(0, 32),
      path: String(e.path || "/").slice(0, 240),
      target: e.target != null ? String(e.target).slice(0, 120) : null,
      label: e.label != null ? String(e.label).slice(0, 200) : null,
      duration:
        typeof e.duration === "number" && e.duration >= 0
          ? Math.min(Math.floor(e.duration), 600000)
          : null,
      meta: e.meta != null ? JSON.stringify(e.meta).slice(0, 1000) : null,
      sessionId: e.sessionId != null ? String(e.sessionId).slice(0, 64) : null,
    }));

    if (!rows.length) {
      return NextResponse.json({ error: "empty" }, { status: 400 });
    }

    await prisma.analyticsEvent.createMany({ data: rows });
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "track failed" }, { status: 500 });
  }
}

/** 后台汇总 */
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Number(req.nextUrl.searchParams.get("days") || 14);
  const since = new Date(Date.now() - Math.min(Math.max(days, 1), 90) * 86400000);

  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const byPath: Record<string, number> = {};
  const byTarget: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const attention: Record<string, { total: number; count: number }> = {};

  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byPath[e.path] = (byPath[e.path] || 0) + 1;
    if (e.target) byTarget[e.target] = (byTarget[e.target] || 0) + 1;
    if (e.type === "attention" && e.target && e.duration) {
      if (!attention[e.target]) attention[e.target] = { total: 0, count: 0 };
      attention[e.target].total += e.duration;
      attention[e.target].count += 1;
    }
  }

  const topPaths = Object.entries(byPath)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([path, count]) => ({ path, count }));

  const topClicks = Object.entries(byTarget)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([target, count]) => ({ target, count }));

  const attentionPoints = Object.entries(attention)
    .map(([target, v]) => ({
      target,
      avgMs: Math.round(v.total / Math.max(v.count, 1)),
      samples: v.count,
    }))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 16);

  const recent = events.slice(0, 40).map((e) => ({
    id: e.id,
    type: e.type,
    path: e.path,
    target: e.target,
    label: e.label,
    duration: e.duration,
    createdAt: e.createdAt,
  }));

  return NextResponse.json({
    since,
    total: events.length,
    byType,
    topPaths,
    topClicks,
    attentionPoints,
    recent,
  });
}
