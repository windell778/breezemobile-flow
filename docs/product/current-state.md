# Current State

_Última actualización: 2026-05-14_

---

## 1. Fase actual

La plataforma está al final de **Fase 1 — Interfaz de visitantes anónimos**.

Fase 0 (tracking confiable) está parcialmente validada:
- Los eventos llegan a PostHog con los nombres correctos (`page_view_custom`, `service_click`, `whatsapp_click`).
- `visitor_id` y `session_id` están presentes en `properties` de cada evento.
- **Pendiente de validar**: que `utm_source`, `utm_medium`, `utm_campaign`, `campaign_id`, `adset_id`, `ad_id` lleguen en sesiones reales con UTMs (requiere una visita desde una URL con parámetros de campaña).

---

## 2. Lo que funciona hoy con DATA_SOURCE=posthog

| Módulo | Estado |
|---|---|
| Dashboard (`/`) | ✅ Datos reales: sesiones, visitantes, WhatsApp clicks, service clicks |
| Sesiones (`/sesiones`) | ✅ Lista sesiones reales de PostHog con filtros |
| Eventos (`/eventos`) | ✅ Lista eventos reales con conteos por tipo |
| Campañas (`/campanas`) | ✅ Carga desde listSessions, agrupa por dimensión |
| Servicios (`/servicios`) | ✅ Carga desde getServiceSummaries vía HogQL |
| Grabaciones (`/grabaciones`) | ✅ Carga sesiones reales, sin replay disponible aún |
| Tracking Health (`/tracking`) | ✅ Contenido estático de contrato, no queryable |
| Visitor Intelligence (`/visitantes/[id]`) | ✅ Carga resumen, sesiones, journey, eventos, atribución, técnico |
| Diagnóstico (`/api/diagnostics/posthog`) | ✅ Valida conexión PostHog en tiempo real |

---

## 3. Arquitectura de datos implementada

- **DataAdapter** (`lib/data/adapter.ts`): interfaz única. `DATA_SOURCE=posthog` activa PostHog; `mock` activa datos locales.
- **HogQL** (`lib/posthog/hogql.ts`): queries para listSessions, listEvents, getDashboardMetrics, getCampaignSummaries, getServiceSummaries. Filtra por `event IN ('page_view_custom', 'service_click', 'whatsapp_click')`.
- **Visitor events** (`lib/posthog/events.ts`): usa HogQL `WHERE properties.visitor_id = '${visitorId}'` — NO usa `distinct_id` de PostHog (que es un UUID interno diferente a nuestro visitor_id).
- **Visitor profile** (`lib/posthog/persons.ts`): construido desde eventos (first_seen, last_seen, session_count) — NO usa `/persons/` API de PostHog.
- **Recordings** (`lib/posthog/recordings.ts`): la consulta a `/session_recordings/` falla con 400 en el plan actual de PostHog. El error se maneja con `.catch()` — devuelve lista vacía sin crashear.
- **R2 storage** (`lib/storage/`): implementado pero vacío. Sin grabaciones almacenadas aún. `isStorageConfigured()` retorna false si las env vars están vacías.
- **Tipos canónicos** (`lib/data/types.ts`): fuente de verdad para todas las páginas y componentes. NO importar tipos desde `lib/mock-data`.

---

## 4. Campos que vienen nulos en datos reales actuales

| Campo | Estado | Causa probable |
|---|---|---|
| `properties.source` | Null | Breeze-scripts no lo guarda como property separada; se infiere de `utm_medium/utm_source` |
| `properties.utm_campaign` | Null en sesiones actuales | Tráfico directo sin UTMs — normal para visitas sin campaña |
| `properties.utm_source` | Null en sesiones actuales | Mismo motivo |
| `properties.intent_level` | Null | Se infiere de los eventos: whatsapp_click=Alta, service_click=Media, else Baja |
| Recording availability | Siempre "Sin grabacion" | `/session_recordings/` da 400; R2 vacío |

**Inferencias activas**: `source` e `intent_level` se calculan desde los eventos en `hogql.ts` y `normalizer.ts` — no dependen de fields de PostHog.

---

## 5. Lo que NO existe todavía

- Replay funcional (R2 no configurado, PostHog recordings API da 400)
- UTMs reales en datos — validar con una URL de campaña con parámetros
- Autenticación
- Multi-tenant real (workspace_id está fijo como "breezemobile")
- Base de datos propia
- Leads / contacto comercial (Fase 2)
- Revenue / ventas (Fase 3+)
- `whatsapp_click` NO es un lead confirmado — es señal anónima de alta intención

---

## 6. Próximos pasos recomendados (en orden)

1. **Validar UTMs con tráfico real de campaña** — crear una URL con `?utm_source=facebook&utm_medium=paid_social&utm_campaign=nombre` y visitar la web. Confirmar que los campos llegan a PostHog.
2. **Investigar el 400 de `/session_recordings/`** — verificar si el plan de PostHog permite acceder a recordings, y qué parámetros acepta la versión actual del endpoint.
3. **Configurar Cloudflare R2** — completar `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` en `.env.local` para activar replay.
4. **Webhook de PostHog** — configurar `POSTHOG_WEBHOOK_SECRET` y el endpoint `/api/webhooks/posthog/recording-ended` en el panel de PostHog para que las grabaciones se descarguen automáticamente al R2.

---

## 7. Cómo activar datos reales (resumen)

```bash
# .env.local debe contener:
DATA_SOURCE=posthog
POSTHOG_PROJECT_ID=415134
POSTHOG_API_KEY=phx_tu_personal_api_key   # nunca commitar
POSTHOG_HOST=https://us.i.posthog.com

# R2 (opcional — sin esto no hay replay):
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=breezemobile-recordings
```

El archivo `.env.local` está en `.gitignore` — nunca se commitea.

---

## 8. Datos reales observados (2026-05-14)

- 28 eventos `page_view_custom`
- 8 eventos `service_click`
- 5 eventos `whatsapp_click`
- 21 sesiones únicas
- 16 visitantes únicos
- Visitor Intelligence funcional para todos los `visitor_id` reales listados en `/sesiones`
