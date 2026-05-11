type StatusBadgeProps = {
  label: string;
};

export function StatusBadge({ label }: StatusBadgeProps) {
  const style = label.includes("Alta")
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : label.includes("Media")
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : label.includes("Replay") || label.includes("Grabacion")
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : label.includes("Sin")
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium leading-none ${style}`}>
      {label}
    </span>
  );
}
