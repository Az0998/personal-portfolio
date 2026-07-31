import { randomBytes, createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";

export const TEMP_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
export const TEMP_TTL_OPTIONS_HOURS = [1, 6, 24, 72, 168] as const; // 最长 7 天
export const TEMP_DEFAULT_TTL_HOURS = 24;

const STORAGE_ROOT = path.join(process.cwd(), "data", "temp-files");

function makeCode(len = 8) {
  return randomBytes(len).toString("base64url").slice(0, len);
}

function makeDeleteToken() {
  return randomBytes(18).toString("base64url");
}

function safeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").slice(0, 180) || "file";
}

export async function ensureTempDir() {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
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

async function removeStoredFile(storageKey: string) {
  const full = path.join(STORAGE_ROOT, storageKey);
  await fs.unlink(full).catch(() => undefined);
}

export async function saveTempFile(input: {
  file: File;
  ttlHours: number;
}) {
  const { file, ttlHours } = input;
  if (!TEMP_TTL_OPTIONS_HOURS.includes(ttlHours as (typeof TEMP_TTL_OPTIONS_HOURS)[number])) {
    throw new Error("无效的有效期");
  }
  if (!file || file.size <= 0) throw new Error("未选择文件");
  if (file.size > TEMP_MAX_BYTES) {
    throw new Error(`文件过大，上限 ${formatBytes(TEMP_MAX_BYTES)}`);
  }

  await purgeExpiredTempFiles();
  await ensureTempDir();

  const code = makeCode(8);
  const deleteToken = makeDeleteToken();
  const originalName = safeFilename(file.name);
  const ext = path.extname(originalName).slice(0, 16);
  const hash = createHash("sha256").update(`${code}-${Date.now()}`).digest("hex").slice(0, 16);
  const storageKey = `${code}_${hash}${ext}`;
  const full = path.join(STORAGE_ROOT, storageKey);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(full, buf);

  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const row = await prisma.tempFile.create({
    data: {
      code,
      deleteToken,
      originalName,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buf.length,
      storageKey,
      expiresAt,
    },
  });

  return row;
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
  const full = path.join(STORAGE_ROOT, storageKey);
  return fs.readFile(full);
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
