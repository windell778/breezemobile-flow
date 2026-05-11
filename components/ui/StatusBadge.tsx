type StatusBadgeProps = {
  label: "Alta intención" | "Media intención" | "Baja intención" | "Replay disponible" | "Sin replay";
};

const styles: Record<StatusBadgeProps["label"], string> = {
  "Alta intención": "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  "Media intención": "bg-amber-500/20 text-amber-200 border-amber-400/30",
  "Baja intención": "bg-slate-500/20 text-slate-200 border-slate-400/30",
  "Replay disponible": "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
  "Sin replay": "bg-rose-500/20 text-rose-200 border-rose-400/30",
};

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[label]}`}>
      {label}
    </span>
  );
}
