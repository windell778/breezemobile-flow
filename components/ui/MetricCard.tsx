type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="bf-panel bf-panel-hover group relative overflow-hidden p-3">
      <div className="absolute inset-x-4 bottom-3 flex h-8 items-end gap-1 opacity-40 transition group-hover:opacity-70">
        {[34, 52, 28, 64, 46, 72, 58, 84].map((height, index) => (
          <span key={index} className="flex-1 rounded-t bg-blue-100" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="relative">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        <p className="mt-2 min-h-9 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
    </article>
  );
}
