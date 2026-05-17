type Source = "Meta Ads" | "Google Ads" | "Direct" | "Organic";

type SourceBadgeProps = {
  source: Source;
};

const sourceStyle: Record<Source, { bg: string; color: string; border: string; dot: string }> = {
  "Meta Ads": {
    bg:     "oklch(97% 0.02 260)",
    color:  "oklch(38% 0.14 260)",
    border: "oklch(88% 0.05 260)",
    dot:    "oklch(52% 0.18 260)",
  },
  "Google Ads": {
    bg:     "oklch(97% 0.03 75)",
    color:  "oklch(40% 0.12 65)",
    border: "oklch(88% 0.06 75)",
    dot:    "oklch(65% 0.18 60)",
  },
  Direct: {
    bg:     "var(--color-surface-2)",
    color:  "var(--color-text-2)",
    border: "var(--color-border)",
    dot:    "var(--color-text-3)",
  },
  Organic: {
    bg:     "var(--color-signal-bg)",
    color:  "var(--color-signal-text)",
    border: "oklch(88% 0.06 145)",
    dot:    "var(--color-signal)",
  },
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const s = sourceStyle[source] ?? sourceStyle.Direct;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium leading-none"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      {source}
    </span>
  );
}
