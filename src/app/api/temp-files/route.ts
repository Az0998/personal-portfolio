import { NextRequest, NextResponse } from "next/server";
import {
  TEMP_DEFAULT_TTL_HOURS,
  TEMP_MAX_BYTES,
  TEMP_TTL_OPTIONS_HOURS,
  formatBytes,
  publicMeta,
  saveTempFile,
} from "@/lib/temp-files";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    maxBytes: TEMP_MAX_BYTES,
    maxLabel: formatBytes(TEMP_MAX_BYTES),
    ttlHours: [...TEMP_TTL_OPTIONS_HOURS],
    defaultTtlHours: TEMP_DEFAULT_TTL_HOURS,
    note: "文件保存在站点服务器本地磁盘，过期自动删除；Render 免费实例重部署后磁盘会清空。",
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const ttlRaw = Number(formData.get("ttlHours") ?? TEMP_DEFAULT_TTL_HOURS);
    const ttlHours = Number.isFinite(ttlRaw) ? ttlRaw : TEMP_DEFAULT_TTL_HOURS;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const row = await saveTempFile({ file, ttlHours });
    const origin = request.nextUrl.origin;

    return NextResponse.json({
      ...publicMeta(row),
      deleteToken: row.deleteToken,
      shareUrl: `${origin}/temp-files/${row.code}`,
      downloadUrl: `${origin}/api/temp-files/${row.code}/download`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
