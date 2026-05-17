# BreezeMobile Flow Intelligence

Plataforma de inteligencia de visitantes anónimos para sitios web. Conecta comportamiento, atribución de campañas, grabaciones de sesión y señales de intención en un perfil unificado por visitante.

**No es** un CRM, un dashboard genérico de analytics, ni un panel de ventas. Es un sistema de inteligencia operativa del journey digital antes de la conversión.

---

## Estado actual

Fase 1 activa — interfaz de visitantes anónimos con datos reales de PostHog.

→ Ver estado detallado: `docs/product/current-state.md`

---

## Cómo correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Sin variables de entorno configuradas, la app corre con datos mock (misma estructura que PostHog, sin credenciales).

### Validar lint y build

```bash
npm run lint
npm run build
```

---

## Variables de entorno

Crea `.env.local` en la raíz del proyecto (está en `.gitignore`, nunca se commitea):

```bash
# Fuente de datos — "mock" (default) o "posthog"
DATA_SOURCE=posthog

# PostHog — solo requerido con DATA_SOURCE=posthog
POSTHOG_PROJECT_ID=415134
POSTHOG_API_KEY=phx_...        # Personal API Key — nunca exponer en frontend
POSTHOG_HOST=https://us.i.posthog.com

# Workspace (opcional — default: "breezemobile")
WORKSPACE_ID=breezemobile

# R2 storage (opcional — sin esto las grabaciones funcionan en tiempo real)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=breezemobile-recordings

# Revalidación de caché golden (opcional)
REVALIDATE_SECRET=
```

**⚠️ `POSTHOG_API_KEY` (`phx_...`) es una API key privada con acceso completo a PostHog. Nunca en cliente ni en repositorio.**

---

## Fuentes de datos

| Fuente | Rol | Estado |
|---|---|---|
| `breeze-scripts.js` (sitio HubSpot) | Genera `visitor_id`, `session_id`, `event_id`; captura UTMs; envía a dataLayer y PostHog | Activo |
| PostHog | Fuente principal V0: eventos, sesiones, grabaciones rrweb | Activo con `DATA_SOURCE=posthog` |
| GTM / dataLayer | Orquestación de etiquetas, validación de contrato; activa Meta Pixel en `whatsapp_click` | Activo en sitio |
| Mock (`lib/mock-data.ts`) | Datos simulados con misma estructura que el adapter real | Default sin credenciales |
| Cloudflare R2 | Almacenamiento propio de grabaciones (menor latencia) | Implementado, no activo |

→ Mapa completo del sistema: `docs/architecture/system-map.md`

---

## Rutas principales

| Ruta | Vista |
|---|---|
| `/` | Resumen general — KPIs, sesiones recientes, campaña/servicio top, alertas de tracking |
| `/sesiones` | Lista filtrable de todas las sesiones |
| `/visitantes/[visitorId]` | Visitor Intelligence — perfil completo con tabs |
| `/grabaciones` | Explorer de grabaciones, filtrable por servicio |
| `/campanas` | Tabla comparativa por dimensión de atribución |
| `/servicios` | Cards por servicio con mini-funnel |
| `/eventos` | Lista cruda de eventos por tipo |
| `/tracking` | Diagnóstico técnico de salud del tracking |

---

## Arquitectura resumida

```
Sitio HubSpot + breeze-scripts.js
  → visitor_id / session_id / event_id
  → dataLayer → GTM → Meta Pixel
  → PostHog (events + recordings)
        ↓
  PostHog API  [solo servidor]
        ↓
  DataAdapter  (lib/data/adapter.ts)
  ├── MockAdapter      DATA_SOURCE=mock
  └── PostHogAdapter   DATA_SOURCE=posthog
        ↓
  Server Components  (app/)
        ↓
  UI  (Next.js App Router + Tailwind)
```

Todo acceso a PostHog ocurre **server-side**. Las API keys nunca llegan al cliente.

Las páginas usan `DataAdapter` — nunca llaman a PostHog directamente.

→ Detalle completo: `docs/architecture/data-flow-and-adapter.md`
→ Grabaciones (blob_v2, window_id, gzip latin1): `docs/architecture/recordings.md`

---

## Documentos — orden de lectura recomendado

Para entrar al proyecto sin contexto previo:

| # | Documento | Por qué |
|---|---|---|
| 1 | `docs/development/ai-handoff-guide.md` | Reglas críticas condensadas para IA o dev nuevo |
| 2 | `docs/product/current-state.md` | Qué funciona hoy, qué falta, qué está en producción |
| 3 | `docs/product/interface-map-v1.md` | Mapa de vistas, principios, qué NO construir |
| 4 | `docs/architecture/system-map.md` | Cómo fluyen los datos de punta a punta |
| 5 | `docs/tracking/tracking-contract.md` | Eventos, payloads, campos — fuente de verdad |
| 6 | `docs/architecture/data-flow-and-adapter.md` | DataAdapter, HogQL, filtros, caché, paginación |
| 7 | `docs/architecture/recordings.md` | Solo si tocas replay, grabaciones o rrweb |
| 8 | `docs/product/phases.md` | Fases del producto — antes de agregar cualquier feature |
| 9 | `docs/development/change-protocol.md` | Cómo documentar cambios |
| 10 | `docs/development/where-to-change-what.md` | Guía de mantenimiento por área |

---

## Reglas críticas

Estas reglas no cambian sin autorización explícita:

**Tracking:**
- Los nombres de eventos `page_view_custom`, `service_click`, `whatsapp_click` no se modifican.
- `visitor_id`, `session_id`, `event_id` no se cambian ni se regeneran de forma distinta.
- La atribución pertenece a la sesión — no se hereda entre sesiones del mismo visitante.
- No se envía PII a PostHog, GTM, dataLayer ni Meta Pixel.

**Semántica de negocio:**
- `whatsapp_click` = señal de intención anónima. Nunca lead confirmado, venta ni revenue.
- No mostrar ventas, revenue ni ROAS sin datos reales de Fase 3.
- No convertir la plataforma en CRM.

**Técnico:**
- Las API keys de PostHog (`phx_...`) solo existen en servidor. Nunca en cliente.
- Toda query de datos pasa por `DataAdapter`. No llamar PostHog directamente desde componentes.
- El filtro `service` usa semántica ampliada: `session.service === X OR events[].service === X`. No simplificar. Ver `docs/architecture/data-flow-and-adapter.md §15.1`.
- El sentinel `__missing__` representa "Sin anuncio". No convertirlo en texto literal.
- Los links de campaña a sesiones usan `?campaign=`, `?source=`, `?medium=`, `?content=`. No `?q=` para navegación programática.

```
whatsapp_click ≠ lead confirmado
whatsapp_click ≠ venta
whatsapp_click ≠ revenue
```
