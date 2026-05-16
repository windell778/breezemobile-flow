# Mapa de interfaz V1 — BreezeMobile Flow Intelligence

_Creado: 2026-05-16_

---

## Principios de producto

1. **El visitante anónimo es el protagonista.** Cada vista es un camino hacia el perfil del visitante. Los números sin contexto son ruido.

2. **Comportamiento sobre métricas.** La pregunta central no es "¿cuántos?" sino "¿quién vino, de dónde, qué vio, qué hizo, y se puede reproducir?".

3. **Honestidad de datos.** Si un campo no existe, la UI lo dice. No se imputa, no se redondea para arriba, no se ocultan huecos de tracking.

4. **Contexto preservado en toda la navegación.** Entrar a Visitor Intelligence siempre lleva `visitor_id` + `session_id`. Ningún flujo pierde el hilo.

5. **`whatsapp_click` es intención, no conversión.** Nunca aparece como lead confirmado, venta, revenue ni ROAS. Esta regla no tiene excepciones en V1.

6. **El tracking es primera clase.** Estado del tracking no es una página técnica escondida — es evidencia de que la plataforma funciona. Problemas de tracking aparecen en el resumen.

7. **Operadores, no analistas.** El usuario principal no construye modelos. Quiere entender por qué alguien llegó, qué hizo, y si hay una grabación que lo muestre.

8. **Sin CRM por contaminación de interfaz.** No mostrar pipeline, estados comerciales, cotizaciones, ni ningún campo que implique lead calificado antes de tener datos reales de Fase 2.

---

## Navegación principal propuesta

| Vista | Ruta | Grupo nav | Rol | Pregunta que responde | Datos usados | Riesgos a evitar |
|---|---|---|---|---|---|---|
| Resumen general | `/` | Operación | Centro de mando: KPIs, sesiones recientes, campaña top, servicio top, alerta de tracking | ¿Qué está pasando ahora en la web? | `getDashboardMetrics`, `listSessions` (últimas 6), `getTrackingHealth`, `getCampaignSummaries`, `getServiceSummaries` | Mostrarse como BI; mostrar revenue o ROAS; ocultar alertas de tracking |
| Sesiones | `/sesiones` | Comportamiento | Lista navegable de todas las sesiones con filtros y acceso a Visitor Intelligence | ¿Qué visitantes hubo, de dónde vinieron, qué hicieron? | `listSessions` + `SessionFilters` | Mostrar sesiones sin contexto de acceso a visitante; perder filtros al paginar |
| Grabaciones | `/grabaciones` | Comportamiento | Vista top-level de replay: explorar grabaciones por servicio sin conocer el visitante | ¿Qué hizo concretamente alguien en el sitio? | `listSessions` (scope de servicio), `getRecordingStreamUrl` | Mostrar sesiones de otro servicio como fallback; reproducir sin grabación disponible |
| Campañas | `/campanas` | Atribución | Tabla comparativa por dimensión (fuente/medio/campaña/anuncio) con señal WA | ¿Qué campañas y fuentes generan más señal de intención? | `getCampaignSummaries`, `listSessions` | Llamar a WA clicks "conversiones confirmadas"; perder filtro al cambiar dimensión |
| Servicios | `/servicios` | Atribución | Cards por servicio con mini-funnel de sesiones → clicks → WA | ¿Qué servicios interesan más a los visitantes? | `getServiceSummaries` | Confundir service_clicks con ventas; mostrar solo session.service sin evento-scope |
| Eventos | `/eventos` | Sistema | Lista cruda de eventos con filtro por tipo; cada fila enlaza al visitante | ¿Qué acciones individuales se capturaron y en qué sesión? | `listEvents` + `EventFilters` | Mostrar event_name técnico como label principal; enlazar sin sesión activa |
| Estado del tracking | `/tracking` | Sistema | Diagnóstico técnico: alertas, severidad, referencia de eventos/campos/integraciones | ¿Está llegando el tracking correctamente? | `getTrackingHealth`, datos estáticos de referencia | Confundir alertas de tracking con alertas comerciales; mostrar a usuarios no técnicos como vista principal |

**Visitor Intelligence** (`/visitantes/[visitorId]`) no vive en la navegación principal. Se accede siempre con contexto: desde una fila de sesión, un evento, o una grabación. Esto es correcto: un visitante sin sesión activa no tiene sentido de entrada.

---

## Estructura de Visitor Intelligence

La vista responde una pregunta: **"¿Qué sabemos de este visitante anónimo?"**

El encabezado (siempre visible) muestra: `shortId(visitor_id)`, intent máximo, fuente inicial, KPIs globales del visitante (sesiones, WA clicks, servicios vistos, grabaciones). Los tabs cambian el contenido pero nunca cambian el encabezado.

### Tabs

| Tab | Key | Función | Datos | Estados vacíos |
|---|---|---|---|---|
| **Resumen** | `resumen` | Vista narrativa: qué sabemos, sesión activa en contexto, últimos eventos de intención. Botón "Ver grabación" si existe. | `activeSession`, `visitorSessions`, últimos eventos no-pageview | "Solo página vista registrada" si no hay eventos de intención |
| **Grabaciones** | `grabaciones` | Player de la sesión activa (si tiene grabación); lista lateral de todas las sesiones del visitante con estado de grabación | `getSessionRecording`, `getRecordingStreamUrl`, lista de sesiones | "Este visitante no tiene grabaciones disponibles" si ninguna sesión tiene recording |
| **Journey** | `journey` | Timeline cronológico de todas las sesiones: encabezado de sesión con fuente + campaña, luego eventos de cada sesión | Todas las sesiones + eventos, ordenadas por timestamp | "Sin sesiones registradas" (no debería ocurrir si llegamos hasta aquí) |
| **Sesiones** | `sesiones` | Lista de todas las sesiones del visitante como cards; al hacer clic cambia la sesión activa | `getVisitorSessions` | "Sin sesiones" — no debería ocurrir |
| **Eventos** | `eventos` | Eventos de la sesión activa (no de todas las sesiones). Muestra timestamp, evento, página, CTA | `activeSession.events` | "Sin eventos en esta sesión" si solo hay page_view |
| **Atribución** | `atribucion` | Todos los campos de atribución de la sesión activa: UTMs, campaign_id, adset_id, ad_id, fbclid, fbp, fbc, referrer | `activeSession.attribution` | Campos vacíos mostrar "Sin dato" — nunca omitir el campo |
| **Datos técnicos** | `tecnico` | Raw JSON de la sesión activa para debugging. Dirigido a operadores técnicos | `activeSession` serializado | N/A — siempre hay datos si hay sesión |

**Regla de tabs:** todos preservan `?session=` en la URL. Al cambiar de tab, la sesión activa no cambia. Al hacer clic en una sesión dentro de "Sesiones", se actualiza `?session=` y los demás tabs reflejan la nueva sesión activa.

**Tab inválido:** cae a `resumen` sin error.

---

## Jerarquía de información por vista

### `/` — Resumen general

**Objetivo:** panorama operativo de las últimas horas. Entrar, ver qué hay, navegar.

**Contenido principal:**
- KPIs: sesiones, WA clicks, service clicks, % con grabación
- Alerta de anomalías (si `validateMetrics` detecta algo fuera de rango)
- Embudo de señal: Fuente → Servicio → Sesión → Intención (4 pasos clickables)
- Lectura rápida: campaña con más señal, servicio más activo, alerta de tracking
- Sesiones recientes (6)
- Estado del tracking (4 items)
- Top campañas (4)
- Top servicios (4)

**Acciones principales:** navegar a sesiones filtradas (por campaña, servicio), abrir Visitor Intelligence desde sesión reciente, ir a `/tracking` desde alerta.

**Estados vacíos:** si `metrics.sessions === 0` → mensaje claro de que no hay datos aún. Si `topCampaign === null` → ocultar el card, no mostrar "null".

**Qué NO debe mostrar:** revenue, ROAS, leads confirmados, porcentaje de conversión implicando venta, predicciones.

---

### `/sesiones` — Sesiones

**Objetivo:** lista navegable con filtros para encontrar sesiones relevantes.

**Contenido principal:**
- Búsqueda libre (`?q=`)
- Filter chips: Todas, Click a WhatsApp, Click en servicio, Sin interacción, Meta Ads, Direct, Con grabación
- Active chips: servicio activo, fuente, medio, contenido, evento, campaña
- Mini-métricas: sesiones en página, WA clicks en página, grabaciones en página, página actual
- Tabla: fecha/hora, sesión ID, visitante/servicio, fuente, atribución, actividad + botón "Ver grabación"
- Paginación (limit+1)

**Acciones principales:** clic en fila → Visitor Intelligence con sesión activa; clic en "Ver grabación" → Visitor Intelligence en tab Grabaciones con sesión activa.

**Estados vacíos:** `EmptyState` con mensaje contextual al filtro activo.

**Nota inline:** si `session.service !== filtro_service` pero la sesión tiene eventos del servicio filtrado → "Incluye eventos de X" en ámbar.

**Qué NO debe mostrar:** ingresos por sesión, costo por clic, score de lead, campos predictivos.

---

### `/grabaciones` — Grabaciones (top-level)

**Objetivo:** explorar grabaciones sin saber el visitante. Filtrar por servicio para entender cómo interactúan con un servicio específico.

**Contenido principal:**
- Chip activo de servicio filtrado (si aplica)
- Stats: grabaciones disponibles en scope, sesiones sin grabación en scope, fuente de grabaciones
- Panel izquierdo: player rrweb + barra de info de sesión activa (con nota ámbar si es sesión cruzada)
- Panel derecho: timeline de eventos (con badge "Coincide con filtro") + lista de sesiones del scope

**Acciones principales:** navegar entre sesiones del scope; hacer seek en el player desde el timeline; cambiar servicio desde chip.

**Estados vacíos:**
- Sin filtro de servicio y sin grabaciones: "No hay sesiones disponibles."
- Con filtro de servicio y sin sesiones en scope: "No hay sesiones para el servicio X."
- Sesión activa sin grabación: player en estado "Sin grabación disponible."

**Qué NO debe mostrar:** sesiones de otro servicio como fallback. Nunca inventar grabación disponible si `recording.status !== "available"`.

---

### `/campanas` — Campañas

**Objetivo:** comparar señal de intención por dimensión de atribución.

**Contenido principal:**
- Selector de dimensión: Fuente / Medio / Campaña / Anuncio
- Tabla: dimensión, fuente, sesiones, service clicks, WA clicks, % WA, badge de señal
- "Ver sesiones" enlaza a `/sesiones?{dimension}={valor}` (o `?content=__missing__` para "Sin anuncio")

**Acciones principales:** cambiar dimensión; navegar a sesiones filtradas por dimensión.

**Estados vacíos:** "No hay datos de atribución para esta dimensión."

**Qué NO debe mostrar:** costo de campaña, ROAS, CPA, CTR de Meta, "conversiones confirmadas".

---

### `/servicios` — Servicios

**Objetivo:** entender qué servicios atraen más visitas y generan más señal.

**Contenido principal:**
- Cards por servicio: nombre, ruta, mini-funnel (sesiones → service_clicks → WA clicks), métricas, % WA
- Botones: "Ver sesiones" → `/sesiones?service=X`, "Ver grabaciones" → `/grabaciones?service=X`

**Estados vacíos:** "No hay datos de servicios disponibles."

**Qué NO debe mostrar:** ingresos por servicio, tasa de cierre, leads por servicio.

---

### `/eventos` — Eventos

**Objetivo:** inspección granular de eventos capturados. Vista técnica/operativa.

**Contenido principal:**
- Cards de conteo por tipo de evento (clickables para filtrar)
- Chip activo de filtro
- Tabla: fecha, evento (label + nombre técnico), visitante/sesión, página/servicio, CTA text, "Ver sesiones con este evento"

**Acciones principales:** filtrar por tipo; ir a visitante con `?session=X&tab=eventos`; ir a `/sesiones?event=X`.

**Estados vacíos:** "No hay eventos que coincidan."

**Qué NO debe mostrar:** event_name como label principal (debe ser label humano).

---

### `/tracking` — Estado del tracking

**Objetivo:** diagnóstico técnico para operadores. Confirmar que el tracking está funcionando.

**Contenido principal:**
- Banner de estado global (ok / advertencias / problemas críticos)
- Cards de health items: área, título, severidad, detalle, recomendación
- Referencia: eventos recibidos, servicios detectados, integraciones previstas, campos disponibles

**Estados vacíos:** "No hay items de tracking health disponibles."

**Qué NO debe mostrar:** métricas comerciales; alertas de conversión; score de tracking. Esta página es para debug, no para negocio.

---

## Componentes base recomendados

### Existentes — mantener y refinar

| Componente | Archivo | Estado |
|---|---|---|
| `AppShell` | `components/layout/AppShell.tsx` | OK |
| `Sidebar` / `NavLinks` | `components/layout/Sidebar.tsx`, `NavLinks.tsx` | OK |
| `EmptyState` | `components/ui/EmptyState.tsx` | OK |
| `MetricCard` | `components/ui/MetricCard.tsx` | OK |
| `SourceBadge` | `components/ui/SourceBadge.tsx` | OK |
| `StatusBadge` | `components/ui/StatusBadge.tsx` | OK |
| `ReplayTimeline` | `components/recordings/ReplayTimeline.tsx` | OK — incluye `serviceFilter` |
| `GrabacionesReplaySection` | `components/recordings/GrabacionesReplaySection.tsx` | OK |
| `RRWebPlayer` | `components/ui/RRWebPlayer.tsx` | OK |
| `RecentSessions` | `components/dashboard/RecentSessions.tsx` | OK |

### Nuevos o a estandarizar antes del rediseño visual

| Componente | Propósito | Prioridad |
|---|---|---|
| `PageHeader` | Título + descripción + acciones opcionales. Hoy cada página lo hace inline diferente. | Alta |
| `FilterBar` | Búsqueda + chips de filtro en contenedor consistente. | Alta |
| `ActiveChip` | Chip activo con ×. Hoy hay variaciones inline entre páginas. Extraer como componente. | Alta |
| `DataState` | Loading skeleton / empty / error unificado. Hoy los skeletons son ad hoc. | Media |
| `SessionCard` | Card de sesión reutilizable (lista en Visitor Intelligence + `/grabaciones`). | Media |
| `KpiGrid` | Grid de métricas con slot para N cards. Hoy hay variantes de 2, 3 y 4 columnas con clases distintas. | Media |
| `IntentBadge` | Badge de intención con color semántico: Alta=verde, Media=ámbar, Baja=gris. | Baja |
| `RecordingStatusIndicator` | Badge compacto: Con grabación / Sin grabación / Procesando. | Baja |

### Patrones a estandarizar (no componentes nuevos)

- **Tabla de datos:** columnas fijas en XL, collapse a vertical en móvil. Patrón correcto ya en `/sesiones`.
- **Link de fila completa + botón interno:** stretched link `z-10` + botón `z-20`. Ya funciona en `/sesiones` y `RecentSessions`. Documentar para no romper en el rediseño.
- **Skeleton de carga:** el pulso debe imitar el layout real del contenido poblado, no placeholders genéricos.

---

## Cambios recomendados por fase

### Antes del rediseño visual

1. Extraer `ActiveChip` como componente — hay al menos 3 implementaciones inline distintas.
2. Estandarizar `PageHeader` — title + description siempre como `AppShell` props.
3. Extraer `FilterBar` — el bloque de búsqueda + chips de `/sesiones` es reutilizable en `/eventos`.
4. Estandarizar `DataState` — unificar loading skeleton / empty / error.
5. Documentar el patrón stretched link + z-20 en este documento para que no se rompa en el rediseño.
6. Revisar estados vacíos faltantes: `/campanas` con 0 campañas, `/servicios` con 0 servicios, `/visitantes/[id]` con visitante no encontrado.

### Durante el rediseño visual

1. Aplicar sistema de tokens de color: slate como base, emerald para señal positiva, amber para advertencia/cruzado, blue para navegación, rojo para error/crítico.
2. Revisar layout de Visitor Intelligence: encabezado fijo + tabs es correcto; mejorar densidad y jerarquía visual.
3. Mejorar panel de grabaciones: la barra de info debajo del player y el panel timeline+lista necesitan más espacio en pantallas medianas.
4. Topbar móvil: la navegación colapsada existe pero no está pulida.
5. `IntentBadge` con color semántico propio (hoy `StatusBadge` no distingue semántica de intención).
6. Skeletons de carga que imiten el layout real de la tabla poblada.

### Después del rediseño (Fase 2+)

- Autenticación y login (bloqueante para multi-tenant, no para rediseño visual)
- Panel de configuración de workspace
- Onboarding de tracking (guía de instalación de `breeze-scripts.js`)
- Notificaciones y alertas activas de tracking health
- Leads identificados cuando haya datos de Fase 2
- Comparación entre períodos de tiempo
- Exportación de datos

---

## Lo que NO debe aparecer en V1

| Elemento | Por qué no |
|---|---|
| "Leads" como concepto | No hay datos de Fase 2. `whatsapp_click` ≠ lead |
| Revenue, ventas, ingresos | No hay datos comerciales |
| ROAS, CPA, CPL | Requieren costo de campaña + conversión confirmada |
| Score de calidad de lead | No hay modelo de calificación |
| Pipeline / embudo comercial | Es Fase 3 |
| Predicciones o recomendaciones automáticas | Es Fase 5 |
| Comparación entre períodos | No hay filtro de fecha aún |
| Segmentos o audiencias | Feature de BI, fuera del foco del producto |
| Mapa de calor embed | Requiere integración PostHog adicional |
| Notificaciones push | Requiere infraestructura de Fase 2 |
| "Conversión" como sinónimo de `whatsapp_click` | Nunca en V1 |

---

## Datos reales vs. inferidos

| Dato | Origen | Naturaleza |
|---|---|---|
| `visitor_id`, `session_id`, `event_id` | `breeze-scripts.js` | Real — generado en cliente |
| `event_name`, `page_path`, `cta_text` | Payload del evento | Real |
| UTMs, `campaign_id`, `adset_id`, `ad_id` | URL de entrada capturada por tracking | Real si la URL tiene parámetros; vacío si es tráfico directo |
| `source` | Inferido de `utm_medium` / `utm_source` | Inferencia — no es un campo directo de PostHog |
| `intent_level` | Inferido de eventos: `whatsapp_click`=Alta, `service_click`=Media, else=Baja | Inferencia — no viene de PostHog |
| `duration` | PostHog Sessions API | Null en datos reales actuales (no disponible en Events API) |
| `recording.status` | PostHog Recordings API cruzado con webhook | Real cuando el webhook llega; puede estar desactualizado si el webhook falla |
| `service` de la sesión | Primer evento `page_view_custom` con `service` en payload | Real si el tracking lo captura; puede ser "general" por defecto |
