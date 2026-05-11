type SourceBadgeProps = {
  source: "Meta Ads" | "Google Ads" | "Direct" | "Organic";
};

const sourceStyle: Record<SourceBadgeProps["source"], string> = {
  "Meta Ads": "bg-blue-50 text-blue-700 border-blue-200 before:bg-blue-500",
  "Google Ads": "bg-amber-50 text-amber-700 border-amber-200 before:bg-amber-500",
  Direct: "bg-zinc-50 text-zinc-700 border-zinc-200 before:bg-zinc-500",
  Organic: "bg-teal-50 text-teal-700 border-teal-200 before:bg-teal-500",
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium leading-none before:h-1.5 before:w-1.5 before:rounded-full ${sourceStyle[source]}`}>
      {source}
    </span>
  );
}
