import { NextRequest, NextResponse } from "next/server";
import { confirmDirectUpload, publicMeta } from "@/lib/temp-files";

export const runtime = "nodejs";

/** 浏览器直传 R2 完成后确认对象已存在 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body?.code || "");
    if (!code) {
      return NextResponse.json({ error: "缺少 code" }, { status: 400 });
    }
    const row = await confirmDirectUpload(code);
    const origin = request.nextUrl.origin;
    return NextResponse.json({
      ...publicMeta(row),
      shareUrl: `${origin}/temp-files/${row.code}`,
      downloadUrl: `${origin}/api/temp-files/${row.code}/download`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "确认失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
