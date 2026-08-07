/**
 * 简化 POST 分支逻辑：R2 优先直传 init；否则 FormData 本地。
 */
import { NextRequest, NextResponse } from "next/server";
import {
  TEMP_DEFAULT_TTL_HOURS,
  TEMP_MAX_BYTES,
  TEMP_TTL_OPTIONS_HOURS,
  formatBytes,
  getStorageBackend,
  initDirectUpload,
  publicMeta,
  saveTempFile,
} from "@/lib/temp-files";

export const runtime = "nodejs";

function resultPayload(
  origin: string,
  row: {
    code: string;
    deleteToken: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    expiresAt: Date;
    downloadCount: number;
    createdAt: Date;
  },
  extra: Record<string, unknown> = {}
) {
  return {
    ...publicMeta(row),
    deleteToken: row.deleteToken,
    shareUrl: `${origin}/temp-files/${row.code}`,
    downloadUrl: `${origin}/api/temp-files/${row.code}/download`,
    ...extra,
  };
}

export async function GET() {
  const backend = getStorageBackend();
  return NextResponse.json({
    maxBytes: TEMP_MAX_BYTES,
    maxLabel: formatBytes(TEMP_MAX_BYTES),
    ttlHours: [...TEMP_TTL_OPTIONS_HOURS],
    defaultTtlHours: TEMP_DEFAULT_TTL_HOURS,
    storageBackend: backend,
    directUpload: backend === "r2",
    note:
      backend === "r2"
        ? "已启用 Cloudflare R2：浏览器预签名直传对象存储，过期后自动删除。"
        : "未配置 R2，当前回退到本机磁盘。生产环境请在 Render 填入 R2_* 环境变量。",
  });
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const contentType = request.headers.get("content-type") || "";
    const backend = getStorageBackend();

    // 浏览器直传 R2：JSON 元数据 → 预签名 URL
    if (backend === "r2" && contentType.includes("application/json")) {
      const body = await request.json();
      const ttlHours = Number(body.ttlHours ?? TEMP_DEFAULT_TTL_HOURS);
      const { row, uploadUrl, contentType: putType } = await initDirectUpload({
        name: String(body.name || ""),
        size: Number(body.size || 0),
        mimeType: body.mimeType,
        ttlHours: Number.isFinite(ttlHours) ? ttlHours : TEMP_DEFAULT_TTL_HOURS,
      });
      return NextResponse.json(
        resultPayload(origin, row, {
          uploadUrl,
          uploadHeaders: { "Content-Type": putType },
          mode: "direct",
        })
      );
    }

    // FormData：有 R2 则服务端 PutObject；无 R2 则写本地
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const ttlRaw = Number(formData.get("ttlHours") ?? TEMP_DEFAULT_TTL_HOURS);
    const ttlHours = Number.isFinite(ttlRaw) ? ttlRaw : TEMP_DEFAULT_TTL_HOURS;
    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }
    const row = await saveTempFile({ file, ttlHours });
    return NextResponse.json(
      resultPayload(origin, row, { mode: backend === "r2" ? "proxy" : "local" })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
