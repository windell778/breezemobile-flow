# Dominio: Sesiones

Contexto de trabajo para el dominio de sesiones en BreezeMobile Flow.

## Archivos clave

- `app/sesiones/page.tsx` — página principal con filtros y tabla
- `lib/posthog/hogql.ts` → `listSessionsHogQL` — query HogQL que construye sesiones
- `lib/data/adapter.ts` → `MockAdapter.listSessions`, `PostHogAdapter.listSessions`
- `lib/data/types.ts` → `Session`, `SessionFilters`
- `components/ui/EmptyState.tsx` — estado vacío cuando no hay resultados

## Leer antes de cambiar

1. `docs/architecture/data-flow-and-adapter.md` — cómo se construyen sesiones desde eventos
2. `docs/tracking/tracking-contract.md` — session_id, attribution, reglas de sesión

## Contrato de datos

- Las sesiones **no existen como entidad en PostHog** — se construyen agrupando eventos por `session_id`
- `session_id`, `visitor_id`, `event_id` nunca se modifican (líneas rojas)
- `source` e `intent_level` son inferencias del servidor, no campos reales
- `duration` siempre es `null` en datos reales (solo mock tiene valores)
- La atribución es de nivel sesión; no se hereda entre sesiones
- `whatsapp_click` = señal de alta intención, NO lead, NO venta

## Caché

- `listSessionsHogQL` usa `runHogQL` — caché de 60s (datos en vivo)
- Los filtros pasan por `SessionFilters` al adapter antes de llegar a HogQL
- Post-filtrado en JS solo para: `sin_interaccion` (events.length === 1) y `campaign`

## Filtros disponibles (SessionFilters)

```typescript
{
  eventName?: EventName;     // → SQL pushdown parcial
  source?: Source;           // → filtro en memoria post-fetch
  service?: ServiceKey;      // → filtro en memoria post-fetch
  hasRecording?: boolean;    // → filtro en memoria post-fetch
  search?: string;           // → filtro en memoria post-fetch
  limit?: number;
  offset?: number;
}
```

## No tocar

- Nombres de eventos (`page_view_custom`, `service_click`, `whatsapp_click`)
- Lógica de generación de IDs
- `inferSource()` y `inferIntentLevel()` en hogql.ts sin revisar el contrato
