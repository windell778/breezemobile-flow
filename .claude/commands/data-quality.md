# Dominio: Calidad de datos / Diagnósticos

Contexto de trabajo para endpoints de diagnóstico y validación de calidad de datos en BreezeMobile Flow.

## Archivos clave

- `app/api/diagnostics/consistency/route.ts` — drift entre golden (900s) y live (60s)
- `app/api/diagnostics/posthog/route.ts` — conectividad y muestra de datos PostHog
- `app/api/revalidate/route.ts` — invalidación manual de caché golden
- `lib/metrics.ts` → `validateMetrics()` — chequeos de integridad en runtime
- `lib/posthog/hogql.ts` — queries HogQL que alimentan ambas capas de caché
- `docs/architecture/data-flow-and-adapter.md` §3, §7 — capas de caché y diagnóstico de consistencia
- `docs/metrics/definitions.md` — definiciones canónicas y semántica de métricas

## Leer antes de cambiar

1. `docs/architecture/data-flow-and-adapter.md` — capas live vs golden, cómo se construyen sesiones
2. `docs/metrics/definitions.md` — qué mide cada métrica y sus advertencias
3. `docs/product/scope-and-non-goals.md` — qué no validar (revenue, ROAS, leads)

## Endpoints de diagnóstico

### `GET /api/diagnostics/consistency`

Compara métricas golden del dashboard (HogQL, 900s) contra valores computados live desde `listSessions()` (60s).

| Métrica | Golden | Live |
|---|---|---|
| `sessions` | `uniq(session_id)` HogQL | `listSessions().length` |
| `visitors` | `uniq(visitor_id)` HogQL | `new Set(visitor_id).size` |
| `whatsappClicks` | `countIf(event='whatsapp_click')` HogQL | suma de eventos en listSessions |

**Umbrales:** ok <10%, warn 10–25%, drift >25%.

**Auth:** `Authorization: Bearer <REVALIDATE_SECRET>` cuando la variable está configurada.

**Causas comunes de diferencia esperada:**
- TTL distinto — golden puede tener datos de hace hasta 15 min
- `listSessions()` aplica `LIMIT 5000`; HogQL golden no tiene límite
- Sesiones reconstruidas desde eventos vs agregado directo HogQL
- Datos recién ingestados en PostHog visibles en live antes que en golden

`warn` no implica bug. `drift` implica investigar — no pánico.

### `GET /api/diagnostics/posthog`

Valida conectividad con PostHog y devuelve muestra cruda de eventos y grabaciones.

**Lo que valida:** configuración de `POSTHOG_PROJECT_ID`/`POSTHOG_API_KEY`, respuesta de API, presencia de eventos.

**Lo que NO valida:** formato correcto de `visitor_id`/`session_id`, campos UTM presentes, que las grabaciones sean reproducibles.

### `POST /api/revalidate`

Invalida la caché golden manualmente. Llama `revalidateTag("golden", "max")`.

**Auth:** `Authorization: Bearer <REVALIDATE_SECRET>` (requerido siempre).

## Validación en runtime — `validateMetrics()`

`lib/metrics.ts` → `validateMetrics(metrics)` devuelve un array de warnings. Se ejecuta en el servidor al armar el dashboard.

**Qué chequea:**
- `sessions === 0` con `serviceClicks > 0` → dato inconsistente
- `replayRate > 100` → error de cálculo

**Qué NO chequea (y por qué):**
- `whatsappClicks > sessions` — **no es un error**. `whatsappClicks` es conteo bruto de eventos; una sesión puede generar múltiples. Ver `docs/metrics/definitions.md`.

## Reglas que no cambiar

- `warn`/`drift` son señales técnicas — nunca mostrarlos como errores comerciales
- Este dominio **no valida métricas comerciales**: sin revenue, ROAS, leads confirmados, ventas
- `whatsapp_click` en diagnósticos = conteo técnico de eventos
  ```
  whatsapp_click ≠ lead confirmado
  whatsapp_click ≠ venta
  whatsapp_click ≠ revenue
  ```
- No exponer `POSTHOG_API_KEY` ni `REVALIDATE_SECRET` en respuestas de los endpoints
- No agregar endpoints de diagnóstico que lean o modifiquen datos de usuarios

## Cómo usar en desarrollo

```bash
# Drift entre capas de caché
curl http://localhost:3000/api/diagnostics/consistency \
  -H "Authorization: Bearer <REVALIDATE_SECRET>"

# Conectividad PostHog
curl http://localhost:3000/api/diagnostics/posthog \
  -H "Authorization: Bearer <REVALIDATE_SECRET>"

# Invalidar caché golden
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer <REVALIDATE_SECRET>"
```
