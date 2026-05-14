// Upload and download rrweb recording events from R2 object storage.
// Server-side only.

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getBucketName, getStorageClient, isStorageConfigured } from "@/lib/storage/client";

// Storage key format: "{workspaceId}/recordings/{recordingId}.json"
export function buildStorageKey(workspaceId: string, recordingId: string): string {
  return `${workspaceId}/recordings/${recordingId}.json`;
}

// Returns the storage key if the recording file exists, null otherwise.
// Used by the normalizer to determine recording status.
export async function getStorageKey(
  workspaceId: string,
  recordingId: string,
): Promise<string | null> {
  if (!isStorageConfigured()) return null;

  const key = buildStorageKey(workspaceId, recordingId);

  try {
    const client = getStorageClient();
    const bucket = getBucketName();
    await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return key;
  } catch {
    return null;
  }
}

// Uploads rrweb events JSON to R2 after downloading from PostHog.
// Called by the webhook handler when a session ends.
export async function uploadRecording(
  workspaceId: string,
  recordingId: string,
  events: unknown[],
): Promise<string> {
  const client = getStorageClient();
  const bucket = getBucketName();
  const key = buildStorageKey(workspaceId, recordingId);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(events),
      ContentType: "application/json",
    }),
  );

  return key;
}

// Downloads rrweb events from R2 for playback.
// Returns parsed events ready for rrweb-player.
export async function downloadRecording(
  workspaceId: string,
  recordingId: string,
): Promise<unknown[] | null> {
  if (!isStorageConfigured()) return null;

  const client = getStorageClient();
  const bucket = getBucketName();
  const key = buildStorageKey(workspaceId, recordingId);

  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );

    if (!res.Body) return null;

    const text = await res.Body.transformToString();
    return JSON.parse(text) as unknown[];
  } catch {
    return null;
  }
}
