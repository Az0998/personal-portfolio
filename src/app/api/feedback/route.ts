import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

function hashIp(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/** 公开提交意见反馈 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || "").trim();
    if (message.length < 4) {
      return NextResponse.json({ error: "请至少写 4 个字" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "内容过长" }, { status: 400 });
    }

    const row = await prisma.feedback.create({
      data: {
        name: body.name ? String(body.name).slice(0, 80) : null,
        email: body.email ? String(body.email).slice(0, 120) : null,
        message,
        page: body.page ? String(body.page).slice(0, 200) : null,
        userAgent: req.headers.get("user-agent")?.slice(0, 240) || null,
        ipHash: hashIp(req),
      },
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
