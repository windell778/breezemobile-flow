// Streams rrweb events for a PostHog recording — used by the in-app player.
// Server-side only: PostHog API key never reaches the client.

import { NextResponse } from "next/server";
import { downloadSnapshots } from "@/lib/posthog/recordings";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recordingId: string }> },
) {
  const { recordingId } = await params;

  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!projectId || !apiKey) {
    return NextResponse.json({ error: "PostHog not configured" }, { status: 500 });
  }

  if (!recordingId) {
    return NextResponse.json({ error: "recordingId required" }, { status: 400 });
  }

  try {
    const events = await downloadSnapshots(projectId, apiKey, host, recordingId);
    return NextResponse.json({ events });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
