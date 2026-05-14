// Streams rrweb events for a PostHog recording — used by the in-app player.
// Server-side only: PostHog API key never reaches the client.
// Returns events for a single window_id so the player never sees two FullSnapshots
// with reused node IDs (which causes "setAttribute is not a function" in rrdom).

import { NextResponse } from "next/server";
import { downloadSnapshots } from "@/lib/posthog/recordings";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
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

  const { searchParams } = new URL(request.url);
  const requestedWindow = searchParams.get("windowId");

  try {
    const byWindow = await downloadSnapshots(projectId, apiKey, host, recordingId);
    const windowIds = Object.keys(byWindow);

    if (windowIds.length === 0) {
      return NextResponse.json({ events: [], windows: [], currentWindow: null });
    }

    // Pick the requested window, or the one with the most events as default.
    const currentWindow =
      requestedWindow && byWindow[requestedWindow]
        ? requestedWindow
        : windowIds.reduce((best, id) =>
            (byWindow[id]?.length ?? 0) > (byWindow[best]?.length ?? 0) ? id : best,
          );

    const events = byWindow[currentWindow] ?? [];
    return NextResponse.json({ events, windows: windowIds, currentWindow });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
