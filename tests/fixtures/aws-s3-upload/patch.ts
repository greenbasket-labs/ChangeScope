import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export async function uploadMedia(bucket: string, key: string, body: Uint8Array) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }));
}
