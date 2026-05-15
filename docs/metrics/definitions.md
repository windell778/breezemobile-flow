# Catálogo de métricas — BreezeMobile Flow

_Última actualización: 2026-05-15_

Este documento es la fuente de verdad para todas las métricas de la
plataforma. Cada métrica tiene: definición, fórmula exacta, fuente de
datos, nivel de frescura del caché, y advertencias semánticas.

Si hay conflicto entre este documento y código o documentación secundaria,
este documento gana para cuestiones de definición y semántica.

---

## Principios generales

- Las fórmulas canónicas viven en `lib/metrics.ts`. Nunca calcular tasas inline.
- `whatsapp_click` es una señal de alta intención anónima. Nunca llamarlo lead, venta o revenue.
- Datos **live** (caché 60 s): sesiones, eventos, visitor intelligence.
- Datos **golden** (caché 900 s): dashboard totals, campañas, servicios.
- Los conteos de eventos (`whatsappClicks`, `serviceClicks`) son brutos — una sesión puede contribuir múltiples veces.
- Los conteos únicos (`sessions`, `visitors`) usan `uniq()` en HogQL — no duplican.

---

## Métricas del dashboard (`DashboardMetrics`)

Fuente: `getDashboardMetricsHogQL` → `_cachedDashboardMetrics`  
Frescura: **golden, 900 s**. Refleja la última vez que se populó la caché, no el request actual.  
Invalidación: `POST /api/revalidate` con `Authorization: Bearer <REVALIDATE_SECRET>`.

### `sessions`

| Campo | Valor |
|---|---|
| Definición | Número de sesiones únicas capturadas en el proyecto PostHog |
| Fórmula HogQL | `uniq(properties.session_id)` sobre eventos filtrados |
| Fuente | PostHog Events API via HogQL |
| Tipo | Entero, sin decimales |
| Advertencia | Cuenta sesiones con al menos un evento trackeable. Sesiones sin ningún evento no aparecen. |

### `visitors`

| Campo | Valor |
|---|---|
| Definición | Número de visitantes anónimos únicos |
| Fórmula HogQL | `uniq(properties.visitor_id)` sobre eventos filtrados |
| Fuente | PostHog Events API via HogQL |
| Tipo | Entero, sin decimales |
| Advertencia | `visitor_id` es generado en el browser — un mismo usuario en distintos dispositivos o con cookies borradas cuenta como visitantes distintos. No es identidad real. |

### `whatsappClicks`

| Campo | Valor |
|---|---|
| Definición | Total de eventos `whatsapp_click` registrados |
| Fórmula HogQL | `countIf(event = 'whatsapp_click')` |
| Fuente | PostHog Events API via HogQL |
| Tipo | Entero, conteo bruto de eventos |
| Advertencia | **No es conteo de sesiones únicas con WhatsApp.** Una sesión puede generar múltiples eventos. `whatsappClicks > sessions` es posible y no indica error. No representa leads, ventas ni revenue. |
| Label en UI | "WhatsApp clicks" o "Señales de intención" — nunca "conversiones" ni "leads" |

### `serviceClicks`

| Campo | Valor |
|---|---|
| Definición | Total de eventos `service_click` registrados |
| Fórmula HogQL | `countIf(event = 'service_click')` |
| Fuente | PostHog Events API via HogQL |
| Tipo | Entero, conteo bruto de eventos |
| Advertencia | Conteo bruto — una sesión puede generar múltiples `service_click`. Señal de interés en servicio, previa a la intención de WhatsApp. |

### `recordings`

| Campo | Valor |
|---|---|
| Definición | Número de grabaciones disponibles en PostHog para las sesiones recientes |
| Fuente | REST API de PostHog `/session_recordings/?limit=200` |
| Tipo | Entero — tamaño del map devuelto por `fetchRecordingsMap` |
| Advertencia | Limitado a las 200 grabaciones más recientes de PostHog. No refleja el total histórico. No usa HogQL (la tabla `session_recordings` no está disponible en PostHog Cloud). |

### `replayRate`

| Campo | Valor |
|---|---|
| Definición | Porcentaje de sesiones que tienen grabación disponible en PostHog |
| Fórmula | `replayRate(recordings, sessions)` → `round(recordings / sessions * 100)` |
| Función canónica | `lib/metrics.ts` → `replayRate()` |
| Tipo | Entero 0–100 (porcentaje) |
| Advertencia | `recordings` está limitado a 200 (ver arriba) — la tasa es una aproximación para sesiones recientes, no exactitud histórica. |

### `topCampaign`

| Campo | Valor |
|---|---|
| Definición | La campaña con más `whatsapp_clicks` en el período |
| Fuente | `getCampaignSummariesHogQL` → primer elemento del array ordenado |
| Tipo | `CampaignSummary \| null` |
| Advertencia | Basado en `utm_campaign` del primer evento de la sesión. Sesiones sin UTM no aparecen en campañas. |

### `topService`

| Campo | Valor |
|---|---|
| Definición | El servicio (página) con más sesiones |
| Fuente | `getServiceSummariesHogQL` → primer elemento del array ordenado |
| Tipo | `ServicePageSummary \| null` |
| Advertencia | Basado en `properties.service` del primer evento. |

### `cached_at`

| Campo | Valor |
|---|---|
| Definición | ISO timestamp de cuando se populó la caché golden de métricas |
| Fuente | `new Date().toISOString()` generado **dentro** de `_cachedDashboardMetrics` |
| Tipo | String ISO 8601 |
| Advertencia | Se congela con los datos — no representa el request actual. Si muestra "hace 0 min" en producción después de un reinicio, es normal; se actualizará en el siguiente ciclo de caché. En mock siempre es el tiempo del request porque MockAdapter no usa `unstable_cache`. |

---

## Métricas de campaña (`CampaignSummary`)

Fuente: `getCampaignSummariesHogQL`  
Frescura: **golden, 900 s**

| Métrica | Definición | Fórmula HogQL |
|---|---|---|
| `sessions` | Sesiones únicas por valor de dimensión UTM | `uniq(session_id)` |
| `page_views` | Vistas de página | `countIf(event = 'page_view_custom')` |
| `service_clicks` | Clics en servicios (bruto) | `countIf(event = 'service_click')` |
| `whatsapp_clicks` | Señales de alta intención (bruto) | `countIf(event = 'whatsapp_click')` |
| Tasa WA | `waRate(whatsappClicks, sessions)` | Ver `lib/metrics.ts` |

La tasa WA en la tabla de campañas es `waRate(whatsappClicks, sessions)` — porcentaje de sesiones con al menos un `whatsapp_click` según el numerador bruto. No es comparable con tasas de conversión comerciales.

---

## Métricas de servicio (`ServicePageSummary`)

Fuente: `getServiceSummariesHogQL`  
Frescura: **golden, 900 s**

| Métrica | Definición | Fórmula HogQL |
|---|---|---|
| `sessions` | Sesiones únicas en esa página de servicio | `uniq(session_id)` |
| `page_views` | Vistas de página | `countIf(event = 'page_view_custom')` |
| `service_clicks` | Clics en ese servicio (bruto) | `countIf(event = 'service_click')` |
| `whatsapp_clicks` | Señales WA en esa página (bruto) | `countIf(event = 'whatsapp_click')` |
| `recordings` | Grabaciones disponibles para esas sesiones | Cruzado desde `fetchRecordingsMap` |

---

## Métricas de sesión (`Session`)

Fuente: `listSessionsHogQL` → construidas desde eventos  
Frescura: **live, 60 s**

| Campo | Definición | Cómo se calcula |
|---|---|---|
| `timestamp` | Inicio de la sesión | `min(event.timestamp)` del grupo |
| `duration` | Duración en segundos | `max - min` de timestamps. **Siempre `null` en PostHog real** — solo tiene valor en mock. |
| `source` | Canal de origen | Inferido de `utm_medium`/`utm_source` del primer evento. Valores: `"Meta Ads"`, `"Google Ads"`, `"Organic"`, `"Direct"`. |
| `intent_level` | Nivel de intención | Inferido: `whatsapp_click` → Alta, `service_click` → Media, else → Baja |
| `attribution` | Campos UTM | Del primer evento de la sesión (atribución al landing) |
| `recording` | Referencia a grabación | Cruzado desde `fetchRecordingsMap` — `null` si no hay grabación |

---

## Funciones canónicas (`lib/metrics.ts`)

| Función | Descripción |
|---|---|
| `replayRate(n, total)` | % de sesiones con grabación. Retorna 0 si `total === 0`. |
| `waRate(clicks, total)` | % de sesiones con WhatsApp click según conteo bruto. Retorna 0 si `total === 0`. |
| `validateMetrics(m)` | Chequeos de integridad. Retorna array de warnings (vacío = sano). |
| `timeAgo(iso)` | "hace X min/h" para mostrar frescura de caché en UI. |

---

## Lo que nunca se debe calcular sin datos reales

❌ Revenue, ROAS, costo por lead  
❌ Leads confirmados, pipeline, ventas  
❌ Tasa de conversión comercial (≠ tasa WA)  
❌ Cualquier métrica que implique resultados económicos reales  

Estas métricas requieren integración con Meta Ads API, CRM o sistema de pagos. No están en scope V0–V5.
