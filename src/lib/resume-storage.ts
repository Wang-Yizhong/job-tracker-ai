// src/lib/resume-storage.ts
import fs from "node:fs";
import path from "node:path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const USE_S3 = !!process.env.S3_BUCKET;

const s3 = USE_S3
  ? new S3Client({
      region: process.env.S3_REGION!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export async function getFileBufferByKey(fileKey: string): Promise<Buffer> {
  if (!USE_S3) {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, fileKey);
    return fs.promises.readFile(filePath);
  }
  const bucket = process.env.S3_BUCKET!;
  const keyPrefix = process.env.S3_KEY_PREFIX || "resumes/";
  const key = `${keyPrefix}${fileKey}`;
  const out = await s3!.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks: Buffer[] = [];
  // @ts-ignore
  for await (const chunk of out.Body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}
