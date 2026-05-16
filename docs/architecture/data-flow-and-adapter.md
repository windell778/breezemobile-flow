# Flujo de datos y DataAdapter

_Última actualización: 2026-05-16_

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
   - intent_level = inferido via `inferIntentLevel(events, DEFAULT_WORKSPACE_CONFIG)` en `lib/workspace-config.ts`
                   En workspace BreezeMobile: whatsapp_click→Alta, service_click→Media, else Baja
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

## 3. Dos capas de caché HogQL — live vs. golden

`lib/posthog/hogql.ts` mantiene dos capas de caché separadas:

| Caché | TTL | Tag | Usado para |
|-------|-----|-----|-----------|
| `runHogQL` | 60 s | — | Datos en vivo: listas de sesiones, eventos, datos por visitante |
| `runHogQLGolden` | 900 s | `"golden"` | Sub-queries HogQL de métricas agregadas |
| `_cachedDashboardMetrics` | 900 s | `"golden"` | Ensamblaje completo de `DashboardMetrics` |

La separación sigue el patrón de _golden layer_: las métricas agregadas
no cambian segundo a segundo. Cacheadas a 15 minutos reducen la carga sobre
PostHog y aceleran las páginas de resumen sin sacrificar frescura en las
vistas de detalle.

### Por qué `_cachedDashboardMetrics` es una caché propia

`getDashboardMetricsHogQL` ensambla el objeto `DashboardMetrics` completo:
combina el resultado de `runHogQLGolden`, `getCampaignSummariesHogQL`,
`getServiceSummariesHogQL` y `fetchRecordingsMap`. Incluye el campo
`cached_at: new Date().toISOString()` que representa cuándo se pobló la caché.

Si este ensamblaje no estuviera en su propia caché, `cached_at` se
regeneraría en cada request — aunque los datos de PostHog vinieran del
caché de `runHogQLGolden`. La UI mostraría "hace 0 min" aunque las métricas
tuvieran 14 minutos de antigüedad.

**Regla:** cualquier campo de metadatos de frescura debe generarse
**dentro** de la función cacheada, no fuera de ella.

```typescript
// ✓ correcto — cached_at se congela con los datos
const _cachedDashboardMetrics = unstable_cache(
  async (...) => {
    // ... queries
    return { ...metrics, cached_at: new Date().toISOString() };
  },
  ["posthog-dashboard-metrics"],
  { revalidate: 900, tags: ["golden"] }
);

// ✗ incorrecto — cached_at se actualiza en cada request
async function getDashboardMetricsHogQL(...) {
  const metrics = await runHogQLGolden(...);     // cacheado
  return { ...metrics, cached_at: new Date().toISOString() };  // NO cacheado
}
```

Para invalidar manualmente la capa golden:

```bash
curl -X POST /api/revalidate \
  -H "Authorization: Bearer <REVALIDATE_SECRET>"
```

Esto llama `revalidateTag("golden", "max")` e invalida todas las cachés
con tag `"golden"`: `_cachedHogQLPostGolden` y `_cachedDashboardMetrics`.

---

## 4. Limitaciones de HogQL  

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

## 5. Tracking Health — señales reales desde PostHog

La página `/tracking` muestra alertas de salud del tracking basadas en
datos reales de PostHog cuando `DATA_SOURCE=posthog`. Con `DATA_SOURCE=mock`
devuelve items estáticos de referencia.

| Adapter | Función | Caché |
|---|---|---|
| `PostHogAdapter` | `getTrackingHealthHogQL()` | golden, 900s |
| `MockAdapter` | `getTrackingHealthStatic()` | sin caché (datos fijos) |

### Checks actuales y su granularidad

Los checks usan dos queries con granularidades distintas. El nivel importa
porque determina qué significa exactamente cada alerta:

**Session-level** (subquery con `argMin` por timestamp):
- `sessions_without_utm` — sesiones cuyo **primer evento** (landing) no trae
  `utm_source` ni `utm_medium`. Consistente con el modelo de atribución:
  la sesión hereda la atribución de su evento inicial. Una sesión solo se
  cuenta como "sin UTM" si su landing no tenía atribución — no si algún
  evento interno posterior carece del campo.

**Event-level** (scan directo, sin agrupar por sesión):
- `wa_clicks_without_campaign` — eventos `whatsapp_click` cuyo payload no
  trae `utm_campaign`. **Es validación del payload del evento, no de la
  sesión.** Un evento puede carecer del campo aunque la sesión pueda
  atribuirse a una campaña.
- `events_without_visitor_id` — eventos sin `visitor_id` en el payload.
  Violación del contrato; indica que `posthog.register()` no se ejecutó.

### Reglas semánticas de Tracking Health

- Los checks son diagnósticos técnicos, **no métricas comerciales**.
- No infieren leads confirmados, ventas, revenue ni ROAS.
- Si el check es a nivel evento, el texto dice "evento sin campo".
- Si el check es a nivel sesión, el texto dice "sesión sin atribución".
- No mezclar ambas granularidades en el mismo item de alerta.
- El item del contrato V0 (`health_event_contract`) siempre se muestra
  como recordatorio de alcance, independientemente de los datos.

Para conectividad y muestra cruda de PostHog: `/api/diagnostics/posthog`.
Para drift entre capas de caché: `/api/diagnostics/consistency`.

---

## 6. Diagnóstico PostHog — alcance real

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

## 7. Diagnóstico de consistencia — drift entre capas de caché

`GET /api/diagnostics/consistency` detecta divergencia inesperada entre
las dos capas de caché del sistema.

**Auth:** `Authorization: Bearer <REVALIDATE_SECRET>` cuando la variable
de entorno está configurada. Sin la variable, el endpoint queda abierto.

### Qué compara

| Métrica | Golden (900s) | Live (60s) |
|---|---|---|
| `sessions` | `uniq(session_id)` HogQL | `listSessions().length` |
| `visitors` | `uniq(visitor_id)` HogQL | `new Set(visitor_id).size` sobre listSessions |
| `whatsappClicks` | `countIf(event='whatsapp_click')` HogQL | suma de eventos `whatsapp_click` en listSessions |

### Umbrales

| Estado | Condición | Interpretación |
|---|---|---|
| `ok` | diff_pct < 10% | Normal |
| `warn` | diff_pct 10–25% | Revisar; puede ser normal |
| `drift` | diff_pct > 25% | Investigar |

### Diferencias pequeñas son esperadas

Las dos capas tienen TTLs distintos y estrategias de query distintas:

- **Golden**: HogQL agregado, sin límite de filas, frescura 900s.
- **Live**: `listSessionsHogQL` con `LIMIT 5000`, sesiones reconstruidas
  desde eventos, frescura 60s.

Causas comunes de diferencia:
- TTL difference — golden puede tener datos de hace hasta 15 min
- Caché golden sin invalidar desde el último reinicio
- `listSessions()` truncado en LIMIT 5000 para volúmenes altos
- Diferencia entre query agregada HogQL y sesiones reconstruidas desde eventos
- Datos nuevos recién ingestados en PostHog visibles en live pero no en golden

### Lo que este endpoint NO valida

- `warn`/`drift` no significa bug confirmado — es una señal para investigar.
- Este diagnóstico **no valida si `whatsapp_click` es lead confirmado**.
  Solo compara conteos técnicos entre dos caminos de lectura de datos.
- No compara ni valida: revenue, ROAS, leads confirmados, ventas, ni
  ningún dato comercial. Solo métricas técnicas V0.

```
whatsapp_click en este endpoint = conteo de eventos técnicos
whatsapp_click ≠ lead confirmado
whatsapp_click ≠ venta
whatsapp_click ≠ revenue
```

### Uso

```bash
curl /api/diagnostics/consistency \
  -H "Authorization: Bearer <REVALIDATE_SECRET>"
```

Respuesta: `{ overall, dashboard_cached_at, live_computed_at, checks[], note[] }`

---

## 8. Multi-tenant — estado actual

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

---

## 9. Patrón filter-to-adapter — por qué y cómo

### El problema que resuelve

Antes de este patrón, las páginas hacían dos cosas en orden:

```
1. getAdapter().listSessions(workspaceId)   // trae TODAS las sesiones
2. allSessions.filter(s => ...)             // filtra en JS en la página
```

Esto significa que cada request de `/sesiones?filter=replay` descargaba
todas las sesiones al servidor de Next.js solo para descartar el 90%.
La carga se acumulaba tanto en PostHog (HogQL) como en memoria del server.

### La solución: `SessionFilters` antes de llamar al adapter

```typescript
// app/sesiones/page.tsx — SessionsTable
const adapterFilters: SessionFilters = {};
if (p.filter === "meta")       adapterFilters.source = "Meta Ads";
if (p.filter === "direct")     adapterFilters.source = "Direct";
if (p.source)                  adapterFilters.source = p.source as Source;
if (p.service)                 adapterFilters.service = p.service as ServiceKey;
if (p.query)                   adapterFilters.search = p.query;
if (p.filter === "replay")     adapterFilters.hasRecording = true;
if (p.filter === "whatsapp")   adapterFilters.eventName = "whatsapp_click";
if (p.filter === "service")    adapterFilters.eventName = "service_click";
if (p.event)                   adapterFilters.eventName = p.event as EventName;

const allSessions = await getAdapter().listSessions(DEFAULT_WORKSPACE_ID, adapterFilters);
```

Los filtros viajan al adapter, que los aplica antes de devolver datos.
En `MockAdapter` se aplican en memoria sobre los datos mock. En
`PostHogAdapter`, algunos filtros se pueden bajar al SQL HogQL.

### Qué filtros se bajan a SQL y cuáles no

`SessionFilters` solo tiene los campos que la página de sesiones necesita.
`visitorId` y `sessionId` **no pertenecen a `SessionFilters`** — pertenecen
a `EventFilters` y se usan en `listEventsHogQL` (no en `listSessionsHogQL`).

| Filtro `SessionFilters` | PostHogAdapter | Por qué |
|---|---|---|
| `source` | Memoria (post-fetch) | La fuente se infiere de UTMs; no hay columna directa |
| `service` | Memoria (post-fetch) | ídem, inferida de eventos |
| `search` | Memoria (post-fetch) | Texto libre — no bajar a SQL para evitar HogQL injection |
| `hasRecording` | Memoria (post-fetch) | Depende de `fetchRecordingsMap` (REST, no HogQL) |
| `eventName` | Memoria (post-fetch) | Si se bajara a SQL rompería el agrupamiento de sesiones* |

Los únicos filtros que `listEventsHogQL` baja a SQL son `visitorId` y
`sessionId` (de `EventFilters`), porque son IDs internos con formato controlado.
Ver §4 para la nota de seguridad sobre interpolación de IDs.

*Si el WHERE SQL de `eventName` filtrara eventos individuales, HogQL
devolvería solo los eventos que coinciden. Al agrupar por `session_id`,
las sesiones quedarían con solo esos eventos — sin los demás. El resultado
sería sesiones con duración 0, sin journey, con events.length = 1 aunque
la sesión real tuviera 10 eventos.

### Qué queda en JS (post-adapter)

Dos filtros que por su naturaleza son post-fetch y permanecen en la página:

```typescript
const visible = allSessions.filter((session) => {
  const matchesSinInteraccion = p.filter !== "sin_interaccion" || session.events.length === 1;
  const matchesCampaign = !p.campaign || session.attribution.utm_campaign.toLowerCase() === p.campaign;
  return matchesSinInteraccion && matchesCampaign;
});
```

- `sin_interaccion`: filtra sesiones de un solo evento. No se puede bajar
  a SQL porque requiere contar eventos por sesión después del agrupamiento.
- `campaign`: filtra por `utm_campaign` exacto. Se mantiene en JS por ser
  un filtro de texto libre con lógica case-insensitive no crítica en volumen.

### ⚠️ No tocar: `search` en HogQL

`adapterFilters.search` viaja al adapter, pero en `PostHogAdapter` se
aplica en memoria (no en SQL). Esto es intencional. Si en algún momento
alguien decide bajar `search` a una condición HogQL, DEBE sanitizarlo con
una allowlist de caracteres antes de interpolarlo en el string SQL. El
texto libre en queries es el vector clásico de injection.

---

## 13. Paginación en `/sesiones` — truco limit+1

### Por qué no hay una query de conteo separada

Obtener el total de resultados requiere una segunda query (COUNT(*)) que
en PostHog significa otro round-trip a HogQL. Para V0 con volúmenes bajos,
se usa el truco `limit+1`: se pide un resultado más del que se va a mostrar.
Si llegan `limit+1` resultados, hay una página siguiente; si llegan `limit`
o menos, es la última página.

```typescript
// app/sesiones/page.tsx — SessionsTable
adapterFilters.limit = p.limit + 1;
adapterFilters.offset = (p.page - 1) * p.limit;

const allSessions = await getAdapter().listSessions(DEFAULT_WORKSPACE_ID, adapterFilters);
// JS post-filters (sin_interaccion, campaign)
const visible = allSessions.filter(...);

const hasNextPage = visible.length > p.limit;
const display = visible.slice(0, p.limit);  // descartar el +1 extra
```

### Parámetros de URL

| Param | Default | Rango | Nota |
|---|---|---|---|
| `page` | `1` | ≥ 1 | Controlado por `Math.max(1, parseInt(...))` |
| `limit` | `25` | 5 – 100 | `Math.min(100, Math.max(5, parseInt(...)))` |

### Preservación de filtros en la paginación

`buildPageHref(p, newPage)` reconstruye la URL con todos los filtros
activos al cambiar de página. Los chips de filtro no incluyen `&page=X`,
lo que implica un reset natural a página 1 al cambiar filtros.

```typescript
function buildPageHref(p: TableParams, newPage: number): string {
  const q = new URLSearchParams();
  if (p.filter !== "todas") q.set("filter", p.filter);
  if (p.query) q.set("q", p.query);
  // ... resto de filtros ...
  q.set("page", String(newPage));
  return `/sesiones?${q.toString()}`;
}
```

### Imprecisión conocida con JS post-filters

El truco `limit+1` asume que los JS post-filters (sin_interaccion, campaign)
no eliminan resultados. Si lo hacen, el conteo visible puede ser menor que
`limit` incluso cuando hay página siguiente en el adapter. El resultado es
que `hasNextPage` puede ser `false` aunque existan más datos.

Esta imprecisión es aceptable en V0 porque `sin_interaccion` y `campaign`
son filtros poco usados y los volúmenes son bajos. Cuando el volumen crezca
o se adopten más filtros JS, mover estos filtros al adapter o agregar una
query de conteo separada.

### `SessionFilters.limit` y `offset` en los adapters

Ambos campos ya están definidos en `types.ts` y son manejados por ambos adapters:

- `MockAdapter`: aplica `.slice(offset, offset + limit)` sobre datos mock en memoria.
- `PostHogAdapter`: no los baja a SQL directamente (HogQL usa `LIMIT 5000`).
  El adapter aplica offset/limit sobre las sesiones reconstruidas en memoria.

---

## 14. Dimensión `campaign` en `/campanas` — `getCampaignSummaries()`

### El problema que resuelve

Para la dimensión "campaña" en `/campanas`, la implementación original
llamaba a `listSessions()` y agrupaba en JS:

```
listSessions() → todas las sesiones → agrupar por utm_campaign en JS
```

Esto descargaba toda la lista de sesiones solo para obtener un agregado.
`getCampaignSummaries()` ya existe en ambos adapters y devuelve directamente
el agregado por campaña — sin cargar sesiones individuales.

### Implementación actual

```typescript
// app/campanas/page.tsx — AttributionTable
if (dimension === "campaign") {
  const campaigns = await adapter.getCampaignSummaries(DEFAULT_WORKSPACE_ID);
  rows = buildRowsFromCampaigns(campaigns);
} else {
  // V0: build aggregate from listSessions for source/medium/content.
  // Acceptable at current volumes; replace with adapter-level HogQL
  // aggregate queries before data exceeds ~500 sessions.
  const sessions = await adapter.listSessions(DEFAULT_WORKSPACE_ID);
  rows = buildAttributionRows(sessions, dimension);
}
```

### Por qué las otras dimensiones aún usan `listSessions()`

`getCampaignSummaries()` devuelve un agregado pre-calculado que incluye
`sessions`, `service_clicks`, `whatsapp_clicks`, y `campaign_id`.
Equivalentes para `source`, `medium`, y `content` no existen aún en el
adapter. Crearlos requiere HogQL aggregate queries nuevas (equivalentes a
`getCampaignSummariesHogQL` pero agrupando por las otras dimensiones).

TODO: implementar `getSourceSummaries()`, `getMediumSummaries()` y
`getContentSummaries()` en el adapter antes de que el volumen supere
~500 sesiones activas.

### Señal semántica — recordatorio

```
whatsapp_click = señal de intención anónima (evento de comportamiento)
whatsapp_click ≠ lead confirmado
whatsapp_click ≠ venta
whatsapp_click ≠ revenue
```

Ninguna métrica en `/campanas` puede implicar conversión confirmada,
costo, ROAS, ni datos comerciales. Solo señales de comportamiento.

---

## 10. Patrón `EmptyState`

### Por qué existe

Antes de este componente, cada página resolvía "sin resultados" de forma
diferente: algunas mostraban texto inline, otras no mostraban nada, otras
dejaban tablas vacías sin mensaje. La experiencia era inconsistente.

### Implementación

```typescript
// components/ui/EmptyState.tsx
type EmptyStateProps = { message?: string; };

export function EmptyState({ message = "No hay datos disponibles." }: EmptyStateProps) {
  return (
    <div className="mt-4 grid place-items-center rounded-md border border-dashed
                    border-slate-200 bg-slate-50 py-16 text-sm text-slate-500">
      {message}
    </div>
  );
}
```

### Dónde se usa

| Página | Condición |
|---|---|
| `app/sesiones/page.tsx` | `visible.length === 0` después de filtros |
| `app/eventos/page.tsx` | `visibleEvents.length === 0` después de filtros |
| `app/grabaciones/page.tsx` | Lista de sesiones vacía |
| `app/campanas/page.tsx` | `rows.length === 0` por dimensión |
| `app/servicios/page.tsx` | `servicePageSummaries.length === 0` |
| `app/tracking/page.tsx` | `sorted.length === 0` (oculta también el banner de estado) |

### Cuándo usarlo vs. no usarlo

Usar `EmptyState` cuando el resultado vacío es esperado y correcto (sin datos
que coincidan con el filtro). No usarlo para estados de error (HTTP 500, fallo
de red) — esos necesitan manejo diferente. No usarlo dentro de tablas con
estructura definida; colocarlo fuera de la tabla.

---

## 11. Patrón de renderizado: `force-dynamic` + Suspense

### Por qué `force-dynamic` en todas las páginas

Las páginas de datos leen `searchParams` (URL query params) en server
components. Next.js en producción intentaría statically render páginas que
no leen params dinámicos. Con `searchParams`, Next.js necesita `force-dynamic`
para garantizar que cada request lee los params frescos del URL.

Sin `force-dynamic`, una página con `?filter=replay` podría servir la versión
cacheada de `?filter=meta` durante el TTL del static render.

```typescript
// Al inicio de cada page.tsx que lee searchParams
export const dynamic = "force-dynamic";
```

Páginas con `force-dynamic`: `app/page.tsx`, `app/sesiones/page.tsx`,
`app/eventos/page.tsx`, `app/grabaciones/page.tsx`, `app/campanas/page.tsx`,
`app/servicios/page.tsx`, `app/tracking/page.tsx`.

### Por qué Suspense con fallback

Las páginas que hacen fetches al adapter los envuelven en un componente
hijo async, suspendido con un fallback de loading:

```tsx
// app/sesiones/page.tsx
<Suspense fallback={<SessionsLoading />}>
  <SessionsTable params={params} />
</Suspense>
```

Esto habilita streaming: Next.js envía el HTML del layout y el fallback
inmediatamente, sin esperar a que el fetch de PostHog complete. El componente
`SessionsTable` hace el fetch y se envía cuando está listo.

**Consecuencia importante:** si se mueve la lógica de fetch al componente
padre (fuera de Suspense), Next.js no puede hacer streaming y la página
bloquea hasta que el fetch completa — el usuario ve pantalla en blanco.

### ⚠️ No tocar

- No mover fetches del adapter fuera del componente suspendido.
- No quitar `force-dynamic` sin probar que la página funciona con filtros
  dinámicos en producción.
- No agregar `revalidate` a nivel de página — el control de TTL vive en
  las funciones `runHogQL` y `runHogQLGolden`.

---

## 12. `shortId` — por qué existe y cómo funciona

### El problema

Los IDs internos tienen el formato `visitor_{timestamp}_{random}` y
`sess_{timestamp}_{random}`. Por ejemplo:
`sess_1778712345678_cie4wf7`. El timestamp (13 dígitos) es idéntico o
muy similar entre sesiones cercanas en el tiempo, haciendo difícil
distinguir visualmente sesiones en una tabla.

La parte verdaderamente única es el sufijo random después del último `_`.

### Implementación

```typescript
// lib/labels.ts
export function shortId(id: string): string {
  const lastUnderscore = id.lastIndexOf("_");
  if (lastUnderscore !== -1 && id.length - lastUnderscore - 1 >= 4) {
    return id.slice(lastUnderscore + 1);
  }
  return id.slice(0, 8);  // fallback para UUIDs u otros formatos
}
```

- Extrae el sufijo después del último `_` si tiene al menos 4 caracteres.
- Fallback a los primeros 8 caracteres para IDs sin guiones bajos (UUIDs).

### Dónde se usa

En todas las páginas que muestran IDs en tablas o encabezados:

| Página | Uso |
|---|---|
| `app/sesiones/page.tsx` | Columnas session_id y visitor_id |
| `app/eventos/page.tsx` | Columna visitor_id / session_id combinada |
| `app/grabaciones/page.tsx` | Encabezado de sesión activa y lista de sesiones |
| `app/visitantes/[visitorId]/page.tsx` | Título de página, encabezados de sesión, journey, tabs |

### ⚠️ No tocar

`shortId` es solo display. El ID completo (`session.session_id`,
`session.visitor_id`) debe usarse para todas las URLs, queries, y lógica.
Nunca almacenar ni comparar `shortId` — es presentacional.
