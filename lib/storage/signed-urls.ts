// Generates short-lived signed URLs for accessing recordings in R2.
// The frontend uses these URLs to load rrweb events without exposing credentials.
// Server-side only — never call this in client components.

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildStorageKey } from "@/lib/storage/recordings";
import { getBucketName, getStorageClient, isStorageConfigured } from "@/lib/storage/client";

const URL_TTL_SECONDS = 900; // 15 minutes

export async function getRecordingStreamUrl(
  workspaceId: string,
  recordingId: string,
): Promise<string | null> {
  if (!isStorageConfigured()) return null;

  const client = getStorageClient();
  const bucket = getBucketName();
  const key = buildStorageKey(workspaceId, recordingId);

  try {
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: URL_TTL_SECONDS },
    );
    return url;
  } catch {
    return null;
  }
}
