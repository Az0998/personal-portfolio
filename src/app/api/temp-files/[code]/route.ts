import { NextRequest, NextResponse } from "next/server";
import { deleteTempFile, getTempFileByCode, publicMeta } from "@/lib/temp-files";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  const row = await getTempFileByCode(code);
  if (!row) {
    return NextResponse.json({ error: "文件不存在或已过期" }, { status: 404 });
  }
  return NextResponse.json(publicMeta(row));
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const deleteToken = String(body?.deleteToken || request.nextUrl.searchParams.get("deleteToken") || "");
  if (!deleteToken) {
    return NextResponse.json({ error: "缺少删除令牌" }, { status: 400 });
  }
  const ok = await deleteTempFile(code, deleteToken);
  if (!ok) {
    return NextResponse.json({ error: "删除失败：令牌无效或文件不存在" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
