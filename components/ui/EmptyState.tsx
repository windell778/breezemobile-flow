type EmptyStateProps = {
  message?: string;
};

export function EmptyState({ message = "No hay datos disponibles." }: EmptyStateProps) {
  return (
    <div className="mt-4 grid place-items-center rounded-md border border-dashed border-slate-200 bg-slate-50 py-16 text-sm text-slate-500">
      {message}
    </div>
  );
}
