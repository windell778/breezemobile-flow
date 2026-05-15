/**
 * Canonical metric formulas for BreezeMobile Flow.
 *
 * All rate computations across the platform must go through these functions.
 * Never compute rates inline — use these instead.
 *
 * Full metric definitions (formula, source, freshness, warnings):
 * → docs/metrics/definitions.md
 *
 * Rules:
 * - whatsapp_click is a high-intent signal, NOT a confirmed lead or sale.
 * - replayRate returns integer percentage (0–100). waRate can exceed 100 because
 *   whatsappClicks is a raw event count — one session can fire multiple clicks.
 * - Division-by-zero always returns 0, never NaN or Infinity.
 */

/** Percentage of sessions that have a PostHog session recording available. */
export function replayRate(sessionsWithRecording: number, totalSessions: number): number {
  if (totalSessions === 0) return 0;
  return Math.round((sessionsWithRecording / totalSessions) * 100);
}

/**
 * Percentage of sessions with at least one whatsapp_click event.
 * Label in UI: "Tasa WA" or "Señales de intención".
 * Never label this as "conversion rate" or "lead rate".
 */
export function waRate(whatsappClicks: number, totalSessions: number): number {
  if (totalSessions === 0) return 0;
  return Math.round((whatsappClicks / totalSessions) * 100);
}

/**
 * Validates that dashboard metrics are internally consistent.
 * Returns an array of human-readable warnings. Empty array means healthy.
 *
 * These are sanity checks for data integrity, not business logic.
 * A warning does not mean the data is wrong — it means something looks unusual
 * and is worth investigating (e.g. PostHog tracking gap, stale data, bug).
 *
 * NOTE: whatsappClicks > sessions is NOT validated here. whatsappClicks is a
 * raw event count — a single session can have multiple whatsapp_click events.
 * Validating whatsappClicks against sessions would produce false positives.
 * To validate unique sessions-with-whatsapp, a separate sessionsWithWhatsapp
 * metric would be needed.
 */
export function validateMetrics(metrics: {
  sessions: number;
  serviceClicks: number;
  replayRate: number;
}): string[] {
  const warnings: string[] = [];

  if (metrics.serviceClicks > metrics.sessions * 10) {
    warnings.push(
      `service_clicks (${metrics.serviceClicks}) parece muy alto para ${metrics.sessions} sesiones. ` +
      `Verificar que no haya eventos duplicados.`
    );
  }

  if (metrics.replayRate > 100) {
    warnings.push(`replayRate (${metrics.replayRate}%) supera 100%. Error de cálculo.`);
  }

  return warnings;
}

/**
 * Returns a human-readable "hace X min/h" string from an ISO timestamp.
 * Used to display golden cache freshness in the dashboard.
 */
export function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "hace menos de 1 min";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `hace ${diffH} h`;
}
