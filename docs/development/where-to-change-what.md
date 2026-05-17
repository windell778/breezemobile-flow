# Dónde cambiar qué — Guía de mantenimiento

_Creado: 2026-05-17_

Guía práctica para saber qué archivos tocar y qué documentos leer según el tipo de cambio. Cada sección lista los archivos probables, los documentos obligatorios, los riesgos y la validación mínima.

---

## 1. Agregar un nuevo evento de tracking

**Contexto:** un nuevo evento de comportamiento debe capturarse en el sitio y aparecer en la plataforma.

**Archivos probables:**
- `docs/tracking/tracking-contract.md` — actualizar primero (es la fuente de verdad)
- `lib/data/types.ts` — agregar el nuevo `EventName` al union type
- `lib/labels.ts` — agregar el label humano en `eventLabels`
- `lib/mock-data.ts` — agregar eventos mock del nuevo tipo
- `lib/posthog/hogql.ts` — agregar el nombre a la condición `event IN (...)` de la query HogQL
- `app/eventos/page.tsx` — si se debe mostrar en la lista de tipos de evento
- `components/recordings/ReplayTimeline.tsx` — si debe aparecer con color/dot propio en el timeline

**Documentos obligatorios:**
- `docs/tracking/tracking-contract.md` — definir nombre, payload, campos obligatorios antes de implementar
- `docs/architecture/data-flow-and-adapter.md §4` — restricciones de HogQL y filtros

**Riesgos:**
- Si el nombre del evento no se agrega al union `EventName`, TypeScript no lo validará y puede pasar silenciosamente.
- Si no se agrega a la condición HogQL `event IN (...)`, PostHog no lo devolverá en queries reales.
- Nunca cambiar los nombres de los 3 eventos existentes (`page_view_custom`, `service_click`, `whatsapp_click`).

**Validación mínima:**
```bash
npm run lint
npm run build
```
Verificar que el nuevo evento aparece en `/eventos` con el label correcto.

---

## 2. Agregar un nuevo servicio

**Contexto:** el sitio web tiene una nueva página de servicio que debe rastrearse.

**Archivos probables:**
- `docs/tracking/tracking-contract.md` — documentar el nuevo `service` key
- `lib/data/types.ts` — agregar el nuevo valor al type `ServiceKey`
- `lib/labels.ts` — agregar el label humano en `serviceLabels` (y en `humanValue` si usa ese mapa)
- `lib/mock-data.ts` — agregar sesiones/eventos mock con el nuevo servicio
- `breeze-scripts.js` (sitio) — configurar el nuevo `service` en el script de tracking

**Documentos obligatorios:**
- `docs/tracking/tracking-contract.md` — confirmar el key técnico antes de implementar
- `docs/architecture/data-flow-and-adapter.md §15.1` — recordar que el filtro `service` es ampliado (session.service OR events[].service)

**Riesgos:**
- Si el key del servicio en `breeze-scripts.js` no coincide exactamente con el de `ServiceKey`, los filtros no matchearán.
- Si se agrega en `types.ts` pero no en `labels.ts`, la UI mostrará "Sin dato" o el valor técnico crudo.

**Validación mínima:**
```bash
npm run lint
npm run build
```
Verificar que `/servicios` muestra el nuevo servicio y que `/sesiones?service=nuevo` filtra correctamente.

---

## 3. Cambiar queries HogQL o PostHog

**Contexto:** cambiar cómo se consultan eventos, sesiones, campañas o servicios en PostHog.

**Archivos probables:**
- `lib/posthog/hogql.ts` — queries principales
- `lib/posthog/events.ts` — queries de eventos por visitante
- `lib/posthog/persons.ts` — queries de perfil de visitante
- `lib/posthog/recordings.ts` — lógica de descarga de grabaciones
- `lib/data/adapter.ts` — si cambia la interfaz del adapter

**Documentos obligatorios:**
- `docs/architecture/data-flow-and-adapter.md §§2-4` — construcción de sesiones, limitaciones de HogQL, por qué los filtros son post-fetch
- `docs/architecture/data-flow-and-adapter.md §4` — riesgo de interpolación directa de IDs (HogQL injection)
- `docs/architecture/recordings.md` — si el cambio toca grabaciones

**Riesgos:**
- Los filtros de `SessionFilters` (`service`, `source`, `medium`, `content`, `search`) se aplican **post-fetch en memoria**, no en SQL. Si se mueven a HogQL WHERE, las sesiones quedarían con eventos incompletos (ver `data-flow-and-adapter.md §9`).
- El LIMIT 5000 de `listSessionsHogQL` es hardcoded. Si el volumen crece, empezará a truncar.
- Interpolación directa de valores en HogQL: solo seguro para IDs internos con formato controlado (`visitor_id`, `session_id`). Texto libre del usuario nunca debe interpolarse directamente.

**Validación mínima:**
```bash
npm run lint
npm run build
```
Con `DATA_SOURCE=posthog`: verificar que `/sesiones`, `/campanas` y `/servicios` devuelven datos reales sin error.

---

## 4. Cambiar filtros o navegación de sesiones

**Contexto:** agregar un nuevo filtro a `/sesiones`, cambiar cómo funcionan los filtros existentes, o cambiar los links desde otras vistas hacia `/sesiones`.

**Archivos probables:**
- `app/sesiones/page.tsx` — parámetros de URL, `TableParams`, `SessionsTable`, `buildPageHref`, `SessionRow`
- `lib/data/types.ts` — `SessionFilters` si se agrega un nuevo campo de filtro
- `lib/data/adapter.ts` — `MockAdapter.listSessions()` si se implementa el filtro en mock
- `lib/posthog/hogql.ts` — `listSessionsHogQL()` si se implementa en el adapter real
- `app/campanas/page.tsx` — `buildSessionsHref()` si el cambio afecta links de campañas
- `app/page.tsx` — links de campañas/servicios en el dashboard
- `docs/architecture/data-flow-and-adapter.md §15` — actualizar si se agrega un comportamiento nuevo

**Documentos obligatorios:**
- `docs/architecture/data-flow-and-adapter.md §§9, 13, 15` — semántica de filtros, paginación, reglas de navegación
- Especialmente `§15.6`: los links desde campañas/dashboard a sesiones deben usar `?campaign=`, `?source=`, `?medium=`, `?content=` — nunca `?q=` para navegación programática.

**Riesgos:**
- El filtro `service` tiene semántica ampliada (`session.service OR events[].service`). No simplificar a solo `session.service` — rompe la consistencia con `/servicios`.
- El sentinel `__missing__` para "Sin anuncio" debe mantenerse si se toca el filtro `content`. Ver `§15.5`.
- `buildPageHref` debe preservar todos los filtros activos al paginar. Si se agrega un filtro nuevo, también debe agregarse ahí.
- Los chips activos en la UI deben limpiarse al navegar a `/sesiones` sin parámetros (el href del chip debe ser `/sesiones` sin el parámetro correspondiente).

**Validación mínima:**
```bash
npm run lint
npm run build
```
Probar: `/sesiones?service=X`, `/sesiones?campaign=Y`, `/sesiones?content=__missing__`, paginación con filtros activos.

---

## 5. Cambiar grabaciones o el replay

**Contexto:** cualquier cambio en el player de grabaciones, la descarga de snapshots, o el timeline de eventos.

**Archivos probables:**
- `lib/posthog/recordings.ts` — lógica de descarga y normalización
- `app/api/recordings/[recordingId]/snapshots/route.ts` — route handler del player
- `components/ui/RRWebPlayer.tsx` — componente cliente del player
- `components/recordings/ReplayTimeline.tsx` — timeline de eventos con seek
- `components/recordings/GrabacionesReplaySection.tsx` — layout de la vista de grabaciones
- `app/grabaciones/page.tsx` — vista top-level

**Documentos obligatorios — LEER COMPLETO antes de tocar:**
- `docs/architecture/recordings.md` — fuente de verdad para blob_v2, gzip latin1, window_id, sanitizeNode, person_uuid, alineación de timestamps.

**Riesgos críticos (no tocar sin leer recordings.md):**
- Cambiar la codificación de `latin1` a `base64` en `decompressEventData` → el video carga pero queda congelado (falla silenciosa).
- Cambiar el retorno de `downloadSnapshots` de `Record<string, unknown[]>` a array plano → `TypeError: e.setAttribute is not a function` en grabaciones largas.
- Eliminar `sanitizeNode()` → crash `Cannot read properties of undefined` en sesiones con elementos enmascarados.
- Usar `distinct_id` en vez de `person_uuid` al llamar `/session_recordings/` → respuesta 400.
- El sentinel `__missing__` para "Sin anuncio" en filtros de content debe mantenerse.

**Validación mínima:**
```bash
npm run lint
npm run build
```
Con `DATA_SOURCE=posthog`: abrir una grabación real y verificar que el video se reproduce sin error en consola.

---

## 6. Cambiar copy de negocio (labels, textos visibles)

**Contexto:** cambiar textos visibles en la UI: labels de métricas, descripciones de páginas, nombres de filtros, mensajes de estado vacío.

**Archivos probables:**
- `lib/labels.ts` — `humanValue`, `formatDuration`, `eventLabels`, `serviceLabels`, `humanField`
- `lib/analytics.ts` — `mainEventLabel`, `buildVisitorSummary` (textos de estado de intención)
- Páginas individuales (`app/*/page.tsx`) — títulos, descripciones, filter chips
- `components/layout/nav-items.ts` — labels de navegación

**Documentos obligatorios:**
- `docs/product/scope-and-non-goals.md §4` — términos prohibidos en esta fase
- `docs/architecture/data-flow-and-adapter.md §15` — nota "Incluye eventos de X" y badge "Coincide con filtro" deben mantenerse

**Restricciones de copy:**
- Nunca usar: "Lead confirmado", "Venta", "Revenue", "ROAS", "Conversión" (como sinónimo de venta).
- Usar en su lugar: "Señal de intención", "Click a WhatsApp", "Conversión anónima".
- `whatsapp_click` puede mostrarse como "Click a WhatsApp" en la UI, pero nunca como "Lead" ni "Venta".
- Los nombres técnicos de eventos (`page_view_custom`, `service_click`, `whatsapp_click`) no cambian aunque sí cambie su label humano.

**Validación mínima:**
```bash
npm run lint
npm run build
```
Revisar visualmente las vistas afectadas.

---

## 7. Rediseñar UI o componentes visuales

**Contexto:** cambio visual significativo en layout, componentes, colores, tipografía o estructura de vistas.

**Documentos obligatorios — leer antes de tocar:**
- `docs/product/interface-map-v1.md` — mapa completo de vistas, principios de producto, qué NO mostrar
- `docs/architecture/data-flow-and-adapter.md §15` — comportamientos visuales que deben preservarse (nota ámbar, badge "Coincide con filtro", stretched link + z-20)

**Patrones que no deben romperse:**
- **Stretched link z-10 + botón z-20:** en filas de sesión y `RecentSessions`. El link cubre toda la fila; el botón "Ver grabación" tiene z-20 para ser independientemente clickable. Si se rehace el layout de la fila, verificar que ambos siguen funcionando.
- **`force-dynamic` + `Suspense`:** no quitar `force-dynamic` de las páginas que leen `searchParams`. No mover fetches fuera del componente suspendido. Ver `data-flow-and-adapter.md §11`.
- **Nota "Incluye eventos de X":** debe permanecer visible cuando `session.service !== serviceFilter` y la sesión entra por eventos. Ver `§15.3`.
- **Badge "Coincide con filtro":** en `ReplayTimeline` cuando `serviceFilter` activo. Ver `§15.4`.

**Qué no debe aparecer en el rediseño:**
- Revenue, ROAS, pipeline comercial, score de lead. Ver `interface-map-v1.md §Lo que NO debe aparecer en V1`.

**Validación mínima:**
```bash
npm run lint
npm run build
```
Probar flujo: `/` → `/campanas` → `/sesiones?campaign=X` → `/visitantes/[id]?session=Y&tab=grabaciones`.

---

## 8. Cambiar mock data

**Contexto:** agregar o modificar sesiones, eventos, visitantes, campañas o servicios en `lib/mock-data.ts`.

**Archivos probables:**
- `lib/mock-data.ts` — datos mock
- `lib/data/adapter.ts` → `MockAdapter` — si el cambio requiere nuevo campo en los tipos

**Documentos obligatorios:**
- `lib/data/types.ts` — los tipos canónicos son la fuente de verdad. El mock debe ser compatible.

**Reglas:**
- Los datos mock deben usar exactamente los mismos `ServiceKey` y `EventName` que definen los types.
- El mock debe incluir casos edge: sesiones sin grabación, sesiones con solo `page_view_custom`, sesiones cruzadas (donde `session.service !== event.service`).
- No agregar campos en el mock que no existen en los tipos canónicos — el adapter no los propagará.
- Si se agrega un nuevo campo al tipo `Session` o `TrackingEvent`, actualizar también `MockAdapter.mapMockSession()` en `adapter.ts`.

**Validación mínima:**
```bash
npm run lint
npm run build
```
Con `DATA_SOURCE=mock` (default): verificar todas las vistas principales.

---

## 9. Agregar integración futura (Meta Ads API, n8n/CAPI, HubSpot CRM)

**Contexto:** conectar una fuente de datos o sistema externo nuevo.

**Documentos obligatorios:**
- `docs/product/phases.md` — confirmar que la integración pertenece a la fase actual antes de implementar
- `docs/product/scope-and-non-goals.md` — confirmar que no está explícitamente fuera de alcance
- `docs/tracking/tracking-contract.md` — asegurar que la integración no rompe el contrato

**Reglas de separación de concerns:**
- **Meta Ads API** — datos de costo y rendimiento de campañas. Pertenece a Fase 5. No mezclar con la plataforma V0. En V0 solo se usan los UTMs y fbclid que el visitante trae en la URL.
- **n8n / CAPI** — automatizaciones y server-side events para Meta. No conectar hasta tener datos de lead (Fase 2).
- **HubSpot CRM** — datos de leads identificados. Pertenece a Fase 2. En V0 HubSpot es solo el CMS del sitio.
- **Revenue / ventas** — Fase 3. Nunca inferir desde `whatsapp_click`.

**Si se agrega cualquier integración nueva:**
1. Documentar en `docs/architecture/system-map.md` qué produce la nueva capa y cuál es su fuente de verdad.
2. Agregar el nuevo método al `DataAdapter` interface si la integración expone datos a la UI.
3. Asegurar que las API keys de la integración son server-side only.
4. Actualizar `docs/product/current-state.md` con el nuevo estado.

**Validación mínima:**
```bash
npm run lint
npm run build
```
Verificar que `DATA_SOURCE=mock` sigue funcionando sin la integración.
