type KpiCardProps = {
  title: string;
  value: string;
  description: string;
  trend: string;
};

export function KpiCard({ title, value, description, trend }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#11192e]/85 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <p className="mt-4 text-xs font-medium text-cyan-300">{trend}</p>
    </article>
  );
}
