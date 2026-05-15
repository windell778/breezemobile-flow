/**
 * Workspace semantic configuration for BreezeMobile Flow.
 *
 * This layer separates tracking events (technical facts from PostHog) from
 * their semantic interpretation (what they mean for a specific business).
 *
 * In V0, BreezeMobile is the only workspace. All semantic rules are static
 * defaults here. When multi-tenant support is implemented (Phase 6+), each
 * workspace will have its own config loaded from the database at request time,
 * and callers will pass the workspace-specific config instead of this default.
 *
 * Do NOT hardcode event names as "high intent" or "anonymous conversion" in
 * business logic. Always go through this config so that different workspaces
 * can define different events as high-intent signals in the future.
 *
 * What must NOT change here without authorization:
 * - The event names themselves (tracking contract, see docs/tracking/tracking-contract.md)
 * - Adding revenue, ROAS, confirmed lead, or sales data
 * - Treating whatsapp_click as a confirmed lead or sale
 */

import type { EventName, IntentLevel } from "@/lib/data/types";

export type IntentRules = {
  /** Events that map to "Alta" intent level. */
  high: EventName[];
  /** Events that map to "Media" intent level. */
  medium: EventName[];
};

export type SemanticRules = {
  /**
   * Events considered a high-intent anonymous signal for this workspace.
   * Used for visitor state labels and summary screens.
   * ≠ confirmed lead, ≠ sale, ≠ revenue.
   */
  highIntentSignal: EventName[];
  /**
   * Events considered an anonymous conversion for this workspace.
   * In BreezeMobile V0 this is the same as highIntentSignal.
   * In other workspaces it could be form_submit, booking_click, etc.
   */
  anonymousConversion: EventName[];
};

export type WorkspaceConfig = {
  workspaceId: string;
  intentRules: IntentRules;
  semanticRules: SemanticRules;
};

/**
 * Default workspace config for BreezeMobile V0.
 *
 * In this workspace:
 * - whatsapp_click is the high-intent signal and anonymous conversion event.
 * - service_click is the medium-intent signal.
 * - page_view_custom is the baseline (low intent).
 *
 * These are business decisions for BreezeMobile, not universal truths.
 * A different workspace (e.g. SaaS) might use form_submit or demo_scheduled
 * as its high-intent signal instead.
 */
export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  workspaceId: "breezemobile",
  intentRules: {
    high: ["whatsapp_click"],
    medium: ["service_click"],
  },
  semanticRules: {
    highIntentSignal: ["whatsapp_click"],
    anonymousConversion: ["whatsapp_click"],
  },
};

/**
 * Returns the intent level for a session's events according to the workspace config.
 * Replaces any hardcoded comparisons to "whatsapp_click" or "service_click".
 */
export function inferIntentLevel(
  events: { event_name: EventName }[],
  config: WorkspaceConfig,
): IntentLevel {
  if (events.some((e) => config.intentRules.high.includes(e.event_name))) return "Alta";
  if (events.some((e) => config.intentRules.medium.includes(e.event_name))) return "Media";
  return "Baja";
}

/**
 * Returns the most significant event in a session according to the workspace config.
 * High-intent events take priority, then medium, then the baseline page_view_custom.
 */
export function mainEventForSession(
  events: { event_name: EventName }[],
  config: WorkspaceConfig,
): EventName {
  if (events.some((e) => config.intentRules.high.includes(e.event_name))) {
    return config.intentRules.high[0];
  }
  if (events.some((e) => config.intentRules.medium.includes(e.event_name))) {
    return config.intentRules.medium[0];
  }
  return "page_view_custom";
}
