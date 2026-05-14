// POST /api/webhooks/posthog/recording-ended
//
// PostHog calls this endpoint when a session recording ends.
// We download the rrweb snapshots and store them in R2 so the
// platform can serve replays without querying PostHog in real time.
//
// PostHog webhook configuration:
//   URL: https://your-domain/api/webhooks/posthog/recording-ended
//   Events: $recording (or the equivalent session recording event)
//
// Payload shape PostHog sends:
// {
//   "event": "$recording",
//   "properties": {
//     "distinct_id": "visitor_abc",
//     "session_id": "sess_123",        ← our internal session_id via posthog.register()
//     "visitor_id": "visitor_abc",     ← our internal visitor_id via posthog.register()
//     "$session_id": "posthog_session_id",
//     "$recording_duration": 120000,   ← milliseconds
//     "$start_timestamp": 1715601200000
//   },
//   "uuid": "posthog_recording_id",
//   "timestamp": "2026-05-09T09:18:10Z"
// }

import { type NextRequest, NextResponse } from "next/server";
import { downloadSnapshots } from "@/lib/posthog/recordings";
import { uploadRecording } from "@/lib/storage/recordings";
import { isStorageConfigured } from "@/lib/storage/client";

type PostHogWebhookPayload = {
  uuid?: string;
  event?: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  // Optional: verify PostHog webhook secret.
  const secret = process.env.POSTHOG_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("x-posthog-signature");
    if (signature !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: PostHogWebhookPayload;
  try {
    payload = (await req.json()) as PostHogWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const recordingId = payload.uuid || String(payload.properties?.["$session_id"] ?? "");
  const sessionId = String(payload.properties?.session_id ?? "");
  const visitorId = String(payload.properties?.visitor_id ?? payload.properties?.distinct_id ?? "");
  const workspaceId = process.env.WORKSPACE_ID ?? "breezemobile";

  if (!recordingId) {
    return NextResponse.json({ error: "Missing recording id" }, { status: 400 });
  }

  // If storage is not configured, acknowledge the webhook but skip download.
  if (!isStorageConfigured()) {
    console.warn(
      `[webhook] Storage not configured — skipping download for recording ${recordingId}`,
    );
    return NextResponse.json({ ok: true, skipped: "storage_not_configured" });
  }

  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!projectId || !apiKey) {
    return NextResponse.json(
      { error: "PostHog credentials not configured" },
      { status: 500 },
    );
  }

  try {
    console.log(
      `[webhook] Downloading recording ${recordingId} for session ${sessionId} visitor ${visitorId}`,
    );

    const events = await downloadSnapshots(projectId, apiKey, host, recordingId);

    if (!events.length) {
      console.warn(`[webhook] No events found for recording ${recordingId}`);
      return NextResponse.json({ ok: true, events: 0 });
    }

    const storageKey = await uploadRecording(workspaceId, recordingId, events);

    console.log(
      `[webhook] Stored ${events.length} events → ${storageKey}`,
    );

    return NextResponse.json({
      ok: true,
      recording_id: recordingId,
      session_id: sessionId,
      storage_key: storageKey,
      events: events.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[webhook] Failed to process recording ${recordingId}: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
