type SourceBadgeProps = {
  source: "Meta Ads" | "Google Ads" | "Direct" | "Organic";
};

const sourceStyle: Record<SourceBadgeProps["source"], string> = {
  "Meta Ads": "bg-blue-50 text-blue-700 border-blue-200",
  "Google Ads": "bg-amber-50 text-amber-700 border-amber-200",
  Direct: "bg-zinc-100 text-zinc-700 border-zinc-200",
  Organic: "bg-teal-50 text-teal-700 border-teal-200",
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${sourceStyle[source]}`}>
      {source}
    </span>
  );
}
