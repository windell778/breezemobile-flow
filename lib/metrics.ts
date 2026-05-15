/**
 * Canonical metric formulas for BreezeMobile Flow.
 *
 * All rate computations across the platform must go through these functions.
 * Never compute rates inline — use these instead.
 *
 * Rules:
 * - whatsapp_click is a high-intent signal, NOT a confirmed lead or sale.
 * - All rates return integer percentages (0–100), never raw fractions.
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
