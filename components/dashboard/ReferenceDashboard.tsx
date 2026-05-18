import Link from "next/link";
import type {
  CampaignSummary,
  DashboardMetrics,
  ServicePageSummary,
  Session,
} from "@/lib/data/types";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatDateTime, humanValue } from "@/lib/labels";
import { waRate } from "@/lib/metrics";

type ReferenceDashboardProps = {
  metrics: DashboardMetrics;
  campaigns: CampaignSummary[];
  services: ServicePageSummary[];
  sessions: Session[];
};

const rankStyles = [
  {
    tone: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: "bg-[#eef5ff] text-blue-600",
  },
  {
    tone: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: "bg-[#eafaf0] text-emerald-600",
  },
  {
    tone: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-100",
    icon: "bg-[#fff3e4] text-orange-500",
  },
  {
    tone: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-100",
    icon: "bg-[#f2efff] text-violet-600",
  },
  {
    tone: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-100",
    icon: "bg-[#e9fbfa] text-teal-600",
  },
  {
    tone: "text-pink-700",
    bg: "bg-pink-50",
    border: "border-pink-100",
    icon: "bg-[#fff0f5] text-pink-600",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function weightedWaRate(items: Array<{ whatsapp_clicks: number; sessions: number }>) {
  const totals = items.reduce(
    (acc, item) => ({
      whatsapp_clicks: acc.whatsapp_clicks + item.whatsapp_clicks,
      sessions: acc.sessions + item.sessions,
    }),
    { whatsapp_clicks: 0, sessions: 0 }
  );
  return waRate(totals.whatsapp_clicks, totals.sessions);
}

function servicePath(service: ServicePageSummary) {
  return service.path || `/servicios/${String(service.service).replaceAll("_", "-")}`;
}

function sessionHasWhatsApp(session: Session) {
  return session.events.some((event) => event.event_name === "whatsapp_click");
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13.5V7.25A1.75 1.75 0 0 1 5.75 5.5h7.5A1.75 1.75 0 0 1 15 7.25v9.5a1.75 1.75 0 0 1-1.75 1.75h-7.5A1.75 1.75 0 0 1 4 16.75v-1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 9 5-2.75v11.5L15 15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h3" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75h6.25L18 8.5v11.75H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3.75V9h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13h5M9.5 16h5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M12.04 2.5a9.45 9.45 0 0 0-8.02 14.43L3 21l4.18-1.1a9.44 9.44 0 0 0 4.85 1.34h.01A9.38 9.38 0 0 0 21.5 11.9a9.44 9.44 0 0 0-9.46-9.4Zm5.57 13.32c-.24.68-1.4 1.3-1.95 1.35-.5.05-1.12.08-1.8-.12-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.78-4.15-4.93-4.34-.14-.2-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.58-.36.77-.36h.56c.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.15.12.32.02.51-.1.2-.15.32-.29.49-.14.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.29.75 1.23 1.6 2 .98.87 1.8 1.14 2.1 1.27.29.15.46.12.63-.07.2-.22.73-.85.92-1.14.19-.29.39-.24.65-.15.27.1 1.7.8 1.99.95.29.14.48.22.56.34.07.12.07.7-.17 1.37Z" />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M7 7h10M8 17h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12a6 6 0 0 1 12 0M8.5 17a4.5 4.5 0 0 0 7 0" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17 9 12l3 3 7-8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h4v4" />
    </svg>
  );
}

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-[22px] border border-slate-200/80 bg-white/95 shadow-[0_18px_44px_rgba(15,23,42,0.075),inset_0_1px_0_rgba(255,255,255,0.9)] ${className}`}
    >
      {children}
    </section>
  );
}

function CustomerFlowCard({ metrics }: { metrics: DashboardMetrics }) {
  const pageToWhatsapp = waRate(metrics.whatsappClicks, metrics.sessions);
  const sourceDrop = metrics.sessions > 0 ? Math.max(0, 100 - waRate(metrics.serviceClicks, metrics.sessions)) : 0;

  return (
    <DashboardCard className="p-6">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-[21px] font-extrabold tracking-[-0.035em] text-slate-950">
          Flujo del cliente
          <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 text-[11px] font-bold text-slate-500">
            i
          </span>
        </h2>
        <p className="mt-1 text-[14px] font-medium text-slate-500">
          Seguimiento del recorrido desde campaña o fuente hasta WhatsApp
        </p>
      </div>

      <div className="flex items-center max-md:flex-col max-md:items-stretch max-md:gap-3">
        <FlowNode
          icon={<CameraIcon />}
          title="Campañas"
          label="Sesiones atribuidas"
          value={metrics.sessions}
          href="/campanas"
        />
        <FlowConnector value={sourceDrop} />
        <FlowNode
          highlighted
          icon={<PageIcon />}
          title="Página"
          label="Visitantes"
          value={metrics.visitors}
          href="/servicios"
        />
        <FlowConnector value={pageToWhatsapp} />
        <FlowNode
          green
          icon={<WhatsAppIcon />}
          title="WhatsApp"
          label="Clicks detectados"
          value={metrics.whatsappClicks}
          href="/eventos?event=whatsapp_click"
        />
      </div>

      <div className="mt-7 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[13px] font-medium text-slate-600">
          <div className="flex items-center gap-3">
            <span className="h-[3px] w-6 rounded-full bg-blue-600" />
            <span>Flujo activo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 border-t-2 border-dashed border-slate-300" />
            <span>Pérdida de usuarios</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[14px] font-medium text-slate-600">Tasa WA</span>
          <span className="text-[22px] font-extrabold tracking-[-0.04em] text-emerald-600">
            {pageToWhatsapp}%
          </span>
        </div>
      </div>
    </DashboardCard>
  );
}

function FlowNode({
  icon,
  title,
  label,
  value,
  href,
  highlighted = false,
  green = false,
}: {
  icon: React.ReactNode;
  title: string;
  label: string;
  value: number;
  href: string;
  highlighted?: boolean;
  green?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative z-10 flex h-[116px] min-w-0 flex-1 items-center gap-4 rounded-[19px] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md max-md:w-full max-md:flex-none ${
        highlighted
          ? "border-blue-600 shadow-[0_10px_28px_rgba(37,99,235,0.12)]"
          : green
            ? "border-emerald-300"
            : "border-slate-200"
      }`}
    >
      <span
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${
          green ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-600"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[16px] font-extrabold tracking-[-0.03em] text-slate-950">{title}</span>
        <span className="mt-0.5 block text-[13px] font-medium leading-5 text-slate-500">{label}</span>
        <span className="mt-0.5 block text-[24px] font-extrabold tracking-[-0.045em] text-slate-950">
          {formatNumber(value)}
        </span>
      </span>
    </Link>
  );
}

function FlowConnector({ value }: { value: number }) {
  return (
    <div className="relative h-[3px] w-[58px] shrink-0 bg-blue-600 max-md:hidden">
      <span className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-blue-600 bg-white">
        <span className="h-2.5 w-[3px] rounded-full bg-blue-600" />
      </span>
      <span className="absolute left-1/2 top-[28px] inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[12px] font-bold text-violet-700">
        ↓ {value}%
      </span>
    </div>
  );
}

function TopServicesCard({ services }: { services: ServicePageSummary[] }) {
  const visible = services.slice(0, 4);

  return (
    <DashboardCard className="p-5">
      <RankedHeader title="Servicios con más señales" subtitle="Tasa WA por servicio" average={weightedWaRate(visible)} compact />
      <div className="mt-4 overflow-hidden rounded-[16px] border border-slate-200 bg-white/70">
        {visible.map((service, index) => (
          <RankedRow
            key={service.path}
            rank={index + 1}
            icon={<ServiceIcon />}
            title={humanValue(service.service)}
            subtitle={servicePath(service)}
            href={`/sesiones?service=${service.service}`}
            value={waRate(service.whatsapp_clicks, service.sessions)}
            compact
          />
        ))}
      </div>
    </DashboardCard>
  );
}

function TopCampaignsCard({ campaigns }: { campaigns: CampaignSummary[] }) {
  const visible = campaigns.slice(0, 6);

  return (
    <DashboardCard className="p-5">
      <RankedHeader title="Campañas con más señales" subtitle="Tasa WA por campaña" average={weightedWaRate(visible)} compact />
      <div className="mt-4 overflow-hidden rounded-[16px] border border-slate-200 bg-white/70">
        {visible.map((campaign, index) => (
          <RankedRow
            key={`${campaign.source}-${campaign.name}-${campaign.medium}`}
            rank={index + 1}
            icon={<CameraIcon />}
            title={campaign.name}
            subtitle={`${campaign.source} / ${campaign.medium || "Sin medio"}`}
            href={`/sesiones?campaign=${encodeURIComponent(campaign.name)}`}
            value={waRate(campaign.whatsapp_clicks, campaign.sessions)}
            compact
          />
        ))}
      </div>
    </DashboardCard>
  );
}

function RankedHeader({
  title,
  subtitle,
  average,
  compact = false,
}: {
  title: string;
  subtitle: string;
  average: number;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className={`${compact ? "max-w-[230px] text-[20px]" : "text-[22px]"} font-extrabold tracking-[-0.04em] text-slate-950`}>{title}</h2>
        <p className="mt-1 text-[13px] font-medium text-slate-500">{subtitle}</p>
      </div>
      <div className="flex h-[52px] shrink-0 items-center gap-3 rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 text-emerald-700 max-sm:w-full">
        <TrendIcon />
        <span>
          <span className="block text-[11px] font-semibold leading-none text-slate-500">Promedio</span>
          <span className="mt-1 block text-[18px] font-extrabold leading-none">{average}%</span>
        </span>
      </div>
    </div>
  );
}

function RankedRow({
  rank,
  icon,
  title,
  subtitle,
  href,
  value,
  compact = false,
}: {
  rank: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  value: number;
  compact?: boolean;
}) {
  const style = rankStyles[(rank - 1) % rankStyles.length];

  return (
    <Link
      href={href}
      className={`grid ${compact ? "min-h-[50px] grid-cols-[40px_28px_minmax(0,1fr)_62px]" : "min-h-[62px] grid-cols-[48px_30px_minmax(0,1fr)_70px]"} items-center gap-3 border-b border-slate-100 px-3 last:border-b-0 hover:bg-slate-50`}
    >
      <span className={`grid ${compact ? "h-9 w-9" : "h-10 w-10"} place-items-center rounded-full ${style.icon}`}>{icon}</span>
      <span className={`grid h-6 w-6 place-items-center rounded-full border text-xs font-extrabold ${style.bg} ${style.border} ${style.tone}`}>
        {rank}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-extrabold tracking-[-0.03em] text-slate-950">{title}</span>
        <span className="mt-0.5 block truncate font-mono text-[11px] font-medium text-slate-500">{subtitle}</span>
      </span>
      <span className={`justify-self-end rounded-[10px] border px-2.5 py-2 text-[13px] font-extrabold ${style.bg} ${style.border} ${style.tone}`}>
        {value}%
      </span>
    </Link>
  );
}

function RecentActivityCard({ sessions }: { sessions: Session[] }) {
  const visible = sessions.slice(0, 7);

  return (
    <DashboardCard className="overflow-hidden p-6">
      <div>
        <h2 className="text-[24px] font-extrabold tracking-[-0.04em] text-slate-950">Actividad reciente</h2>
        <p className="mt-1 text-[14px] font-medium text-slate-500">Sesiones recientes</p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[18px] border border-slate-200 bg-white">
        {visible.map((session) => (
          <article
            key={session.session_id}
            className="relative grid min-h-[48px] grid-cols-[120px_minmax(0,1fr)_62px_104px] items-center gap-3 border-b border-slate-100 px-4 last:border-b-0 hover:bg-slate-50 max-md:grid-cols-[1fr_auto] max-md:py-3"
          >
            <Link
              href={`/visitantes/${session.visitor_id}?session=${session.session_id}`}
              className="absolute inset-0 z-10"
              aria-label={`Ver sesión ${session.session_id}`}
            />
            <div className="pointer-events-none max-md:col-span-2">
              <SourceBadge source={session.source} />
            </div>
            <div className="pointer-events-none min-w-0">
              <p className="truncate text-[13px] font-extrabold tracking-[-0.035em] text-slate-950">
                {humanValue(session.service)}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] font-medium text-slate-500">{session.page_path}</p>
            </div>
            <div className="pointer-events-none">
              {sessionHasWhatsApp(session) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-extrabold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  WA
                </span>
              ) : null}
            </div>
            <div className="relative z-20 justify-self-end">
              {session.recording?.status === "available" ? (
                <Link
                  href={`/grabaciones?session=${session.session_id}`}
                  className="inline-flex h-8 items-center rounded-[10px] border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  Grabación
                </Link>
              ) : (
                <span
                  title={formatDateTime(session.timestamp)}
                  className="inline-flex h-8 items-center rounded-[10px] border border-slate-100 bg-slate-50 px-3 text-[12px] font-semibold text-slate-400"
                >
                  Sin replay
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Link href="/sesiones" className="text-[13px] font-bold text-slate-500 hover:text-slate-900">
          Ver todas las sesiones →
        </Link>
      </div>
    </DashboardCard>
  );
}

export function ReferenceDashboard({
  metrics,
  campaigns,
  services,
  sessions,
}: ReferenceDashboardProps) {
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.48fr)]">
        <CustomerFlowCard metrics={metrics} />
        <TopServicesCard services={services} />
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
        <TopCampaignsCard campaigns={campaigns} />
        <RecentActivityCard sessions={sessions} />
      </div>
    </div>
  );
}
