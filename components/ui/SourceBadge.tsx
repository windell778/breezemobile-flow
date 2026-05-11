type SourceBadgeProps = {
  source: "Meta Ads" | "Google Ads" | "Direct" | "Organic";
};

const sourceStyle: Record<SourceBadgeProps["source"], string> = {
  "Meta Ads": "bg-blue-500/20 text-blue-100 border-blue-400/30",
  "Google Ads": "bg-violet-500/20 text-violet-100 border-violet-400/30",
  Direct: "bg-zinc-500/20 text-zinc-100 border-zinc-400/30",
  Organic: "bg-teal-500/20 text-teal-100 border-teal-400/30",
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${sourceStyle[source]}`}>
      {source}
    </span>
  );
}
