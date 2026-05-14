import { NextResponse } from "next/server";

export async function GET() {
  const dataSource = process.env.DATA_SOURCE ?? "mock";
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (dataSource !== "posthog" || !projectId || !apiKey) {
    return NextResponse.json({
      status: "skip",
      message: "DATA_SOURCE is not posthog or credentials are missing",
      dataSource,
      hasProjectId: !!projectId,
      hasApiKey: !!apiKey,
    });
  }

  try {
    const { PostHogClient } = await import("@/lib/posthog/client");
    const client = new PostHogClient({ projectId, apiKey, host });

    const countResult = await client.post<{ results: unknown[][]; columns: string[] }>("/query/", {
      query: {
        kind: "HogQLQuery",
        query: `
          SELECT event AS event_name, count(*) AS cnt
          FROM events
          WHERE event IN ('page_view_custom', 'service_click', 'whatsapp_click')
          GROUP BY event
          ORDER BY cnt DESC
          LIMIT 10
        `,
      },
    });

    const eventCounts = Object.fromEntries(
      countResult.results.map((row) => [String(row[0]), Number(row[1])]),
    );

    const sampleResult = await client.post<{ results: unknown[][]; columns: string[] }>("/query/", {
      query: {
        kind: "HogQLQuery",
        query: `
          SELECT
            event,
            toString(properties.session_id) AS session_id,
            toString(properties.visitor_id) AS visitor_id,
            toString(properties.source) AS source,
            toString(properties.service) AS service,
            toString(properties.utm_campaign) AS utm_campaign,
            toString(timestamp) AS ts
          FROM events
          WHERE event IN ('page_view_custom', 'service_click', 'whatsapp_click')
          ORDER BY timestamp DESC
          LIMIT 5
        `,
      },
    });

    return NextResponse.json({
      status: "ok",
      dataSource,
      host,
      projectId,
      eventCounts,
      recentEventsSample: {
        columns: sampleResult.columns,
        rows: sampleResult.results,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
