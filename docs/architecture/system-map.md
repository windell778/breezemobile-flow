# Mapa del sistema — BreezeMobile Flow Intelligence

_Creado: 2026-05-17_

Este documento describe cómo fluyen los datos de punta a punta: desde el visitante en el sitio hasta la UI de la plataforma. Leerlo antes de tocar cualquier integración, query o capa de datos.

---

## Flujo general

```
SITIO WEB (HubSpot)
  └── breeze-scripts.js
        ├── genera visitor_id  (localStorage, permanente)
        ├── genera session_id  (sessionStorage, por visita)
        ├── genera event_id    (por evento)
        ├── captura UTMs de la URL
        └── captura fbclid, fbp, fbc
              │
              ├──▶ dataLayer
              │       └── Google Tag Manager
              │             ├── valida que los campos existen
              │             ├── activa Meta Pixel en whatsapp_click
              │             └── activa otras etiquetas configuradas
              │
              └──▶ PostHog  (vía posthog.capture + posthog.register)
                      ├── almacena eventos con todas las properties
                      ├── graba la sesión con rrweb
                      └── expone grabaciones vía API en tiempo real
                                │
                        PostHog API  [solo acceso servidor]
                        (webhook recording-ended → R2: flujo futuro, hoy inactivo)
                                │
                        DataAdapter  (lib/data/adapter.ts)
                        ├── MockAdapter     DATA_SOURCE=mock
                        └── PostHogAdapter  DATA_SOURCE=posthog
                                │
                        Server Components  (app/)
                                │
                        UI  (Next.js + Tailwind)
```

---

## Capas del sistema

### Capa 1 — breeze-scripts.js (sitio)

**Rol:** único punto de generación de identidad y captura de contexto.

**Produce:**
- `visitor_id` — ID permanente del visitante anónimo, almacenado en `localStorage`.
- `session_id` — ID de sesión, almacenado en `sessionStorage` (nuevo en cada pestaña/sesión).
- `event_id` — ID único por evento de intención.
- Atribución: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `campaign_id`, `adset_id`, `ad_id`, `fbclid`, `fbp`, `fbc`.
- Contexto de página: `page_url`, `page_path`, `page_title`, `referrer`.
- Contexto de evento: `service`, `cta_text`, `cta_location`, `link_url`.

**Fuente de verdad para:** `visitor_id`, `session_id`, `event_id`, atribución de sesión.

**No hace:**
- No almacena datos personales.
- No llama directamente a Meta Ads API.
- No envía datos a ninguna base de datos propia.

---

### Capa 2 — dataLayer / GTM

**Rol:** capa de comunicación y orquestación de etiquetas en el lado del cliente.

**Produce:** eventos estructurados en `window.dataLayer` que GTM puede leer.

**Fuente de verdad para:** validación de que los eventos llegan con los campos correctos; activación de Meta Pixel en `whatsapp_click`.

**No hace:**
- No es la base de datos histórica de la plataforma.
- No almacena sesiones ni visitantes.
- No reemplaza a PostHog como fuente de eventos.
- No envía datos al servidor de la plataforma.

**Relación con PostHog:** paralela, no jerárquica. Los mismos eventos de `breeze-scripts.js` van tanto a PostHog como a dataLayer. GTM no alimenta PostHog ni viceversa.

---

### Capa 3 — PostHog

**Rol:** fuente principal de datos V0 para eventos, sesiones y grabaciones.

**Produce:**
- Historial de eventos por `visitor_id` (= `distinct_id` en PostHog).
- Agrupación de eventos por `session_id` → permite construir sesiones.
- Grabaciones rrweb de las sesiones (formato blob_v2, NDJSON, gzip latin1).
- Metadatos de grabación (duración, `person_uuid`, `session_id`).

**Fuente de verdad para:** eventos históricos, grabaciones, datos de visitante en V0.

**No hace:**
- No tiene un concepto de "sesión" como entidad propia compatible con nuestro modelo. Las sesiones se construyen en el servidor de la plataforma agrupando eventos por `session_id`.
- No tiene `visitor_id` como campo nativo — se usa `posthog.identify(visitor_id)` para que `distinct_id` sea nuestro `visitor_id`.
- No almacena leads, datos personales, ventas ni outcomes comerciales.
- No reemplaza a GTM ni a Meta Pixel para activación de etiquetas.

**Endpoints usados:**
- `GET /events/` — eventos por `distinct_id`.
- `GET /persons/` — resolver `distinct_id` → `person_uuid`.
- `GET /session_recordings/` — lista de grabaciones por `person_uuid`.
- `GET /session_recordings/{id}/snapshots/` — eventos rrweb de una grabación.
- `POST /query/` — HogQL para agregaciones (campañas, servicios, dashboard).

→ Detalles de grabaciones: `docs/architecture/recordings.md`
→ Detalles de HogQL y caché: `docs/architecture/data-flow-and-adapter.md §§3-4`

---

### Capa 4 — DataAdapter (lib/data/adapter.ts)

**Rol:** interfaz única entre la UI y los datos. Abstrae PostHog y el mock.

**Produce:** tipos canónicos del modelo interno (`Session`, `TrackingEvent`, `Visitor`, `RecordingRef`, etc. — definidos en `lib/data/types.ts`).

**Fuente de verdad para:** el modelo de datos que usa la UI. Las páginas no saben si los datos vienen de PostHog o del mock.

**Implementaciones:**
- `MockAdapter` — datos de `lib/mock-data.ts`, compatible con los mismos tipos.
- `PostHogAdapter` — llama a `lib/posthog/*.ts`; aplica filtros post-fetch en memoria.

**Regla:** toda query de datos pasa por el adapter. Nunca llamar a `lib/posthog/*.ts` directamente desde `app/`.

**Filtros notables:**
- `service` — semántica ampliada: `session.service === X OR events[].service === X`. Consistente con cómo `getServiceSummaries()` agrega por evento. No simplificar. Ver `data-flow-and-adapter.md §15.1`.
- `content=__missing__` — sentinel para "Sin anuncio" (`utm_content` y `ad_id` vacíos). Ver `data-flow-and-adapter.md §15.5`.

→ Documentación completa: `docs/architecture/data-flow-and-adapter.md`

---

### Capa 5 — Server Components (app/)

**Rol:** renderizado de páginas; orquestación de llamadas al adapter; streaming con Suspense.

**Produce:** HTML con datos. Toda la lógica de negocio ocurre aquí, no en el cliente.

**Fuente de verdad para:** qué datos se muestran en cada vista y con qué filtros.

**No hace:**
- No llama a PostHog directamente.
- No expone credenciales al cliente.
- No tiene estado persistente entre requests (server components son stateless).

**Patrón:** `force-dynamic` + `Suspense` + fallback de loading en todas las páginas con `searchParams`. Ver `data-flow-and-adapter.md §11`.

---

### Capa 6 — UI (componentes cliente)

**Rol:** interactividad: player de grabaciones, navegación, formularios de filtro.

**Produce:** experiencia de usuario.

**No hace:**
- No llama a PostHog API directamente.
- No tiene acceso a API keys.
- No genera `visitor_id`, `session_id` ni `event_id`.

**Componente crítico:** `RRWebPlayer.tsx` — hace `GET /api/recordings/{id}/snapshots` al servidor, que a su vez llama a PostHog con la API key privada. La key nunca llega al cliente.

---

## Fuente de verdad por tipo de dato

| Dato | Fuente | Notas |
|---|---|---|
| `visitor_id` | `breeze-scripts.js` | Generado en cliente, almacenado en `localStorage` |
| `session_id` | `breeze-scripts.js` | Generado en cliente, almacenado en `sessionStorage` |
| `event_id` | `breeze-scripts.js` | Por evento de intención |
| UTMs y campaign IDs | URL capturada por `breeze-scripts.js` | Vacíos en tráfico directo — normal |
| `source` | Inferido de `utm_medium`/`utm_source` | No es campo directo de PostHog |
| `intent_level` | Inferido de eventos: `whatsapp_click`=Alta, `service_click`=Media, else=Baja | No viene de PostHog |
| `duration` de sesión | PostHog Sessions API | Null en datos reales actuales |
| Eventos históricos | PostHog Events API | Por `distinct_id` = `visitor_id` |
| Grabaciones | PostHog Recordings API | Tiempo real; R2 es futura optimización |
| `recording.status` | PostHog Recordings API cruzada con `person.properties.session_id` | Puede faltar si PostHog no devuelve `session_id` |
| Agregados (campañas, servicios, dashboard) | HogQL (PostHog) | Caché golden 900s |

---

## Lo que NO existe en V0 y no debe inventarse

| Dato | Fase en que llega |
|---|---|
| Leads identificados (nombre, teléfono, correo) | Fase 2 |
| Pipeline comercial, cotizaciones, estados de venta | Fase 3 |
| Revenue, ROAS, CPA, costo de campaña | Fase 3 |
| Análisis de llamadas, transcripción | Fase 4 |
| Recomendaciones automáticas de campaña | Fase 5 |
| Multi-tenant real, autenticación, onboarding | Fase 6 |
| Integración Meta Ads API directa | Fase 5+ |
| n8n / CAPI / automatizaciones de seguimiento | Fase 2+ |

→ Fases completas: `docs/product/phases.md`

---

## Cómo se relacionan las capas en casos de uso concretos

### Caso: usuario abre `/sesiones?service=frenos`

```
Browser → GET /sesiones?service=frenos
  → app/sesiones/page.tsx (server component)
  → getAdapter().listSessions(workspaceId, { service: "frenos" })
  → PostHogAdapter.listSessions()
  → lib/posthog/hogql.ts: runHogQL() → PostHog HogQL API
  → filtra post-fetch: session.service === "frenos" OR events[].service === "frenos"
  → devuelve Session[]
  → renderiza tabla + nota "Incluye eventos de X" donde aplica
```

### Caso: usuario abre una grabación

```
Browser → RRWebPlayer.tsx → GET /api/recordings/{id}/snapshots
  → app/api/recordings/[recordingId]/snapshots/route.ts (server)
  → lib/posthog/recordings.ts: downloadSnapshots()
  → GET /session_recordings/{id}/snapshots/?source=blob_v2&...
  → descomprime gzip latin1 → parsea NDJSON
  → selecciona window_id con más eventos
  → devuelve { events, windows, currentWindow } al cliente
  → rrweb-player reproduce en el navegador
```

### Caso: dashboard carga métricas

```
Browser → GET /
  → app/page.tsx (server component)
  → getDashboardMetrics() → HogQL agregado (caché golden 900s)
  → getCampaignSummaries() → HogQL (caché golden 900s)
  → getServiceSummaries() → HogQL (caché golden 900s)
  → listSessions(limit: 6) → HogQL (caché live 60s)
  → getTrackingHealth() → HogQL (caché golden 900s)
  → renderiza dashboard
```

---

## Reglas de integridad del sistema

1. **`visitor_id → session_id → event_id`** es la cadena de identidad. Todo dato existe dentro de esta cadena o no tiene lugar en el sistema.
2. **La atribución pertenece a la sesión.** Una sesión no hereda UTMs de sesiones anteriores del mismo visitante.
3. **PostHog API solo en servidor.** Nunca en `"use client"` ni en `fetch` del navegador.
4. **Todo pasa por DataAdapter.** No importar `lib/posthog/*.ts` directamente desde `app/`.
5. **No mezclar datos reales con inferencias sin dejar claro cuál es cuál.** `source` e `intent_level` son inferidos — no vienen de PostHog como campos directos.
6. **El sentinel `__missing__` no es texto de negocio.** Representa ausencia técnica de `utm_content` y `ad_id`. La UI muestra "Sin anuncio"; los filtros y URLs usan `__missing__`.
