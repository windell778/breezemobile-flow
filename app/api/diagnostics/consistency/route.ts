// Drift validation endpoint.
// Compares dashboard metrics (golden cache, 900s) against live session data (60s)
// to detect unexpected divergence between the two data layers.
//
// Small differences are expected — the two caches have different TTLs and
// use different query strategies (HogQL aggregate vs event-to-session grouping).
// Large differences (>25%) indicate a potential bug or data gap worth investigating.
//
// Usage:
//   curl /api/diagnostics/consistency \
//     -H "Authorization: Bearer <REVALIDATE_SECRET>"

import { NextResponse } from "next/server";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";

const WARN_THRESHOLD = 0.10;  // 10% diff → warn
const DRIFT_THRESHOLD = 0.25; // 25% diff → drift

function diffPct(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  const base = Math.max(a, b);
  return Math.abs(a - b) / base;
}

function status(pct: number): "ok" | "warn" | "drift" {
  if (pct > DRIFT_THRESHOLD) return "drift";
  if (pct > WARN_THRESHOLD) return "warn";
  return "ok";
}

export async function GET(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const adapter = getAdapter();
  const workspaceId = DEFAULT_WORKSPACE_ID;

  const [dashboard, sessions] = await Promise.all([
    adapter.getDashboardMetrics(workspaceId),
    adapter.listSessions(workspaceId),
  ]);

  const liveComputedAt = new Date().toISOString();
  const liveSessions = sessions.length;
  const liveVisitors = new Set(sessions.map((s) => s.visitor_id)).size;
  const liveWhatsappClicks = sessions.reduce(
    (sum, s) => sum + s.events.filter((e) => e.event_name === "whatsapp_click").length,
    0,
  );

  const checks = [
    {
      metric: "sessions",
      label: "Sesiones únicas",
      golden_source: "uniq(session_id) HogQL — caché 900s",
      live_source: "listSessions().length — caché 60s",
      golden: dashboard.sessions,
      live: liveSessions,
      diff: Math.abs(dashboard.sessions - liveSessions),
      diff_pct: Math.round(diffPct(dashboard.sessions, liveSessions) * 1000) / 10,
      status: status(diffPct(dashboard.sessions, liveSessions)),
    },
    {
      metric: "visitors",
      label: "Visitantes únicos",
      golden_source: "uniq(visitor_id) HogQL — caché 900s",
      live_source: "unique visitor_id from listSessions() — caché 60s",
      golden: dashboard.visitors,
      live: liveVisitors,
      diff: Math.abs(dashboard.visitors - liveVisitors),
      diff_pct: Math.round(diffPct(dashboard.visitors, liveVisitors) * 1000) / 10,
      status: status(diffPct(dashboard.visitors, liveVisitors)),
    },
    {
      metric: "whatsappClicks",
      label: "WhatsApp clicks",
      golden_source: "countIf(event='whatsapp_click') HogQL — caché 900s",
      live_source: "sum of whatsapp_click events in listSessions() — caché 60s",
      golden: dashboard.whatsappClicks,
      live: liveWhatsappClicks,
      diff: Math.abs(dashboard.whatsappClicks - liveWhatsappClicks),
      diff_pct: Math.round(diffPct(dashboard.whatsappClicks, liveWhatsappClicks) * 1000) / 10,
      status: status(diffPct(dashboard.whatsappClicks, liveWhatsappClicks)),
    },
  ] as const;

  const overallStatus = checks.some((c) => c.status === "drift")
    ? "drift"
    : checks.some((c) => c.status === "warn")
    ? "warn"
    : "ok";

  return NextResponse.json({
    overall: overallStatus,
    dashboard_cached_at: dashboard.cached_at,
    live_computed_at: liveComputedAt,
    workspace_id: workspaceId,
    checks,
    note: [
      "Diferencias menores son esperadas: golden cache (900s) vs live cache (60s).",
      "listSessions() aplica LIMIT 5000; el golden usa HogQL sin límite.",
      "diff_pct > 10% → warn. diff_pct > 25% → drift.",
    ],
  });
}
