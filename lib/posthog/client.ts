// Server-side HTTP client for the PostHog API.
// Never import this in client components — it uses private API keys.

export type PostHogClientConfig = {
  projectId: string;
  apiKey: string;
  host: string;
};

export class PostHogClient {
  constructor(private readonly config: PostHogClientConfig) {}

  private baseUrl() {
    return `${this.config.host}/api/projects/${this.config.projectId}`;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl()}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      headers: this.headers(),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(
        `PostHog API error: ${res.status} ${res.statusText} — ${path}`,
      );
    }

    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl()}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(
        `PostHog API error: ${res.status} ${res.statusText} — POST ${path}`,
      );
    }

    return res.json() as Promise<T>;
  }

  // Raw fetch for streaming endpoints (e.g. snapshots NDJSON).
  async getStream(path: string): Promise<Response> {
    const res = await fetch(`${this.baseUrl()}${path}`, {
      headers: this.headers(),
    });

    if (!res.ok) {
      throw new Error(
        `PostHog stream error: ${res.status} ${res.statusText} — ${path}`,
      );
    }

    return res;
  }
}

export function createPostHogClient(): PostHogClient {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!projectId || !apiKey) {
    throw new Error(
      "PostHog client requires POSTHOG_PROJECT_ID and POSTHOG_API_KEY env vars.",
    );
  }

  return new PostHogClient({ projectId, apiKey, host });
}
