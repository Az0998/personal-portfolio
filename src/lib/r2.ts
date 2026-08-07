import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl?: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL?.trim() || undefined,
  };
}

export function isR2Enabled() {
  return getR2Config() !== null;
}

let cachedClient: S3Client | null = null;

export function getR2Client() {
  const cfg = getR2Config();
  if (!cfg) throw new Error("未配置 Cloudflare R2 环境变量");
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      forcePathStyle: false,
    });
  }
  return { client: cachedClient, cfg };
}

export async function r2PutObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const { client, cfg } = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    })
  );
}

export async function r2DeleteObject(key: string) {
  const { client, cfg } = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
    })
  );
}

export async function r2HeadObject(key: string) {
  const { client, cfg } = getR2Client();
  return client.send(
    new HeadObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
    })
  );
}

export async function r2GetObjectBuffer(key: string) {
  const { client, cfg } = getR2Client();
  const out = await client.send(
    new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
    })
  );
  const bytes = await out.Body?.transformToByteArray();
  if (!bytes) throw new Error("R2 对象为空");
  return Buffer.from(bytes);
}

export async function r2PresignPut(key: string, contentType: string, expiresIn = 600) {
  const { client, cfg } = getR2Client();
  const cmd = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn });
}

export async function r2PresignGet(key: string, filename: string, expiresIn = 600) {
  const { client, cfg } = getR2Client();
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  const cmd = new GetObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  });
  return getSignedUrl(client, cmd, { expiresIn });
}
