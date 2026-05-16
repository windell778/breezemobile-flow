# Dominio: Grabaciones / Replay

Contexto de trabajo para el dominio de grabaciones en BreezeMobile Flow.

## Archivos clave

- `app/grabaciones/page.tsx` — página con player, event feed y lista de sesiones
- `components/ui/ReplayPreview.tsx` — wrapper del player
- `components/ui/RRWebPlayer.tsx` — player rrweb con ResizeObserver y fetch de snapshots
- `app/api/recordings/[recordingId]/snapshots/route.ts` — API que sirve eventos rrweb
- `lib/posthog/recordings.ts` — descarga y descompresión de snapshots desde PostHog
- `lib/data/types.ts` → `RecordingRef`, `RecordingStatus`

## LEER ANTES DE TOCAR

**`docs/architecture/recordings.md` es obligatorio** antes de cualquier cambio
a recordings, replay, rrweb, snapshots, R2, o `/api/recordings/*`.

Ese documento es la fuente de verdad para:
- Formato `blob_v2` (NDJSON: `[window_id, rrweb_event]`)
- Compresión gzip latin1 (NO base64)
- Aislamiento por `window_id` — cada Replayer es independiente
- Modos de fallo que rompen el player
- Alineación de timestamps PostHog vs rrweb (§11) — leer antes de cualquier
  feature de seek o timeline que use timestamps de eventos

Si la tarea toca replay privacy, masking, `data-ph-mask`, `data-ph-no-capture`,
`data-ph-unmask`, o PostHog Session Replay config, leer también:
**`docs/tracking/replay-privacy.md`**

## Arquitectura del player

```
RRWebPlayer
  ├── ResizeObserver en wrapperRef → mide ancho real del contenedor
  ├── playerWidth = 0 significa "no medido aún" → init espera
  ├── fetch /api/recordings/[id]/snapshots → devuelve { events, windows, currentWindow }
  └── new rrwebPlayer({ target: containerRef, props: { events, width, height } })
```

## Estados del recording

```typescript
type RecordingStatus =
  | "available"      // existe y se puede reproducir
  | "missing"        // no hay recording para esta sesión
  | "pending"        // sesión en progreso
  | "processing"     // webhook recibido, descarga en progreso
  | "not_supported"  // fuente no soporta replay
```

## Caché

- `fetchRecordingsMap` usa REST GET `/session_recordings/?limit=200`
- **No** usa HogQL — la tabla `session_recordings` no está disponible en PostHog Cloud
- El recording_id de PostHog se cruza con nuestro `session_id` via `person.properties.session_id`

## No tocar

- `decompressEventData` en recordings.ts — usa `Buffer.from(data, "latin1")` (no base64)
- `sanitizeNode` en recordings.ts — elimina childNodes null para rrweb
- La lógica de `window_id` en el API route de snapshots
