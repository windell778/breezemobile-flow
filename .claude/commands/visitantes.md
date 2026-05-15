# Dominio: Visitantes / Visitor Intelligence

Contexto de trabajo para el dominio de visitor intelligence en BreezeMobile Flow.

## Archivos clave

- `app/visitantes/[visitorId]/page.tsx` — perfil de visitante con 7 tabs
- `lib/posthog/persons.ts` → `fetchVisitorProfile`, `fetchVisitorSessions`
- `lib/data/types.ts` → `Visitor`, `Session`, `TrackingEvent`

## Leer antes de cambiar

1. `docs/architecture/plan.md` — modelo de datos Visitor → Session → Event
2. `docs/tracking/tracking-contract.md` — visitor_id, session_id, cadena de identidad

## Estructura del perfil

```
Visitor
  ├── visitor_id (inmutable, generado en el browser)
  ├── first_seen / last_seen
  ├── session_count
  └── sessions[]
        └── Session
              ├── session_id (inmutable)
              ├── events[]
              ├── attribution (UTMs del landing de la sesión)
              └── recording? (opcional)
```

## Tabs actuales (7)

| Tab | Datos | Notas |
|-----|-------|-------|
| Resumen | Última actividad, servicio principal, fuente | |
| Grabaciones | Player + lista de sesiones con replay | Lee docs/architecture/recordings.md |
| Journey | Timeline cronológico de todas las sesiones | |
| Sesiones | Cards por sesión | |
| Eventos | Tabla de eventos de la sesión activa | |
| Atribución | Todos los campos UTM | |
| Técnico | JSON crudo del objeto sesión | |

## Caché

- `fetchVisitorProfile` y `fetchVisitorSessions` usan la API de Persons de PostHog
- Son queries por visitorId específico → caché de 60s (datos en vivo)
- Cada visitorId genera su propio cache key

## Identidad y privacidad

- `visitor_id` es anónimo — generado en el browser, sin PII
- No hay autenticación ni datos personales identificables
- `distinct_id` de PostHog = nuestro `visitor_id` (registrado via `posthog.identify`)

## No tocar

- Generación de `visitor_id` y `session_id` — líneas rojas del contrato
- Interpretación de `whatsapp_click` — nunca como lead o venta
- Privacidad: no agregar PII a perfiles de visitantes
