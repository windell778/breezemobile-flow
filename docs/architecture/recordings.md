# Grabaciones de sesión — Implementación técnica

_Última actualización: 2026-05-14_

Este documento describe cómo funciona el sistema de grabaciones en la
implementación actual, por qué se diseñó así, qué no se debe tocar y
dónde están los riesgos.

> **Nota:** El flujo descrito en `plan.md` §5 (webhook + R2 + URL firmada)
> es la arquitectura objetivo a largo plazo. Lo que está implementado hoy
> es diferente y está documentado aquí.

---

## 1. Cómo funciona hoy

Las grabaciones se sirven **en tiempo real desde la API de PostHog**,
sin almacenamiento propio. Cuando un usuario abre una grabación en la
plataforma, el servidor descarga los eventos directamente de PostHog y
los entrega al player en el navegador.

```
Usuario abre grabación en la UI
  → RRWebPlayer.tsx hace GET /api/recordings/{recordingId}/snapshots
  → route.ts llama downloadSnapshots() en el servidor
  → downloadSnapshots() llama a PostHog API con la API Key privada
  → PostHog devuelve los eventos rrweb en formato blob_v2 NDJSON
  → El servidor descomprime, normaliza y agrupa por window_id
  → Devuelve { events, windows, currentWindow } al cliente
  → RRWebPlayer inicializa rrweb-player con esos eventos
```

La API Key de PostHog **nunca llega al cliente**. Todo el acceso a
PostHog ocurre en el servidor (route handler o server component).

---

## 2. Archivos del sistema

| Archivo | Responsabilidad |
|---|---|
| `lib/posthog/recordings.ts` | Toda la lógica de descarga y normalización de eventos |
| `lib/posthog/client.ts` | Cliente HTTP para la API de PostHog |
| `lib/posthog/normalizer.ts` | Tipos y mapeo de respuestas de PostHog |
| `app/api/recordings/[recordingId]/snapshots/route.ts` | Route handler que sirve eventos al player |
| `components/ui/RRWebPlayer.tsx` | Componente cliente que renderiza el player |
| `app/api/webhooks/posthog/recording-ended/route.ts` | Webhook de PostHog (para futura integración con R2) |

---

## 3. Formato de datos de PostHog (blob_v2)

Este es el punto más crítico del sistema. PostHog usa un formato
propio que difiere de la documentación pública de rrweb.

### 3.1 Manifiesto

La primera llamada a `/session_recordings/{id}/snapshots/` devuelve
un manifiesto JSON:

```json
{
  "sources": [
    { "source": "blob_v2", "blob_key": "0" },
    { "source": "blob_v2", "blob_key": "1" }
  ]
}
```

Los blob_keys son enteros que identifican chunks de la grabación.
Para descargar los eventos se hace **una sola llamada** con el rango:

```
GET /session_recordings/{id}/snapshots/
  ?source=blob_v2
  &start_blob_key=0
  &end_blob_key=1
  &decompress=true
```

**No usar** `?blob_key=0` solo — devuelve el manifiesto otra vez.
**No usar** `?source=blob` — devuelve 400.

### 3.2 Formato NDJSON

La respuesta es NDJSON (una línea JSON por evento). Cada línea es un
array de dos elementos:

```
[window_id, rrweb_event]
```

- `window_id` — identificador de la ventana del navegador donde ocurrió
  el evento. **No es el recording_id.** Los comentarios viejos en el
  código decían "recording_id" por error; ya están corregidos.
- `rrweb_event` — el evento rrweb con `type`, `timestamp` y `data`.

### 3.3 Compresión gzip con codificación latin1

PostHog comprime los campos grandes de los eventos con gzip, pero los
almacena como strings binarios con codificación **latin1**, no base64.

Para descomprimir correctamente:

```typescript
const buf = Buffer.from(data, "latin1");  // ← latin1, no base64
if (buf[0] === 0x1f && buf[1] === 0x8b) { // magic bytes de gzip
  return JSON.parse(gunzipSync(buf).toString("utf8"));
}
```

**Si se usa base64** el buffer resultante no pasa la verificación de
magic bytes gzip y los datos llegan comprimidos al player, que los
ignora silenciosamente. El video carga pero queda congelado.

Los campos que pueden llegar comprimidos:

| Tipo de evento | Campo comprimido |
|---|---|
| FullSnapshot (type 2) | `data` completo |
| IncrementalSnapshot (type 3) | `data.adds`, `data.attributes`, `data.removes`, `data.texts` |

---

## 4. Por qué un Replayer por window_id

Este es el diseño más importante del sistema y la razón por la que
**no se deben mezclar eventos de distintos window_id** en un mismo
rrweb-player.

### El problema

rrweb asigna IDs numéricos a cada nodo del DOM. Cuando hay un nuevo
FullSnapshot (type 2), esos IDs se reasignan desde 1. Si la sesión
tuvo múltiples ventanas del navegador (pestañas, popups, recargas),
cada ventana empieza sus IDs desde 1 independientemente.

Al mezclar eventos de dos ventanas en un solo Replayer, el mirror
interno de rrweb tiene el nodo ID=50 como `<meta>` (de la ventana 1)
y luego recibe una mutación que trata el ID=50 como `<div>` (de la
ventana 2). Al intentar llamar `setAttribute` en ese nodo se produce:

```
TypeError: e.setAttribute is not a function
```

### La solución

Mismo diseño que usa PostHog internamente: **un Replayer por
window_id**. La API route selecciona el window_id con más eventos
(la ventana principal) y lo sirve en exclusiva al player.

```typescript
// route.ts
const currentWindow = windowIds.reduce((best, id) =>
  (byWindow[id]?.length ?? 0) > (byWindow[best]?.length ?? 0) ? id : best
);
const events = byWindow[currentWindow];
```

### Qué se pierde

Si la sesión tuvo actividad en múltiples ventanas simultáneas, solo
se reproduce la ventana principal. Esto es aceptable porque:

- La mayoría de sesiones ocurren en una sola pestaña.
- El window_id con más eventos siempre corresponde al flujo principal.
- PostHog hace lo mismo en su propio player.

### ⚠️ Riesgo alto

Si alguien cambia `downloadSnapshots` para devolver `unknown[]` en
lugar de `Record<string, unknown[]>`, o si alguien concatena todos los
eventos antes de pasarlos al player, el error `setAttribute is not a
function` reaparecerá en grabaciones largas. Este diseño es intencional
y no debe revertirse.

---

## 5. Nodos null en FullSnapshot

PostHog incluye entradas `null` en los arrays `childNodes` de sus
FullSnapshots para representar elementos bloqueados o enmascarados
(inputs, elementos con `data-ph-mask`, etc.).

rrweb-player estándar no espera nulls y crashea con:

```
Cannot read properties of undefined (reading 'type')
```

La función `sanitizeNode()` en `recordings.ts` filtra recursivamente
todos los nulls antes de pasar el árbol al player. **No eliminar esta
función.**

---

## 6. Variables de entorno requeridas

```bash
POSTHOG_PROJECT_ID=415134          # ID numérico del proyecto
POSTHOG_API_KEY=phx_...            # Personal API Key — solo servidor, nunca frontend
POSTHOG_HOST=https://us.i.posthog.com
```

La `POSTHOG_API_KEY` (`phx_...`) es distinta a la Project API Key
(`phc_...`) que va en el script del sitio cliente. La `phx_...` da
acceso completo a la API privada y **nunca debe llegar al cliente ni
commitearse al repositorio**.

Está en `.gitignore` y debe mantenerse solo en `.env.local`.

---

## 7. Cómo se vinculan grabaciones con sesiones

PostHog identifica visitantes por `distinct_id`. En nuestra
implementación, `posthog.identify(visitor_id)` hace que el
`distinct_id` de PostHog sea exactamente nuestro `visitor_id`.

Para obtener grabaciones de un visitante:

```
1. GET /persons/?distinct_id={visitor_id}
     → devuelve person_uuid (≠ distinct_id)

2. GET /session_recordings/?person_uuid={person_uuid}
     → devuelve lista de grabaciones del visitante
```

**No se puede usar `distinct_id` directamente** en el endpoint de
grabaciones — devuelve 400. Siempre hay que resolver primero el
`person_uuid`.

El `session_id` (nuestro identificador interno) se lee de
`recording.person.properties.session_id`, que PostHog registra porque
el script del sitio llama `posthog.register({ session_id })`. Si no
está presente, se hace una llamada adicional al endpoint de detalle de
la grabación.

---

## 8. Comportamiento de sesiones múltiples y grabaciones

PostHog tiene su propio timeout de inactividad de 30 minutos. Si un
visitante regresa al sitio antes de que pasen 30 minutos, PostHog
extiende la misma grabación en lugar de crear una nueva.

Nuestra plataforma crea sesiones separadas (por `session_id` en
`sessionStorage`), por lo que puede haber más sesiones que grabaciones.
En ese caso, dos sesiones distintas apuntarán al mismo `recording_id`.
Ambas reproducirán el mismo video completo — que incluye actividad de
las dos visitas juntas. Esto es esperado y no es un bug.

---

## 9. Múltiples FullSnapshots dentro de la misma ventana

El diseño de `window_id` previene el crash cuando los FullSnapshots vienen
de ventanas distintas. Pero dentro de una sola ventana también pueden
existir múltiples FullSnapshots (por ejemplo, si rrweb reinicia la
grabación tras un período de inactividad o una recarga de página sin
nueva pestaña).

En la versión actual, una sola ventana con múltiples FullSnapshots se
pasa íntegra al player. rrweb maneja correctamente este caso en la
mayoría de las versiones: al encontrar un nuevo type 2, reconstruye el
DOM desde cero con `mirror.reset()`.

**Si reaparece un crash en grabaciones de una sola ventana**, el siguiente
paso es segmentar los eventos por bloque de FullSnapshot: dividir en
`[type2_events..., hasta_el_siguiente_type2]` y reproducir un bloque a
la vez. Eso eliminaría cualquier ambigüedad residual de IDs entre
snapshots consecutivos.

---

## 10. Flujo objetivo con R2 — webhook y almacenamiento

El `plan.md` describe un flujo donde las grabaciones se descargan una
vez vía webhook y se almacenan en Cloudflare R2:

- Menor latencia al abrir una grabación (ya está descargada)
- No depende de la disponibilidad de PostHog en tiempo real
- Menor consumo de la API de PostHog

El webhook handler existe en
`app/api/webhooks/posthog/recording-ended/route.ts`. Actualmente
descarga los eventos pero no los almacena (R2 no está configurado).
Mientras R2 no esté activo, el sistema funciona descargando en tiempo
real con 1-3 segundos de latencia al abrir una grabación.

### ⚠️ Antes de activar R2

El webhook almacena **solo el `window_id` con más eventos** (la ventana
principal). Esto es correcto y consistente con lo que sirve la route de
snapshots. No cambiar esto a "aplanar todas las ventanas" — mezclar
`window_id` en el JSON almacenado reintroduciría el crash
`setAttribute is not a function` cuando esos eventos se lean de R2 y
se pasen al player.

---

## 11. Qué no tocar sin revisar este documento

| Qué | Por qué |
|---|---|
| Codificación latin1 en `decompressEventData` | Cambiar a base64 rompe la descompresión silenciosamente |
| Retorno `Record<string, unknown[]>` de `downloadSnapshots` | Cambiar a array plano causa `setAttribute is not a function` |
| `sanitizeNode()` en FullSnapshot | Eliminarla causa crash con "Cannot read properties of undefined" |
| `person_uuid` en `/session_recordings/` | Cambiar a `distinct_id` causa 400 |
| `POSTHOG_API_KEY` solo en servidor | Exposición en cliente compromete toda la cuenta PostHog |
| Lógica de ventana primaria en webhook | Aplanar todas las ventanas rompe R2 cuando se active |
