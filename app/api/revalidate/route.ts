// Internal endpoint to manually invalidate the golden cache layer.
// Used from CI/CD after deploys or when PostHog data changes significantly.
//
// Usage:
//   curl -X POST /api/revalidate \
//     -H "Authorization: Bearer <REVALIDATE_SECRET>"

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "REVALIDATE_SECRET not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("golden", "max");

  return NextResponse.json({ revalidated: true, tag: "golden", timestamp: new Date().toISOString() });
}
