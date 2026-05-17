type Level = "Alta" | "Media" | "Baja";

const styles: Record<Level, { bg: string; color: string }> = {
  Alta:  { bg: "var(--color-signal-bg)",  color: "var(--color-signal-text)" },
  Media: { bg: "var(--color-warn-bg)",    color: "var(--color-warn-text)" },
  Baja:  { bg: "var(--color-surface-2)",  color: "var(--color-text-3)" },
};

export function IntentBadge({ level }: { level: string }) {
  const s = styles[level as Level] ?? styles.Baja;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {level}
    </span>
  );
}
