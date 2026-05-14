"use client";

import type { RecordingStatus } from "@/lib/data/types";

const config: Record<
  RecordingStatus,
  { label: string; description: string; color: string }
> = {
  available: {
    label: "Grabación disponible",
    description: "La sesión fue grabada y está lista para reproducir.",
    color: "text-emerald-400",
  },
  missing: {
    label: "Sin grabación",
    description: "No hay grabación asociada a esta sesión.",
    color: "text-zinc-500",
  },
  pending: {
    label: "Sesión en curso",
    description: "La sesión todavía está activa. La grabación estará disponible cuando termine.",
    color: "text-amber-400",
  },
  processing: {
    label: "Procesando grabación",
    description: "La grabación fue recibida y se está almacenando.",
    color: "text-blue-400",
  },
  not_supported: {
    label: "No disponible",
    description: "Esta fuente no permite grabaciones de sesión.",
    color: "text-zinc-600",
  },
};

type Props = {
  status: RecordingStatus;
  compact?: boolean;
};

export function RecordingStatus({ status, compact = false }: Props) {
  const { label, description, color } = config[status];

  if (compact) {
    return (
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      <span className="text-xs text-zinc-500">{description}</span>
    </div>
  );
}
