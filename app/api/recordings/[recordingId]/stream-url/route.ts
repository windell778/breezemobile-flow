// GET /api/recordings/[recordingId]/stream-url
//
// Returns a short-lived signed URL (15 min TTL) that the ReplayPlayer
// component uses to fetch rrweb events from R2.
//
// This endpoint keeps R2 credentials server-side. The client only
// receives a time-limited URL it cannot reuse or share indefinitely.

import { type NextRequest, NextResponse } from "next/server";
import { getRecordingStreamUrl } from "@/lib/storage/signed-urls";
import { isStorageConfigured } from "@/lib/storage/client";

type Params = { params: Promise<{ recordingId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { recordingId } = await params;

  if (!recordingId) {
    return NextResponse.json({ error: "Missing recordingId" }, { status: 400 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Storage not configured", url: null },
      { status: 503 },
    );
  }

  // For multi-tenant: read workspace_id from session/auth.
  // In V0 (single tenant) we use the env var default.
  const workspaceId = process.env.WORKSPACE_ID ?? "breezemobile";

  const url = await getRecordingStreamUrl(workspaceId, recordingId);

  if (!url) {
    return NextResponse.json(
      { error: "Recording not found in storage", url: null },
      { status: 404 },
    );
  }

  return NextResponse.json({ url, ttl_seconds: 900 });
}
