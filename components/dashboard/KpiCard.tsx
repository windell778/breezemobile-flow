type KpiCardProps = {
  title: string;
  value: string;
  description: string;
  trend: string;
};

export function KpiCard({ title, value, description, trend }: KpiCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <p className="mt-4 text-xs font-medium text-cyan-700">{trend}</p>
    </article>
  );
}
