import { randomBytes, createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import {
  isR2Enabled,
  r2DeleteObject,
  r2GetObjectBuffer,
  r2HeadObject,
  r2PresignGet,
  r2PresignPut,
  r2PutObject,
} from "@/lib/r2";

export const TEMP_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
export const TEMP_TTL_OPTIONS_HOURS = [1, 6, 24, 72, 168] as const;
export const TEMP_DEFAULT_TTL_HOURS = 24;

const STORAGE_ROOT = path.join(process.cwd(), "data", "temp-files");
const KEY_PREFIX = "temp/";

function makeCode(len = 8) {
  return randomBytes(len).toString("base64url").slice(0, len);
}

function makeDeleteToken() {
  return randomBytes(18).toString("base64url");
}

function safeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").slice(0, 180) || "file";
}

export function getStorageBackend(): "r2" | "local" {
  return isR2Enabled() ? "r2" : "local";
}

export async function ensureTempDir() {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function buildStorageKey(code: string, originalName: string) {
  const ext = path.extname(originalName).slice(0, 16);
  const hash = createHash("sha256").update(`${code}-${Date.now()}`).digest("hex").slice(0, 16);
  return `${KEY_PREFIX}${code}_${hash}${ext}`;
}

async function removeStoredFile(storageKey: string) {
  if (isR2Enabled()) {
    await r2DeleteObject(storageKey);
    return;
  }
  const full = path.join(STORAGE_ROOT, path.basename(storageKey));
  await fs.unlink(full).catch(() => undefined);
}

export async function purgeExpiredTempFiles() {
  const now = new Date();
  const expired = await prisma.tempFile.findMany({
    where: { expiresAt: { lte: now } },
  });
  for (const row of expired) {
    await removeStoredFile(row.storageKey).catch(() => undefined);
    await prisma.tempFile.delete({ where: { id: row.id } }).catch(() => undefined);
  }
  return expired.length;
}

function assertTtl(ttlHours: number) {
  if (!TEMP_TTL_OPTIONS_HOURS.includes(ttlHours as (typeof TEMP_TTL_OPTIONS_HOURS)[number])) {
    throw new Error("无效的有效期");
  }
}

/** R2 直传：创建元数据 + 预签名 PUT URL（浏览器直写 R2） */
export async function initDirectUpload(input: {
  name: string;
  size: number;
  mimeType?: string;
  ttlHours: number;
}) {
  if (!isR2Enabled()) {
    throw new Error("未配置 R2，无法直传。请设置 R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET");
  }
  assertTtl(input.ttlHours);
  if (!input.name || input.size <= 0) throw new Error("无效的文件信息");
  if (input.size > TEMP_MAX_BYTES) {
    throw new Error(`文件过大，上限 ${formatBytes(TEMP_MAX_BYTES)}`);
  }

  await purgeExpiredTempFiles();

  const code = makeCode(8);
  const deleteToken = makeDeleteToken();
  const originalName = safeFilename(input.name);
  const mimeType = input.mimeType || "application/octet-stream";
  const storageKey = buildStorageKey(code, originalName);
  const expiresAt = new Date(Date.now() + input.ttlHours * 60 * 60 * 1000);

  const row = await prisma.tempFile.create({
    data: {
      code,
      deleteToken,
      originalName,
      mimeType,
      sizeBytes: input.size,
      storageKey,
      expiresAt,
    },
  });

  const uploadUrl = await r2PresignPut(storageKey, mimeType, 600);
  return { row, uploadUrl, contentType: mimeType };
}

/** 确认浏览器已直传到 R2 */
export async function confirmDirectUpload(code: string) {
  const row = await prisma.tempFile.findUnique({ where: { code } });
  if (!row) throw new Error("记录不存在");
  if (row.expiresAt.getTime() <= Date.now()) throw new Error("已过期");

  const head = await r2HeadObject(row.storageKey);
  const size = Number(head.ContentLength ?? 0);
  if (size <= 0) throw new Error("R2 上尚未找到文件，请重新上传");
  if (size !== row.sizeBytes) {
    await prisma.tempFile.update({
      where: { id: row.id },
      data: { sizeBytes: size },
    });
  }
  return prisma.tempFile.findUniqueOrThrow({ where: { id: row.id } });
}

/** 服务端代传：有 R2 则写 R2，否则写本地（开发回退） */
export async function saveTempFile(input: { file: File; ttlHours: number }) {
  const { file, ttlHours } = input;
  assertTtl(ttlHours);
  if (!file || file.size <= 0) throw new Error("未选择文件");
  if (file.size > TEMP_MAX_BYTES) {
    throw new Error(`文件过大，上限 ${formatBytes(TEMP_MAX_BYTES)}`);
  }

  await purgeExpiredTempFiles();

  const code = makeCode(8);
  const deleteToken = makeDeleteToken();
  const originalName = safeFilename(file.name);
  const mimeType = file.type || "application/octet-stream";
  const storageKey = buildStorageKey(code, originalName);
  const buf = Buffer.from(await file.arrayBuffer());

  if (isR2Enabled()) {
    await r2PutObject({ key: storageKey, body: buf, contentType: mimeType });
  } else {
    await ensureTempDir();
    const full = path.join(STORAGE_ROOT, path.basename(storageKey));
    await fs.writeFile(full, buf);
  }

  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  return prisma.tempFile.create({
    data: {
      code,
      deleteToken,
      originalName,
      mimeType,
      sizeBytes: buf.length,
      storageKey,
      expiresAt,
    },
  });
}

export async function getTempFileByCode(code: string) {
  await purgeExpiredTempFiles();
  const row = await prisma.tempFile.findUnique({ where: { code } });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await removeStoredFile(row.storageKey).catch(() => undefined);
    await prisma.tempFile.delete({ where: { id: row.id } }).catch(() => undefined);
    return null;
  }
  return row;
}

export async function readTempFileBuffer(storageKey: string) {
  if (isR2Enabled()) {
    return r2GetObjectBuffer(storageKey);
  }
  const full = path.join(STORAGE_ROOT, path.basename(storageKey));
  return fs.readFile(full);
}

/** R2：返回短期签名下载 URL；本地：返回 null（走 API 流） */
export async function getDownloadRedirectUrl(storageKey: string, filename: string) {
  if (!isR2Enabled()) return null;
  return r2PresignGet(storageKey, filename, 300);
}

export async function bumpDownloadCount(id: string) {
  await prisma.tempFile.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });
}

export async function deleteTempFile(code: string, deleteToken: string) {
  const row = await prisma.tempFile.findUnique({ where: { code } });
  if (!row) return false;
  if (row.deleteToken !== deleteToken) return false;
  await removeStoredFile(row.storageKey).catch(() => undefined);
  await prisma.tempFile.delete({ where: { id: row.id } });
  return true;
}

export function publicMeta(row: {
  code: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: Date;
  downloadCount: number;
  createdAt: Date;
}) {
  return {
    code: row.code,
    name: row.originalName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    sizeLabel: formatBytes(row.sizeBytes),
    expiresAt: row.expiresAt.toISOString(),
    downloadCount: row.downloadCount,
    createdAt: row.createdAt.toISOString(),
  };
}
