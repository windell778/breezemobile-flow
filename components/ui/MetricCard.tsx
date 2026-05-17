type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article
      className="group flex flex-col px-5 py-4 transition-colors"
      style={{ background: "var(--color-surface)" }}
    >
      <span className="text-[11px] font-medium" style={{ color: "var(--color-text-3)" }}>
        {label}
      </span>
      <span
        className="mt-1.5 text-3xl font-bold tracking-tight"
        style={{ color: "var(--color-text-1)" }}
      >
        {value}
      </span>
      <span className="mt-1 text-xs" style={{ color: "var(--color-text-3)" }}>
        {detail}
      </span>
    </article>
  );
}
