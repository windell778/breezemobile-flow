type StatusBadgeProps = {
  label: string;
};

export function StatusBadge({ label }: StatusBadgeProps) {
  const isSignal = label.includes("Alta");
  const isWarn = label.includes("Media");
  const isRecording = label.includes("Grabaci") || label.includes("Replay");
  const isMissing = label.includes("Sin");

  const style = isSignal
    ? { bg: "var(--color-signal-bg)",  color: "var(--color-signal-text)", border: "oklch(88% 0.06 145)" }
    : isWarn
    ? { bg: "var(--color-warn-bg)",    color: "var(--color-warn-text)",   border: "oklch(88% 0.07 75)" }
    : isRecording
    ? { bg: "var(--color-primary-bg)", color: "var(--color-primary)",     border: "oklch(88% 0.04 255)" }
    : isMissing
    ? { bg: "var(--color-error-bg)",   color: "var(--color-error-text)",  border: "oklch(90% 0.03 25)" }
    : { bg: "var(--color-surface-2)",  color: "var(--color-text-2)",      border: "var(--color-border)" };

  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium leading-none"
      style={{ background: style.bg, color: style.color, borderColor: style.border }}
    >
      {label}
    </span>
  );
}
