# Flujo de datos y DataAdapter

_Última actualización: 2026-05-14_

Este documento explica cómo fluyen los datos desde PostHog hasta la UI,
cómo está diseñado el sistema de adaptadores, y las limitaciones actuales
que cualquier desarrollador debe conocer antes de tocar estas capas.

---

## 1. El DataAdapter — patrón y propósito

Toda la plataforma accede a datos a través de una interfaz única:

```typescript
// lib/data/adapter.ts
export interface DataAdapter { ... }
```

Hay dos implementaciones:

| Implementación | Cuándo activa | Archivo |
|---|---|---|
| `PostHogAdapter` | `DATA_SOURCE=posthog` + credenciales presentes | `lib/posthog/*.ts` |
| `MockAdapter` | Cualquier otro caso | `lib/mock-data.ts` |

El propósito es que las páginas y componentes nunca llamen directamente
a PostHog — solo hablan con el adapter. Esto permite:
- Desarrollo local sin credenciales (mock)
- Cambiar la fuente de datos sin tocar la UI
- Soporte futuro de múltiples fuentes (BigQuery, Mixpanel, etc.)

### Fallback silencioso a mock

Si `DATA_SOURCE=posthog` pero faltan `POSTHOG_PROJECT_ID` o
`POSTHOG_API_KEY`, el adapter **cae silenciosamente a mock** con un
`console.warn`. La UI no muestra ningún error — simplemente aparecen
datos ficticios.

Esto confunde cuando alguien está depurando datos reales y ve mock sin
entender por qué. Si los datos se ven raros, verificar:

```bash
echo $DATA_SOURCE          # debe ser "posthog"
echo $POSTHOG_PROJECT_ID   # debe ser el ID numérico del proyecto
echo $POSTHOG_API_KEY      # debe empezar con phx_
```

### El adapter está memoizado

`getAdapter()` almacena la instancia en un módulo-level singleton `_adapter`.
Una vez inicializado, no cambia mientras el proceso del servidor esté vivo.

```typescript
let _adapter: DataAdapter | null = null;

export function getAdapter(): DataAdapter {
  if (_adapter) return _adapter;
  // ... inicializa y guarda en _adapter
}
```

**Consecuencia:** cambios en `.env.local` requieren reiniciar el servidor
(`npm run dev`). Modificar variables de entorno en caliente no tiene efecto.

### ⚠️ No resetear `_adapter` manualmente

Si alguien agrega lógica para resetear el singleton (por ejemplo, para
tests), hay que asegurarse de que los server components que ya tienen
referencia al adapter anterior no queden en estado inconsistente.

---

## 2. Cómo se construyen sesiones desde eventos

PostHog no tiene un concepto de "sesión" como entidad propia en su API
de eventos. **Las sesiones en esta plataforma son construidas en el
servidor** agrupando eventos por `session_id`.

### Flujo en `listSessionsHogQL` (`lib/posthog/hogql.ts`)

```
1. Query HogQL: todos los eventos con session_id no nulo (LIMIT 5000)
2. Por cada fila de evento → construir TrackingEvent
3. Agrupar TrackingEvents por session_id → Map<sessionId, events[]>
4. Por cada grupo → construir Session:
   - timestamp    = min(event.timestamp) del grupo
   - duration     = null (PostHog Events API no devuelve duración de sesión)
   - intent_level = inferido: whatsapp_click→Alta, service_click→Media, else Baja
   - source       = inferido: de utm_medium/utm_source del primer evento
   - attribution  = campos UTM del primer evento del grupo
   - recording    = cruzado desde fetchRecordingsMap() si existe
5. Devolver lista de Session ordenada por timestamp desc
```

### Qué significa esto en la práctica

- **La duración siempre es `null`** en datos reales de PostHog. Solo tiene
  valor en datos mock. No se debe mostrar como "0 min" sino como vacío.
- **La fuente (`source`) es una inferencia**, no un campo real. Si
  `utm_medium` y `utm_source` están vacíos, la sesión aparece como "Direct".
- **El intent level es una inferencia** basada en el evento de mayor
  intención de la sesión. No es un score calculado por PostHog.
- **Los campos UTM vienen del primer evento de la sesión**, no de todos.
  Si el primer evento no tiene UTMs pero los siguientes sí, se pierden.
  Esto es correcto según el contrato de tracking (atribución al landing).

### Por qué no usar la API de sesiones de PostHog

PostHog tiene endpoints `/sessions/` pero no están disponibles en todos
los planes y no contienen los campos de atribución propios
(`session_id`, `visitor_id`, `utm_*`) que se registran via
`posthog.register()`. Los datos que necesitamos viven en las
`properties` de los eventos, no en la entidad sesión de PostHog.

---

## 3. Limitaciones de HogQL

### Límites hardcodeados

| Query | Límite | Archivo | Línea aprox. |
|---|---|---|---|
| `listSessionsHogQL` (eventos) | `LIMIT 5000` | `hogql.ts` | ~195 |
| `listEventsHogQL` | `LIMIT ${limit}` (default 500) | `hogql.ts` | ~325 |
| `getCampaignSummariesHogQL` | `LIMIT 50` | `hogql.ts` | ~395 |
| `getServiceSummariesHogQL` | `LIMIT 50` | `hogql.ts` | ~437 |
| `fetchRecordingsMap` | `limit=200` (REST) | `hogql.ts` | ~105 |

Estos límites son adecuados para el volumen actual (cientos de eventos).
Cuando el sitio tenga miles de sesiones diarias, el LIMIT 5000 de
`listSessionsHogQL` empezará a truncar datos. En ese punto hay que
implementar paginación real o agregar un filtro de rango de fechas.

### Interpolación directa de IDs en queries

Las queries HogQL interpolan valores directamente en el string SQL:

```typescript
conditions.push(`properties.visitor_id = '${filters.visitorId}'`);
conditions.push(`properties.session_id = '${filters.sessionId}'`);
```

Hoy esto es seguro porque `visitor_id` y `session_id` son IDs internos
generados por el script del sitio con formato controlado
(`visitor_{timestamp}_{random}`, `sess_{timestamp}_{random}`).

**⚠️ Riesgo futuro:** si en algún momento se permite que valores libres
del usuario (búsquedas, filtros de texto) se interpolen en queries HogQL,
se abre un vector de HogQL injection. Antes de hacer eso, usar
parámetros de query o sanitizar con una allowlist de caracteres.

### HogQL no es SQL estándar

HogQL es el dialecto SQL de PostHog (basado en ClickHouse). Algunas
diferencias importantes:

- `properties.campo` accede directamente a propiedades del evento
- No existe `JOIN` con tablas externas
- La tabla `session_recordings` **no está disponible** en PostHog Cloud
  (solo en self-hosted). Por eso `fetchRecordingsMap` usa la REST API
  `/session_recordings/` en lugar de HogQL.
- Funciones de fecha pueden diferir de PostgreSQL/MySQL

---

## 4. Tracking Health — alcance real

La página `/tracking` muestra datos de "salud del tracking", pero
**actualmente no audita datos reales**. El contenido es estático: es
una copia del contrato de tracking formateada para la UI.

```typescript
// lib/posthog/hogql.ts
export function getTrackingHealthStatic(workspaceId: string): TrackingHealth[] {
  // Devuelve checklist hardcodeado, no queries a PostHog
}
```

Lo que el usuario ve no refleja si los eventos reales de PostHog
cumplen el contrato — es una guía de referencia, no un validador.
Para validar datos reales usar `/api/diagnostics/posthog`.

---

## 5. Diagnóstico PostHog — alcance real

`GET /api/diagnostics/posthog` valida que la conexión con PostHog
funciona y devuelve una muestra cruda de eventos y grabaciones.

**Lo que valida:**
- Que `POSTHOG_PROJECT_ID` y `POSTHOG_API_KEY` están configurados
- Que la API de PostHog responde
- Que hay eventos en el proyecto

**Lo que NO valida:**
- Que cada evento tenga todos los campos requeridos por el contrato
- Que `visitor_id`, `session_id` o `event_id` tienen el formato correcto
- Que los campos de atribución (UTMs, fbclid, etc.) están presentes
- Que las grabaciones se pueden reproducir correctamente
- Que GTM o dataLayer están configurados

Para validación completa del contrato, hay que revisar manualmente los
eventos en PostHog con una visita de prueba usando una URL con UTMs.

---

## 6. Multi-tenant — estado actual

`workspace_id` está fijo como `"breezemobile"` (o el valor de la
variable de entorno `WORKSPACE_ID`). No hay autenticación ni separación
real entre clientes.

```typescript
// lib/data/adapter.ts
export const DEFAULT_WORKSPACE_ID = process.env.WORKSPACE_ID ?? "breezemobile";
```

Todas las queries y referencias de storage usan este ID. Cuando se
implemente multi-tenant (Fase 6), este ID deberá venir del contexto
de autenticación del usuario, no de una env var global.
