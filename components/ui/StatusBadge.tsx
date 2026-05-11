type StatusBadgeProps = {
  label: string;
};

export function StatusBadge({ label }: StatusBadgeProps) {
  const style = label.includes("Alta")
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : label.includes("Media")
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : label.includes("Replay") || label.includes("Grabacion")
        ? "bg-cyan-50 text-cyan-700 border-cyan-200"
        : label.includes("Sin")
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
