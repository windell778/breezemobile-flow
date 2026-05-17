# Guía de entrada para IA nueva — BreezeMobile Flow Intelligence

_Creado: 2026-05-17_

Esta guía condensa lo que necesitás saber antes de tocar cualquier cosa. Si tenés tiempo para leer solo un documento, es este.

---

## 1. Qué es esto

Una plataforma SaaS de inteligencia de visitantes anónimos. Conecta comportamiento en el sitio, atribución de campañas, grabaciones de sesión y señales de intención.

**No es** un CRM, un dashboard genérico de analytics, ni un panel de ventas.

**Está en Fase 1.** Los datos reales vienen de PostHog. No hay leads identificados, no hay revenue, no hay ventas.

---

## 2. Documentos — leer en este orden

| # | Documento | Cuándo es obligatorio |
|---|---|---|
| 1 | `docs/product/phases.md` | Antes de agregar cualquier feature |
| 2 | `docs/tracking/tracking-contract.md` | Antes de tocar eventos, payloads, UTMs |
| 3 | `docs/architecture/data-flow-and-adapter.md` | Antes de tocar DataAdapter, HogQL, filtros, paginación |
| 4 | `docs/product/scope-and-non-goals.md` | Antes de agregar texto, labels o métricas nuevas |
| 5 | `docs/architecture/recordings.md` | Solo si tocás grabaciones, rrweb, player, snapshots |
| 6 | `docs/product/interface-map-v1.md` | Antes de rediseñar cualquier vista |
| 7 | `docs/development/where-to-change-what.md` | Para saber qué archivos tocar según el tipo de cambio |

---

## 3. Reglas que no cambian sin autorización explícita

### Tracking

- Los nombres de eventos son exactamente: `page_view_custom`, `service_click`, `whatsapp_click`. No renombrar, no crear variantes.
- `visitor_id`, `session_id`, `event_id` — no cambiar la lógica de generación.
- La atribución pertenece a la sesión — no se hereda entre sesiones del mismo visitante.
- No enviar PII a PostHog, GTM, dataLayer ni Meta Pixel.

### Semántica de negocio

```
whatsapp_click = señal de intención anónima (alta)
whatsapp_click ≠ lead confirmado
whatsapp_click ≠ venta
whatsapp_click ≠ revenue
```

- No mostrar ventas, revenue, ROAS ni pipeline comercial. No existen en Fase 1.
- No convertir la plataforma en CRM.

### Técnico

- La PostHog API key (`phx_...`) solo existe en el servidor. Nunca en código cliente, nunca en el repositorio.
- Toda query de datos pasa por `DataAdapter` (`lib/data/adapter.ts`). No importar `lib/posthog/*.ts` directamente desde `app/`.
- El filtro `service` tiene semántica ampliada: `session.service === X OR events[].service === X`. No simplificar — rompe la consistencia con `/servicios`.
- El sentinel `__missing__` representa "Sin anuncio" (utm_content vacío y ad_id vacío). La UI muestra "Sin anuncio"; los filtros y URLs usan `__missing__`. No convertirlo en texto literal.
- Los links de campañas → sesiones usan `?campaign=`, `?source=`, `?medium=`, `?content=`. Nunca `?q=` para navegación programática.

---

## 4. Arquitectura en 30 segundos

```
Sitio HubSpot + breeze-scripts.js
  → genera visitor_id / session_id / event_id
  → captura UTMs
  → envía a dataLayer (GTM) y PostHog en paralelo

PostHog (solo acceso servidor)
  ↓
DataAdapter  (lib/data/adapter.ts)
  ├── MockAdapter     DATA_SOURCE=mock   (default local)
  └── PostHogAdapter  DATA_SOURCE=posthog
  ↓
Server Components  (app/)
  ↓
UI  (Next.js App Router + Tailwind)
```

→ Detalle completo: `docs/architecture/system-map.md`

---

## 5. Patrones que no deben romperse

### `force-dynamic` + `Suspense`

Todas las páginas que leen `searchParams` tienen `export const dynamic = "force-dynamic"` y envuelven el contenido en `<Suspense>`. No quitar ninguno de los dos.

### Paginación

Usa limit+1 para detectar página siguiente. `buildPageHref()` en `app/sesiones/page.tsx` debe preservar todos los filtros activos. Si agregás un filtro nuevo, agregalo también ahí.

### Stretched link + z-20

En filas de sesión: el link cubre toda la fila (`stretched-link`); el botón "Ver grabación" tiene `z-20` para ser clickable independientemente. Si rehacés el layout de la fila, verificá que ambos siguen funcionando.

### Nota "Incluye eventos de X"

Cuando una sesión entra al filtro de servicio por sus eventos (no por su servicio principal), la UI muestra una nota ámbar. Ver `data-flow-and-adapter.md §15.3`.

### Badge "Coincide con filtro"

En `ReplayTimeline`, cuando hay `serviceFilter` activo y el evento coincide. Ver `data-flow-and-adapter.md §15.4`.

---

## 6. Cómo correr el proyecto

```bash
npm install
npm run dev
```

Sin variables de entorno → corre con datos mock (mismo tipo, sin credenciales).

```bash
npm run lint
npm run build
```

Estos dos comandos deben pasar antes de cualquier push.

→ Variables de entorno: `README.md`

---

## 7. Cómo entregar cambios

Después de cada cambio no trivial, incluir en el commit o PR:

1. **Resumen** — qué se hizo en lenguaje llano.
2. **Archivos modificados** — lista completa.
3. **Cómo funciona** — flujo de usuario, datos usados, estados.
4. **No tocar** — qué no debe cambiarse después.
5. **Cómo validar** — pasos concretos, comandos si aplica.
6. **Riesgos** — qué vigilar.
7. **Documentación actualizada** — qué docs cambiaron, o por qué no era necesario.

Para cambios de tracking, PostHog, GTM, modelo de datos o fases → también actualizar el documento correspondiente.

---

## 8. Qué no construir en Fase 1

- Leads identificados (nombre, teléfono, email)
- Pipeline comercial, cotizaciones, estados de venta
- Revenue, ROAS, CPA, costo de campaña
- Análisis de llamadas, transcripción
- Autenticación real (workspace_id está fijo)
- Integración directa con Meta Ads API, n8n, HubSpot CRM como fuente de datos

→ Fases completas: `docs/product/phases.md`
→ Scope y no-goals: `docs/product/scope-and-non-goals.md`

---

## 9. Si algo no está claro

Leer el documento relevante antes de asumir. La jerarquía de fuentes de verdad:

1. `docs/tracking/tracking-contract.md` — gana sobre todo en eventos y atribución
2. `docs/architecture/plan.md` — gana en decisiones técnicas y modelo de datos
3. `docs/product/phases.md` — gana en scope y fases
4. `docs/product/scope-and-non-goals.md` — gana en qué no construir
5. `docs/metrics/definitions.md` — gana en definiciones de métricas
6. Cualquier otro doc en `docs/` — gana el más reciente en caso de conflicto
