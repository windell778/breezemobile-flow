export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { ReferenceDashboard } from "@/components/dashboard/ReferenceDashboard";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";

export default async function Home() {
  const adapter = getAdapter();
  const workspaceId = DEFAULT_WORKSPACE_ID;

  const [metrics, campaigns, services, recentSessions] = await Promise.all([
    adapter.getDashboardMetrics(workspaceId),
    adapter.getCampaignSummaries(workspaceId),
    adapter.getServiceSummaries(workspaceId),
    adapter.listSessions(workspaceId, { limit: 8 }),
  ]);

  return (
    <AppShell
      title="Dashboard"
      description="Vista principal de comportamiento, campañas, servicios y actividad reciente."
      showPageHeader={false}
    >
      <ReferenceDashboard
        metrics={metrics}
        campaigns={campaigns}
        services={services}
        sessions={recentSessions}
      />
    </AppShell>
  );
}
