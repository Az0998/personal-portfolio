import { NextResponse } from "next/server";

/** Lightweight probe for Render health checks — no Prisma, no SSR. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { ok: true, ts: Date.now() },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
