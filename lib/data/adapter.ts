import { replayRate } from "@/lib/metrics";
import type {
  CampaignSummary,
  DashboardMetrics,
  EventFilters,
  RecordingRef,
  ServicePageSummary,
  Session,
  SessionFilters,
  TrackingEvent,
  TrackingHealth,
  Visitor,
} from "@/lib/data/types";

// ─── Interface ────────────────────────────────────────────────────────────────
// Every data source (mock, PostHog) must implement this contract.
// All methods are scoped to a workspace_id so the same adapter works
// for any client in the multi-tenant SaaS.

export interface DataAdapter {
  getVisitorProfile(workspaceId: string, visitorId: string): Promise<Visitor | null>;
  getVisitorSessions(workspaceId: string, visitorId: string): Promise<Session[]>;
  getSessionEvents(workspaceId: string, sessionId: string): Promise<TrackingEvent[]>;
  getSessionRecording(workspaceId: string, sessionId: string): Promise<RecordingRef | null>;
  getRecordingStreamUrl(workspaceId: string, recordingId: string): Promise<string | null>;
  listSessions(workspaceId: string, filters?: SessionFilters): Promise<Session[]>;
  listEvents(workspaceId: string, filters?: EventFilters): Promise<TrackingEvent[]>;
  getTrackingHealth(workspaceId: string): Promise<TrackingHealth[]>;
  getCampaignSummaries(workspaceId: string): Promise<CampaignSummary[]>;
  getServiceSummaries(workspaceId: string): Promise<ServicePageSummary[]>;
  getDashboardMetrics(workspaceId: string): Promise<DashboardMetrics>;
}

// ─── Mock adapter ─────────────────────────────────────────────────────────────
// Wraps lib/mock-data.ts and maps it to the canonical types.
// Used when DATA_SOURCE=mock (default for local dev without PostHog credentials).

import {
  allEvents as mockAllEvents,
  campaignSummaries as mockCampaignSummaries,
  servicePageSummaries as mockServiceSummaries,
  sessions as mockSessions,
  trackingHealth as mockHealth,
  visitors as mockVisitors,
} from "@/lib/mock-data";
import type { Session as MockSession, RecordingRef as MockRecordingRef } from "@/lib/mock-data";

function parseDuration(str: string): number | null {
  if (!str) return null;
  const [mm, ss] = str.split(":").map(Number);
  return mm * 60 + (ss || 0);
}

function mapMockRecording(r: MockRecordingRef, workspaceId: string): RecordingRef {
  return {
    workspace_id: workspaceId,
    recording_id: r.recording_id || "",
    session_id: r.session_id,
    visitor_id: r.visitor_id,
    provider: "posthog",
    status: r.available && r.recording_id ? "available" : "missing",
    duration: parseDuration(r.duration),
    started_at: r.started_at,
    storage_key: r.available && r.recording_id
      ? `${workspaceId}/recordings/${r.recording_id}.json`
      : null,
    captured_at: r.started_at,
  };
}

function mapMockSession(s: MockSession, workspaceId: string): Session {
  return {
    workspace_id: workspaceId,
    visitor_id: s.visitor_id,
    session_id: s.session_id,
    source: s.source,
    service: s.service,
    page_path: s.page_path,
    page_title: s.page_title,
    page_url: s.page_url,
    timestamp: s.timestamp,
    duration: parseDuration(s.duration),
    intent_level: s.intent_level,
    attribution: s.attribution,
    recording: mapMockRecording(s.recording, workspaceId),
    events: s.events.map((e) => ({ ...e, workspace_id: workspaceId })),
  };
}

class MockAdapter implements DataAdapter {
  async getVisitorProfile(workspaceId: string, visitorId: string) {
    const v = mockVisitors.find((v) => v.visitor_id === visitorId);
    if (!v) return null;
    const sessions = mockSessions.filter((s) => s.visitor_id === visitorId);
    return {
      workspace_id: workspaceId,
      visitor_id: v.visitor_id,
      first_seen: v.first_seen,
      last_seen: v.last_seen,
      session_count: sessions.length,
      sessions: v.sessions,
    };
  }

  async getVisitorSessions(workspaceId: string, visitorId: string) {
    return mockSessions
      .filter((s) => s.visitor_id === visitorId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((s) => mapMockSession(s, workspaceId));
  }

  async getSessionEvents(workspaceId: string, sessionId: string) {
    const s = mockSessions.find((s) => s.session_id === sessionId);
    if (!s) return [];
    return s.events.map((e) => ({ ...e, workspace_id: workspaceId }));
  }

  async getSessionRecording(workspaceId: string, sessionId: string) {
    const s = mockSessions.find((s) => s.session_id === sessionId);
    if (!s) return null;
    return mapMockRecording(s.recording, workspaceId);
  }

  // In mock mode there is no real storage — return null so the UI
  // shows the RecordingStatus component instead of trying to load a player.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRecordingStreamUrl(_workspaceId: string, _recordingId: string) {
    return null;
  }

  async listSessions(workspaceId: string, filters?: SessionFilters) {
    let result = mockSessions.map((s) => mapMockSession(s, workspaceId));

    if (filters?.eventName) {
      result = result.filter((s) =>
        s.events.some((e) => e.event_name === filters.eventName),
      );
    }
    if (filters?.source) {
      result = result.filter((s) => s.source === filters.source);
    }
    if (filters?.medium) {
      const m = filters.medium.toLowerCase();
      result = result.filter((s) => (s.attribution.utm_medium.toLowerCase() || "none") === m);
    }
    if (filters?.content) {
      if (filters.content === "__missing__") {
        result = result.filter((s) => !s.attribution.utm_content && !s.attribution.ad_id);
      } else {
        const c = filters.content.toLowerCase();
        result = result.filter(
          (s) =>
            s.attribution.utm_content.toLowerCase() === c ||
            s.attribution.ad_id.toLowerCase() === c,
        );
      }
    }
    if (filters?.service) {
      result = result.filter((s) => s.service === filters.service);
    }
    if (filters?.hasRecording !== undefined) {
      result = result.filter(
        (s) => (s.recording?.status === "available") === filters.hasRecording,
      );
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.session_id.toLowerCase().includes(q) ||
          s.visitor_id.toLowerCase().includes(q) ||
          s.service.toLowerCase().includes(q) ||
          s.attribution.utm_campaign.toLowerCase().includes(q),
      );
    }

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? result.length;
    return result.slice(offset, offset + limit);
  }

  async listEvents(workspaceId: string, filters?: EventFilters) {
    let result = mockAllEvents.map((e) => ({ ...e, workspace_id: workspaceId }));

    if (filters?.eventName) {
      result = result.filter((e) => e.event_name === filters.eventName);
    }
    if (filters?.visitorId) {
      result = result.filter((e) => e.visitor_id === filters.visitorId);
    }
    if (filters?.sessionId) {
      result = result.filter((e) => e.session_id === filters.sessionId);
    }
    if (filters?.service) {
      result = result.filter((e) => e.service === filters.service);
    }

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? result.length;
    return result.slice(offset, offset + limit);
  }

  async getTrackingHealth(workspaceId: string) {
    return mockHealth.map((h) => ({ ...h, workspace_id: workspaceId }));
  }

  async getCampaignSummaries(workspaceId: string) {
    return mockCampaignSummaries.map((c) => ({ ...c, workspace_id: workspaceId }));
  }

  async getServiceSummaries(workspaceId: string) {
    return mockServiceSummaries.map((s) => ({ ...s, workspace_id: workspaceId }));
  }

  async getDashboardMetrics(workspaceId: string) {
    const sessions = await this.listSessions(workspaceId);
    const events = await this.listEvents(workspaceId);
    const visitors = new Set(sessions.map((s) => s.visitor_id)).size;
    const whatsappClicks = events.filter((e) => e.event_name === "whatsapp_click").length;
    const serviceClicks = events.filter((e) => e.event_name === "service_click").length;
    const recordings = sessions.filter((s) => s.recording?.status === "available").length;
    const campaigns = await this.getCampaignSummaries(workspaceId);
    const services = await this.getServiceSummaries(workspaceId);

    return {
      sessions: sessions.length,
      visitors,
      events: events.length,
      whatsappClicks,
      serviceClicks,
      recordings,
      replayRate: replayRate(recordings, sessions.length),
      topCampaign: campaigns[0] ?? null,
      topService: services[0] ?? null,
      cached_at: new Date().toISOString(),
    };
  }
}

// ─── PostHog adapter stub ─────────────────────────────────────────────────────
// Full implementation lives in lib/posthog/*.ts.
// This class wires them together under the DataAdapter interface.
// Activated when DATA_SOURCE=posthog and POSTHOG_API_KEY is set.

class PostHogAdapter implements DataAdapter {
  constructor(
    private readonly projectId: string,
    private readonly apiKey: string,
    private readonly host: string,
  ) {}

  async getVisitorProfile(workspaceId: string, visitorId: string) {
    const { fetchVisitorProfile } = await import("@/lib/posthog/persons");
    return fetchVisitorProfile(this.projectId, this.apiKey, this.host, workspaceId, visitorId);
  }

  async getVisitorSessions(workspaceId: string, visitorId: string) {
    const { fetchVisitorSessions } = await import("@/lib/posthog/persons");
    return fetchVisitorSessions(this.projectId, this.apiKey, this.host, workspaceId, visitorId);
  }

  async getSessionEvents(workspaceId: string, sessionId: string) {
    const { fetchSessionEvents } = await import("@/lib/posthog/events");
    return fetchSessionEvents(this.projectId, this.apiKey, this.host, workspaceId, sessionId);
  }

  async getSessionRecording(workspaceId: string, sessionId: string) {
    const { fetchSessionRecording } = await import("@/lib/posthog/recordings");
    return fetchSessionRecording(this.projectId, this.apiKey, this.host, workspaceId, sessionId);
  }

  async getRecordingStreamUrl(workspaceId: string, recordingId: string) {
    const { getRecordingStreamUrl } = await import("@/lib/storage/signed-urls");
    return getRecordingStreamUrl(workspaceId, recordingId);
  }

  async listSessions(workspaceId: string, filters?: SessionFilters): Promise<Session[]> {
    const { listSessionsHogQL } = await import("@/lib/posthog/hogql");
    return listSessionsHogQL(this.projectId, this.apiKey, this.host, workspaceId, filters);
  }

  async listEvents(workspaceId: string, filters?: EventFilters): Promise<TrackingEvent[]> {
    const { listEventsHogQL } = await import("@/lib/posthog/hogql");
    return listEventsHogQL(this.projectId, this.apiKey, this.host, workspaceId, filters);
  }

  async getTrackingHealth(workspaceId: string): Promise<TrackingHealth[]> {
    const { getTrackingHealthHogQL } = await import("@/lib/posthog/hogql");
    return getTrackingHealthHogQL(this.projectId, this.apiKey, this.host, workspaceId);
  }

  async getCampaignSummaries(workspaceId: string): Promise<CampaignSummary[]> {
    const { getCampaignSummariesHogQL } = await import("@/lib/posthog/hogql");
    return getCampaignSummariesHogQL(this.projectId, this.apiKey, this.host, workspaceId);
  }

  async getServiceSummaries(workspaceId: string): Promise<ServicePageSummary[]> {
    const { getServiceSummariesHogQL } = await import("@/lib/posthog/hogql");
    return getServiceSummariesHogQL(this.projectId, this.apiKey, this.host, workspaceId);
  }

  async getDashboardMetrics(workspaceId: string): Promise<DashboardMetrics> {
    const { getDashboardMetricsHogQL } = await import("@/lib/posthog/hogql");
    return getDashboardMetricsHogQL(this.projectId, this.apiKey, this.host, workspaceId);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
// Returns the correct adapter based on DATA_SOURCE env var.
// Call this in server components and route handlers only.

let _adapter: DataAdapter | null = null;

export function getAdapter(): DataAdapter {
  if (_adapter) return _adapter;

  const source = process.env.DATA_SOURCE ?? "mock";

  if (source === "posthog") {
    const projectId = process.env.POSTHOG_PROJECT_ID;
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

    if (!projectId || !apiKey) {
      console.warn(
        "[adapter] DATA_SOURCE=posthog but POSTHOG_PROJECT_ID or POSTHOG_API_KEY is missing. Falling back to mock.",
      );
      _adapter = new MockAdapter();
    } else {
      _adapter = new PostHogAdapter(projectId, apiKey, host);
    }
  } else {
    _adapter = new MockAdapter();
  }

  return _adapter;
}

// Convenience: default workspace ID for single-tenant V0.
export const DEFAULT_WORKSPACE_ID = process.env.WORKSPACE_ID ?? "breezemobile";
