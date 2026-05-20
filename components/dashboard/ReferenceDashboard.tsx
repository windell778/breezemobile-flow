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
    accent: "text-sky-700",
    soft: "bg-sky-50",
    ring: "ring-sky-100",
    dot: "bg-sky-500",
  },
  {
    accent: "text-emerald-700",
    soft: "bg-emerald-50",
    ring: "ring-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    accent: "text-amber-700",
    soft: "bg-amber-50",
    ring: "ring-amber-100",
    dot: "bg-amber-500",
  },
  {
    accent: "text-indigo-700",
    soft: "bg-indigo-50",
    ring: "ring-indigo-100",
    dot: "bg-indigo-500",
  },
  {
    accent: "text-teal-700",
    soft: "bg-teal-50",
    ring: "ring-teal-100",
    dot: "bg-teal-500",
  },
  {
    accent: "text-rose-700",
    soft: "bg-rose-50",
    ring: "ring-rose-100",
    dot: "bg-rose-500",
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

function CameraIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13.5V7.25A1.75 1.75 0 0 1 5.75 5.5h7.5A1.75 1.75 0 0 1 15 7.25v9.5a1.75 1.75 0 0 1-1.75 1.75h-7.5A1.75 1.75 0 0 1 4 16.75v-1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 9 5-2.75v11.5L15 15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h3" />
    </svg>
  );
}

function PageIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75h6.25L18 8.5v11.75H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3.75V9h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13h5M9.5 16h5" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.04 2.5a9.45 9.45 0 0 0-8.02 14.43L3 21l4.18-1.1a9.44 9.44 0 0 0 4.85 1.34h.01A9.38 9.38 0 0 0 21.5 11.9a9.44 9.44 0 0 0-9.46-9.4Zm5.57 13.32c-.24.68-1.4 1.3-1.95 1.35-.5.05-1.12.08-1.8-.12-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.78-4.15-4.93-4.34-.14-.2-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.58-.36.77-.36h.56c.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.15.12.32.02.51-.1.2-.15.32-.29.49-.14.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.29.75 1.23 1.6 2 .98.87 1.8 1.14 2.1 1.27.29.15.46.12.63-.07.2-.22.73-.85.92-1.14.19-.29.39-.24.65-.15.27.1 1.7.8 1.99.95.29.14.48.22.56.34.07.12.07.7-.17 1.37Z" />
    </svg>
  );
}

function ServiceIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M7 7h10M8 17h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12a6 6 0 0 1 12 0M8.5 17a4.5 4.5 0 0 0 7 0" />
    </svg>
  );
}

function TrendIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
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
      className={`min-w-0 rounded-[18px] border border-slate-200/75 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_52px_-36px_rgba(15,23,42,0.36)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.025em] text-slate-950 md:text-[20px]">
        {title}
      </h2>
      <p className="mt-1 text-[13px] leading-5 text-slate-500">{subtitle}</p>
    </div>
  );
}

function CustomerFlowCard({ metrics }: { metrics: DashboardMetrics }) {
  const pageToWhatsapp = waRate(metrics.whatsappClicks, metrics.sessions);
  const sourceDrop = metrics.sessions > 0 ? Math.max(0, 100 - waRate(metrics.serviceClicks, metrics.sessions)) : 0;

  return (
    <DashboardCard className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          title="Flujo del cliente"
          subtitle="Recorrido desde campaña o fuente hasta contacto por WhatsApp."
        />
        <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-500">
          Señal anónima
        </span>
      </div>

      <div className="mt-5 grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_58px_minmax(0,1fr)_58px_minmax(0,1fr)]">
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

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-3.5 max-md:flex-col max-md:items-start">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-medium text-slate-500">
          <div className="flex items-center gap-2.5">
            <span className="h-[3px] w-7 rounded-full bg-blue-600" />
            <span>Flujo activo</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-8 border-t border-dashed border-slate-300" />
            <span>Pérdida entre pasos</span>
          </div>
        </div>
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="text-[12px] font-medium text-slate-500">Tasa WA</span>
          <span className="font-mono text-[23px] font-semibold tracking-[-0.04em] text-emerald-600">
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
  const activeClasses = green
    ? "border-emerald-200 bg-emerald-50/45 text-emerald-700 shadow-[0_14px_34px_-28px_rgba(5,150,105,0.75)]"
    : highlighted
      ? "border-blue-300 bg-blue-50/35 text-blue-700 shadow-[0_14px_34px_-28px_rgba(37,99,235,0.75)]"
      : "border-slate-200 bg-white text-blue-700";

  return (
    <Link
      href={href}
      className={`group relative min-h-[94px] rounded-[16px] border p-4 transition-[border-color,box-shadow,transform,background-color] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_34px_-28px_rgba(15,23,42,0.55)] ${activeClasses}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-white/80 ring-1 ring-inset ring-slate-200/75">
          {icon}
        </span>
        <span className="font-mono text-[24px] font-semibold leading-none tracking-[-0.055em] text-slate-950">
          {formatNumber(value)}
        </span>
      </div>
      <div className="mt-3 min-w-0">
        <span className="block text-[14px] font-semibold tracking-[-0.02em] text-slate-950">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-5 text-slate-500">{label}</span>
      </div>
    </Link>
  );
}

function FlowConnector({ value }: { value: number }) {
  return (
    <div className="relative hidden h-[2px] bg-blue-500 md:block">
      <span className="absolute left-1/2 top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-blue-500 bg-white">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
      </span>
      <span className="absolute left-1/2 top-[18px] inline-flex -translate-x-1/2 items-center rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
        {value}%
      </span>
    </div>
  );
}

function TopServicesCard({ services }: { services: ServicePageSummary[] }) {
  const visible = services.slice(0, 4);

  return (
    <DashboardCard className="p-4">
      <RankedHeader title="Servicios con más señales" subtitle="Tasa WA por servicio" average={weightedWaRate(visible)} />
      <div className="bf-apple-table mt-3">
        {visible.map((service, index) => (
          <RankedRow
            key={service.path}
            rank={index + 1}
            icon={<ServiceIcon />}
            title={humanValue(service.service)}
            subtitle={servicePath(service)}
            href={`/sesiones?service=${service.service}`}
            value={waRate(service.whatsapp_clicks, service.sessions)}
          />
        ))}
      </div>
    </DashboardCard>
  );
}

function TopCampaignsCard({ campaigns }: { campaigns: CampaignSummary[] }) {
  const visible = campaigns.slice(0, 6);

  return (
    <DashboardCard className="p-4">
      <RankedHeader title="Campañas con más señales" subtitle="Tasa WA por campaña" average={weightedWaRate(visible)} />
      <div className="bf-apple-table mt-3">
        {visible.map((campaign, index) => (
          <RankedRow
            key={`${campaign.source}-${campaign.name}-${campaign.medium}`}
            rank={index + 1}
            icon={<CameraIcon />}
            title={campaign.name}
            subtitle={`${campaign.source} / ${campaign.medium || "Sin medio"}`}
            href={`/sesiones?campaign=${encodeURIComponent(campaign.name)}`}
            value={waRate(campaign.whatsapp_clicks, campaign.sessions)}
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
}: {
  title: string;
  subtitle: string;
  average: number;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="flex h-[46px] shrink-0 items-center gap-2 rounded-[13px] border border-emerald-100 bg-emerald-50 px-3 text-emerald-700">
        <TrendIcon />
        <span>
          <span className="block text-[10px] font-semibold leading-none text-emerald-800/60">Promedio</span>
          <span className="mt-1 block font-mono text-[17px] font-semibold leading-none">{average}%</span>
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
}: {
  rank: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  value: number;
}) {
  const style = rankStyles[(rank - 1) % rankStyles.length];

  return (
    <Link
      href={href}
      className="bf-apple-row group grid min-h-[52px] grid-cols-[32px_24px_minmax(0,1fr)_64px] items-center gap-3 border-b border-[var(--apple-separator)] px-3 last:border-b-0"
    >
      <span className={`grid h-8 w-8 place-items-center rounded-[10px] ${style.soft} ${style.accent}`}>
        {icon}
      </span>
      <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${style.soft} ${style.accent} ring-1 ${style.ring}`}>
        {rank}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold tracking-[-0.02em] text-slate-900">{title}</span>
        <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-500">{subtitle}</span>
      </span>
      <span className={`justify-self-end rounded-full px-2.5 py-1.5 text-right font-mono text-[13px] font-semibold ${style.soft} ${style.accent} ring-1 ${style.ring}`}>
        {value}%
      </span>
    </Link>
  );
}

function RecentActivityCard({ sessions }: { sessions: Session[] }) {
  const visible = sessions.slice(0, 7);

  return (
    <DashboardCard className="overflow-hidden p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle title="Actividad reciente" subtitle="Sesiones recientes con contexto de fuente, página y replay." />
        <Link
          href="/sesiones"
          className="bf-apple-secondary-action"
        >
          Ver todas
        </Link>
      </div>

      <div className="bf-apple-table mt-3">
        {visible.map((session) => (
          <article
            key={session.session_id}
            className="bf-apple-row relative grid min-h-[52px] grid-cols-[118px_minmax(0,1fr)_58px_102px] items-center gap-3 border-b border-[var(--apple-separator)] px-4 last:border-b-0 max-md:grid-cols-[1fr_auto] max-md:py-3"
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
              <p className="truncate text-[13px] font-semibold tracking-[-0.02em] text-slate-900">
                {humanValue(session.service)}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">{session.page_path}</p>
            </div>
            <div className="pointer-events-none">
              {sessionHasWhatsApp(session) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  WA
                </span>
              ) : null}
            </div>
            <div className="relative z-20 justify-self-end">
              {session.recording?.status === "available" ? (
                <Link
                  href={`/grabaciones?session=${session.session_id}`}
                  className="bf-apple-action h-8 px-3 text-[12px]"
                >
                  Grabación
                </Link>
              ) : (
                <span
                  title={formatDateTime(session.timestamp)}
                  className="bf-apple-secondary-action h-8 px-3 text-[12px] text-[var(--apple-tertiary-label)]"
                >
                  Sin replay
                </span>
              )}
            </div>
          </article>
        ))}
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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(350px,0.46fr)]">
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
