export type ExternalMediaStorage = {
  bucket: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export async function resolveMedia(storage: ExternalMediaStorage, objectKey: string) {
  const target = storage.endpoint ?? "https://" + storage.bucket + ".s3.amazonaws.com";
  return fetch(target + "/" + objectKey);
}
