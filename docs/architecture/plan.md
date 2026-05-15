# BreezeMobile Flow Intelligence — Plan maestro de arquitectura

**Versión:** 1.1
**Fecha:** Mayo 2026
**Estado:** Activo — documento vivo

---

## 1. Visión

BreezeMobile Flow Intelligence es una plataforma SaaS que conecta
el comportamiento anónimo de visitantes en un sitio web con la
atribución de campañas publicitarias, grabaciones de sesión y
señales de intención.

El modelo de negocio es de implementación + plataforma: se instala
el sistema de tracking en el sitio del cliente y se entrega acceso
a la plataforma donde el cliente puede ver todo lo que pasa después
de que alguien hace clic en un anuncio.

La plataforma no es un dashboard. Es un sistema de inteligencia de
visitantes que en fases posteriores conectará con CRM, grabaciones
de llamadas, análisis de IA y pipeline comercial.

Referencia de producto: Gong, pero para el journey digital previo a
la conversión, no para llamadas de ventas.

---

## 2. Principios inamovibles

- `visitor_id → session_id → event_id` es la cadena de identidad.
  Ningún dato existe fuera de esta cadena.
- La atribución pertenece a la sesión, nunca al visitante.
  Una sesión no hereda UTMs de sesiones anteriores.
- `whatsapp_click` es señal de alta intención, no lead confirmado,
  no venta, no revenue.
- La UI nunca inventa datos. Si un campo no existe, lo dice.
- Las API keys de PostHog solo existen en servidor. Nunca en cliente.
- No se almacena ni procesa PII en V0.
- Cada workspace de cliente es un silo de datos independiente.

---

## 3. Modelo multi-tenant

Cada cliente de la plataforma es un **workspace**.

El workspace agrupa:

- su configuración de PostHog (project_id, api_key)
- su configuración de GTM (container_id)
- su configuración de Meta Pixel (pixel_id)
- su configuración de object storage (bucket, prefijo)
- sus visitantes, sesiones, eventos y grabaciones
- sus usuarios con acceso a la plataforma

### Regla central

Toda query, toda función del adapter, toda ruta de la app debe
estar scopeada a un `workspace_id`.

```
getVisitorProfile(workspaceId, visitorId)
getVisitorSessions(workspaceId, visitorId)
getSessionEvents(workspaceId, sessionId)
getSessionRecording(workspaceId, sessionId)
getTrackingHealth(workspaceId)
```

Nunca existe una query sin workspace scope.

### Modelo de workspace

```ts
type Workspace = {
  workspace_id: string
  name: string
  posthog_project_id: string
  posthog_api_key: string        // server-side only, encrypted at rest
  gtm_container_id: string
  meta_pixel_id: string
  storage_bucket: string         // bucket de R2/S3 para grabaciones
  storage_prefix: string         // prefijo por workspace: "ws_abc/"
  created_at: string
  plan: 'trial' | 'active' | 'suspended'
}
```

En V0 hay un solo workspace (BreezeMobile). La estructura multi-tenant
existe desde el inicio para no tener que reescribir cuando llegue el
segundo cliente.

---

## 4. Modelo de datos interno

### 4.1 Visitor

```ts
type Visitor = {
  workspace_id: string
  visitor_id: string
  first_seen: string
  last_seen: string
  session_count: number
  sessions: string[]
}
```

### 4.2 Session

```ts
type Session = {
  workspace_id: string
  visitor_id: string
  session_id: string
  source: string
  medium: string
  service: string
  page_path: string
  page_title: string
  page_url: string
  started_at: string
  duration: number | null
  intent_level: 'high' | 'medium' | 'low' | 'unknown'
  attribution: Attribution
  recording: RecordingRef | null
  events: TrackingEvent[]
}
```

### 4.3 TrackingEvent

```ts
type TrackingEvent = {
  workspace_id: string
  event_id: string
  event_name: 'page_view_custom' | 'service_click' | 'whatsapp_click'
  visitor_id: string
  session_id: string
  timestamp: string
  page_path: string
  page_title: string
  service: string
  cta_text: string
  cta_location: string
  link_url: string
  source: string
  attribution: Attribution
  payload: Record<string, string>
}
```

### 4.4 RecordingRef

```ts
type RecordingRef = {
  workspace_id: string
  recording_id: string           // ID de PostHog
  session_id: string             // nuestro session_id
  visitor_id: string
  provider: 'posthog'
  status: 'available' | 'missing' | 'pending' | 'processing' | 'not_supported'
  duration: number | null
  started_at: string
  storage_key: string | null     // clave en R2/S3: "ws_abc/recordings/rec_xyz.json"
  captured_at: string            // cuando lo recibimos via webhook
}
```

El campo `storage_key` apunta a los eventos rrweb almacenados en
object storage. Es `null` mientras el estado es `pending` o
`processing`.

### 4.5 Attribution

```ts
type Attribution = {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  campaign_id: string
  adset_id: string
  ad_id: string
  fbclid: string
  fbp: string
  fbc: string
  referrer: string
}
```

### 4.6 Estados de campos faltantes

```ts
type FieldStatus =
  | 'ok'
  | 'missing'               // campo esperado que no llegó
  | 'empty'                 // campo existe pero vacío
  | 'not_applicable'        // no aplica para esta sesión
  | 'pending_integration'   // fuente no conectada aún
  | 'inconsistent'          // conflicto entre fuentes
```

---

## 5. Estrategia de grabaciones

> **Implementación actual documentada en:** `docs/architecture/recordings.md`
> Este documento describe la arquitectura objetivo. Lo que está
> desplegado hoy difiere en el flujo de descarga (tiempo real vs R2).

### Principio

Los "videos" de PostHog no son archivos de video. Son streams de
eventos del DOM capturados por la librería open source **rrweb**
(record and replay the web). Esto permite descargarlos, almacenarlos
en nuestro propio storage, y reproducirlos con `rrweb-player` sin
depender de PostHog en tiempo de visualización.

La plataforma es dueña de los datos. El cliente ve el replay
directamente en nuestra UI, sin redirecciones a PostHog.

### Por qué no iframe de PostHog

- Requiere que el usuario esté logueado en PostHog.
- No funciona en multi-tenant (cada cliente no tiene cuenta PostHog).
- No permite personalizar la experiencia del player.
- Dependencia de disponibilidad de PostHog en tiempo de visualización.

### Flujo completo de grabaciones

```
1. Visitante navega el sitio del cliente
     → PostHog graba la sesión con rrweb internamente

2. La sesión termina
     → PostHog dispara webhook a nuestra plataforma
     → POST /api/webhooks/posthog/recording-ended

3. El webhook handler:
     a. Valida el payload (workspace, recording_id, distinct_id)
     b. Crea RecordingRef con status: 'processing'
     c. Encola un job de descarga (o lo ejecuta directamente)

4. El job de descarga:
     a. Llama a PostHog Snapshots API:
        GET /api/projects/{project_id}/session_recordings/{recording_id}/snapshots/
     b. Descarga los eventos rrweb (JSON comprimido)
     c. Sube al object storage con clave:
        {workspace_prefix}/recordings/{recording_id}.json
     d. Actualiza RecordingRef:
        status: 'available', storage_key: '...', duration: N

5. El cliente abre el replay en la plataforma
     a. El servidor lee RecordingRef de la DB
     b. Genera una URL firmada del object storage (tiempo limitado)
     c. El frontend carga los eventos rrweb desde esa URL
     d. rrweb-player los reproduce directamente en la UI
```

### PostHog Snapshots API

```
GET /api/projects/{project_id}/session_recordings/{recording_id}/snapshots/
Authorization: Bearer {posthog_api_key}

Respuesta: stream de eventos rrweb en formato NDJSON o JSON array
```

### Object storage

Proveedor recomendado: **Cloudflare R2**

- Sin costo de egress (importante cuando los clientes ven muchos replays)
- Compatible con S3 API (el código es portable)
- Integración directa con Next.js en Cloudflare

Estructura de keys:

```
{workspace_id}/recordings/{recording_id}.json
```

Las URLs de acceso son firmadas con expiración corta (15 min).
Nunca se expone el bucket directamente.

### rrweb-player en la UI

```
npm install rrweb-player
```

El player es un componente web estándar. En la UI de la plataforma:

1. El servidor genera una URL firmada del storage.
2. El cliente descarga el JSON de eventos rrweb.
3. `rrweb-player` los reproduce con controles de:
   - Play / pause
   - Velocidad (0.5x, 1x, 2x, 4x)
   - Timeline con marcadores de eventos
   - Saltar a timestamp específico

Los eventos del tracking propio (page_view, service_click,
whatsapp_click) se muestran sincronizados en el timeline del player.

### Estados del player en la UI

| Estado | Significado | UI |
|---|---|---|
| `pending` | Sesión en curso, aún no terminó | "Grabación en proceso" |
| `processing` | Webhook recibido, descargando | "Procesando grabación" |
| `available` | Listo para reproducir | Player activo |
| `missing` | No hay grabación asociada | "Sin grabación disponible" |
| `not_supported` | La fuente no permite replay | "No disponible" |

---

## 6. Fuente de verdad por tipo de dato

| Dato | Fuente | Estrategia |
|---|---|---|
| `visitor_id`, `session_id`, `event_id` | Tracking propio | Generado en breeze-scripts.js |
| UTMs y campaign IDs | URL capturada por tracking propio | Propiedades en PostHog |
| Eventos históricos | PostHog Events API | Sync por visitor_id |
| Sesiones | PostHog Persons API + tracking propio | Agrupadas por distinct_id |
| Grabaciones eventos rrweb | PostHog Snapshots API → nuestro storage | Descarga en session end |
| Grabaciones metadata | DB propia (RecordingRef) | Actualizada por webhook + job |
| Replay en UI | Object storage (R2/S3) | URL firmada, rrweb-player |
| Tracking Health | GTM/dataLayer + PostHog | Tiempo real bajo demanda |
| Perfil unificado | Nuestra plataforma | Composición de todo lo anterior |

---

## 7. Adapter layer — diseño

### Ubicación

```
lib/
  posthog/
    client.ts          // cliente HTTP server-side con workspace scope
    events.ts          // queries de eventos
    persons.ts         // queries de visitantes/perfiles
    recordings.ts      // descarga de snapshots rrweb
    normalizer.ts      // PostHog response → modelo interno
  storage/
    client.ts          // cliente R2/S3
    recordings.ts      // upload/download de eventos rrweb
    signed-urls.ts     // generación de URLs firmadas
  data/
    mock/              // mock data actual (reemplazable)
    adapter.ts         // interfaz unificada: mock o real según env
    types.ts           // todos los tipos internos
```

### Interfaz del adapter

```ts
interface DataAdapter {
  getVisitorProfile(workspaceId: string, visitorId: string): Promise<Visitor>
  getVisitorSessions(workspaceId: string, visitorId: string): Promise<Session[]>
  getSessionEvents(workspaceId: string, sessionId: string): Promise<TrackingEvent[]>
  getSessionRecording(workspaceId: string, sessionId: string): Promise<RecordingRef | null>
  getRecordingStreamUrl(workspaceId: string, recordingId: string): Promise<string | null>
  listSessions(workspaceId: string, filters: SessionFilters): Promise<Session[]>
  listEvents(workspaceId: string, filters: EventFilters): Promise<TrackingEvent[]>
  getTrackingHealth(workspaceId: string): Promise<TrackingHealth[]>
  getCampaignSummaries(workspaceId: string): Promise<CampaignSummary[]>
  getServiceSummaries(workspaceId: string): Promise<ServicePageSummary[]>
}
```

`getRecordingStreamUrl` devuelve una URL firmada con expiración corta
apuntando a los eventos rrweb en el storage. El frontend la usa para
cargar el player sin exponer credenciales.

### Selección de adapter

```ts
const adapter: DataAdapter =
  process.env.DATA_SOURCE === 'posthog'
    ? new PostHogAdapter()
    : new MockAdapter()
```

El switch es por variable de entorno. No hay condicionales esparcidos
en el código de la app.

---

## 8. Cómo se consulta PostHog

### Events API

Para obtener eventos históricos por `distinct_id` (= visitor_id):

```
GET /api/projects/{project_id}/events/
  ?distinct_id={visitor_id}
  &event=page_view_custom,service_click,whatsapp_click
  &limit=100
```

### Persons API

Para obtener perfil y lista de sesiones por `distinct_id`:

```
GET /api/projects/{project_id}/persons/
  ?distinct_id={visitor_id}
```

### Snapshots API (grabaciones)

Para descargar los eventos rrweb de una sesión:

```
GET /api/projects/{project_id}/session_recordings/{recording_id}/snapshots/
```

No se llama en tiempo real desde la UI. Se llama una vez cuando
llega el webhook de session end y el resultado se almacena en R2/S3.

### HogQL Query API

Para queries de agregación (campañas, servicios):

```
POST /api/projects/{project_id}/query/
{
  "query": {
    "kind": "HogQLQuery",
    "query": "SELECT utm_campaign, count() FROM events WHERE ..."
  }
}
```

### Relación session_id interno ↔ replay de PostHog

Condición ideal: la propiedad `session_id` llega en los eventos
registrados por `posthog.register()` en `breeze-scripts.js`, por lo
que el replay de PostHog tiene esa propiedad adjunta y se puede
cruzar directamente.

Fallback: si la propiedad no está disponible en el replay, se cruza
por `distinct_id` + ventana de timestamp (±5 min desde el evento más
cercano de la sesión). Esto se valida con datos reales antes de
implementar el adapter definitivo.

---

## 9. Caché y error handling

### Caché

| Dato | Estrategia |
|---|---|
| Perfil de visitante | `unstable_cache` revalidate 60s (capa live) |
| Lista de sesiones | `unstable_cache` revalidate 60s (capa live) |
| Eventos de sesión | `unstable_cache` revalidate 60s (capa live) |
| Recording metadata | DB propia, no se re-consulta a PostHog |
| Eventos rrweb | Object storage, no se re-descargan de PostHog |
| URL firmada del replay | Generada por request, TTL 15 min |
| Dashboard metrics | `unstable_cache` revalidate 900s, tag `"golden"` |
| Campaign summaries | `unstable_cache` revalidate 900s, tag `"golden"` |
| Service summaries | `unstable_cache` revalidate 900s, tag `"golden"` |
| Tracking Health | `unstable_cache` revalidate 900s, tag `"golden"` — solo con `DATA_SOURCE=posthog`; mock sin caché |

Ver `docs/architecture/data-flow-and-adapter.md §3` para detalles de las
dos capas de caché y cómo invalidar la capa golden con `revalidateTag("golden")`.

### Error handling

Si PostHog no responde o devuelve error:

- El perfil muestra los datos ya almacenados en DB.
- Las secciones sin datos muestran estado `pending_integration`.
- Tracking Health muestra alerta "Fuente no disponible".
- La UI no lanza error 500 al usuario final.
- El error se loguea server-side con contexto de workspace_id.

Si el objeto de grabación no está en storage:

- El player muestra estado `missing` o `processing` según el caso.
- No bloquea el resto del perfil del visitante.

---

## 10. Estructura de archivos propuesta

```
/app
  /(auth)
    /login/page.tsx
    /onboarding/page.tsx
  /[workspaceId]/
    /page.tsx                                 // dashboard
    /visitantes/
      /page.tsx
      /[visitorId]/page.tsx                   // perfil de visitante
    /sesiones/page.tsx
    /eventos/page.tsx
    /campanas/page.tsx
    /servicios/page.tsx
    /grabaciones/
      /page.tsx
      /[recordingId]/page.tsx                 // player de replay
    /tracking/page.tsx
    /configuracion/page.tsx
  /admin/
    /workspaces/page.tsx
  /api/
    /webhooks/
      /posthog/
        /recording-ended/route.ts             // webhook de session end
    /recordings/
      /[recordingId]/stream-url/route.ts      // genera URL firmada

/components
  /intelligence/
  /recordings/
    /ReplayPlayer.tsx                         // wrapper de rrweb-player
    /ReplayTimeline.tsx                       // eventos sincronizados
    /RecordingStatus.tsx                      // estados pending/missing/etc
  /campaigns/
  /tracking/
  /shared/
  /layout/

/lib
  /posthog/
    /client.ts
    /events.ts
    /persons.ts
    /recordings.ts
    /normalizer.ts
  /storage/
    /client.ts
    /recordings.ts
    /signed-urls.ts
  /data/
    /mock/
    /adapter.ts
    /types.ts
  /auth/
  /labels.ts
  /analytics.ts

/docs
  /tracking/
    /tracking-contract.md
    /data-unification.md
  /product/
    /project-overview.md
    /phases.md
    /scope-and-non-goals.md
    /current-state.md
  /architecture/
    /plan.md                                  // este documento
```

---

## 11. Decisiones técnicas resueltas

| Decisión | Resolución |
|---|---|
| Cómo consultar PostHog | Events API + Persons API + HogQL para agregaciones |
| Cómo cruzar replay con sesión | Propiedad `session_id` registrada via `posthog.register()`, fallback por timestamp |
| Almacenamiento de grabaciones | Eventos rrweb descargados de PostHog → Cloudflare R2 |
| Player de replay | `rrweb-player` (open source, componente React) |
| Acceso al replay en UI | URL firmada con TTL corto desde R2, nunca bucket público |
| Cuándo descargar grabaciones | Webhook de PostHog en session end, no en tiempo real |
| Dónde vive el adapter | `lib/posthog/` + `lib/storage/` + `lib/data/adapter.ts` |
| Heatmaps en V0 | Solo link externo a PostHog, sin embed |
| Caché | Next.js cache por tipo de dato, ver sección 9 |
| Multi-tenant | `workspace_id` en toda query desde V0 |
| Auth | Requerida antes del segundo cliente |
| Campos obligatorios | `visitor_id`, `session_id`, `event_name`, `timestamp`, `page_path` |

---

## 12. Qué nunca debe inferir la plataforma

- venta, revenue, ROAS
- lead confirmado desde `whatsapp_click`
- campaña si la sesión no tiene UTM o campaign_id
- grabación si el webhook no llegó o el job falló
- identidad personal del visitante
- relación entre sesiones de visitantes distintos
- cita agendada, pago recibido, cotización enviada

```
whatsapp_click = señal de alta intención
whatsapp_click ≠ lead
whatsapp_click ≠ venta
```

---

## 13. Fases de desarrollo

### Fase 0 — Tracking (completada)

- breeze-scripts.js en producción
- PostHog recibiendo eventos reales
- GTM configurado con las 3 etiquetas
- Meta Pixel activo con evento Lead

### Fase 1 — Plataforma base (en curso)

- UI con mock data (estructura actual)
- Adapter layer mock → real
- Webhook de session end de PostHog
- Job de descarga de snapshots rrweb a R2
- Conexión a PostHog API real (Events + Persons)
- Player de replay con rrweb-player
- Validación del contrato de tracking con datos reales
- Un solo workspace (BreezeMobile)

### Fase 2 — Multi-tenant real

- Auth (NextAuth o equivalente)
- Workspace model en DB
- Onboarding de nuevo cliente
- Aislamiento completo de datos por workspace
- Storage por workspace en R2
- Admin panel básico

### Fase 3 — Lead capture

- Integración con formularios del sitio del cliente
- Captura de datos personales con consentimiento explícito
- Visitor profile enriquecido con lead data cuando existe

### Fase 4 — Pipeline comercial

- Cotizaciones y oportunidades
- Conexión con CRM del cliente
- Seguimiento de estado comercial

### Fase 5 — Llamadas e IA

- Grabación de llamadas telefónicas
- Transcripción automática
- Análisis de intención con IA
- Conexión entre llamada y visitor profile

### Fase 6 — Intelligence

- Recomendaciones de campaña basadas en datos
- Alertas automáticas de tracking health
- Análisis comparativo entre industrias (anonimizado)

---

## 14. Checklist antes de conectar datos reales

- [ ] `visitor_id` llega a PostHog como `distinct_id`
- [ ] `session_id` llega como propiedad en todos los eventos via `posthog.register()`
- [ ] `event_id` llega en eventos de intención
- [ ] `page_view_custom` llega a PostHog y dataLayer
- [ ] `service_click` llega a PostHog y dataLayer
- [ ] `whatsapp_click` llega a PostHog y dataLayer
- [ ] GTM dispara Meta Pixel en `whatsapp_click`
- [ ] El replay de PostHog tiene `session_id` como propiedad consultable
- [ ] El webhook de recording-ended está recibiendo eventos de PostHog
- [ ] El job de descarga sube snapshots rrweb a R2 correctamente
- [ ] Las URLs firmadas de R2 cargan en rrweb-player sin error
- [ ] Las sesiones sin UTM no heredan campaña anterior
- [ ] Los campos faltantes aparecen en Tracking Health
- [ ] API keys de PostHog solo en variables de entorno server-side
- [ ] Credenciales de R2 solo en variables de entorno server-side
- [ ] No hay PII en ningún evento
- [ ] El adapter selecciona mock vs real por variable de entorno
