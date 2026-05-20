type SourceBadgeProps = {
  source: "Meta Ads" | "Google Ads" | "Direct" | "Organic";
};

const sourceStyle: Record<SourceBadgeProps["source"], string> = {
  "Meta Ads": "bg-[rgba(0,122,255,0.09)] text-[var(--apple-blue)] border-[rgba(0,122,255,0.14)] before:bg-[var(--apple-blue)]",
  "Google Ads": "bg-[rgba(234,88,12,0.09)] text-orange-700 border-[rgba(234,88,12,0.14)] before:bg-orange-500",
  Direct: "bg-[rgba(255,255,255,0.62)] text-[var(--apple-secondary-label)] border-[rgba(60,60,67,0.1)] before:bg-[var(--apple-tertiary-label)]",
  Organic: "bg-[rgba(34,197,94,0.09)] text-emerald-700 border-[rgba(34,197,94,0.14)] before:bg-emerald-500",
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none before:h-1.5 before:w-1.5 before:rounded-full ${sourceStyle[source]}`}>
      {source}
    </span>
  );
}
