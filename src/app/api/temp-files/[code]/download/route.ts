import { NextRequest, NextResponse } from "next/server";
import {
  bumpDownloadCount,
  getDownloadRedirectUrl,
  getTempFileByCode,
  readTempFileBuffer,
} from "@/lib/temp-files";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  const row = await getTempFileByCode(code);
  if (!row) {
    return NextResponse.json({ error: "文件不存在或已过期" }, { status: 404 });
  }

  try {
    const signed = await getDownloadRedirectUrl(row.storageKey, row.originalName);
    if (signed) {
      await bumpDownloadCount(row.id);
      return NextResponse.redirect(signed, 302);
    }

    const buf = await readTempFileBuffer(row.storageKey);
    await bumpDownloadCount(row.id);
    const asciiName = row.originalName.replace(/[^\x20-\x7E]/g, "_");
    const disposition = `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(row.originalName)}`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": row.mimeType || "application/octet-stream",
        "Content-Length": String(buf.length),
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "读取文件失败" }, { status: 500 });
  }
}
