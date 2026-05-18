# Guardrails del rediseño

_Creado: 2026-05-17_

Este documento define que puede cambiar durante el rediseño visual y que
no puede romperse. La arquitectura visual todavia no esta cerrada: se
pueden proponer paneles, tablas, split views, cards, inspectors, drawers
o nuevas composiciones. Pero el rediseño es una capa de presentacion, no
una autorizacion para cambiar el significado de los datos.

Regla central:

> El rediseño puede cambiar como se presenta la informacion, pero no puede
> cambiar que significan los datos ni los flujos funcionales ya estabilizados.

---

## 1. Puede cambiar

El rediseño puede modificar:

- `AppShell`, sidebar, topbar y navegacion visual;
- jerarquia de pagina;
- layout de tablas, cards, paneles y listas;
- orden visual de secciones;
- densidad, spacing, bordes, colores y tipografia;
- filtros como composicion visual;
- uso de split views o inspectors laterales;
- cards por filas o filas por cards si mejora lectura;
- responsive behavior;
- microcopy visual, siempre que respete las reglas de negocio.

Tambien puede proponer:

- nuevos componentes presentacionales;
- extraccion de componentes repetidos;
- agrupacion diferente de informacion dentro de una vista;
- drawers tecnicos para datos crudos;
- layouts distintos entre desktop y mobile.

---

## 2. No puede cambiar sin autorizacion

No cambiar durante rediseño:

- nombres de eventos: `page_view_custom`, `service_click`, `whatsapp_click`;
- significado de `whatsapp_click`;
- contrato de tracking;
- `visitor_id`, `session_id`, `event_id`;
- generacion de IDs en `breeze-scripts.js`;
- atribucion a nivel de sesion;
- DataAdapter como puerta unica de datos;
- PostHog server-side only;
- rutas base de la app;
- query params estabilizados;
- replay internals;
- tipos canonicos sin revisar docs;
- semantica de filtros estabilizados;
- documentos de fases/scope salvo que la tarea sea documentacion de producto.

No agregar:

- CRM;
- pipeline;
- lead confirmado;
- ventas;
- revenue;
- ROAS;
- CPA/CPL;
- scoring predictivo;
- IA;
- autenticacion como parte del rediseño visual;
- integraciones nuevas.

---

## 3. Contratos funcionales intocables

### DataAdapter

Las paginas deben seguir leyendo datos por `getAdapter()` y los metodos
del adapter. No llamar PostHog directamente desde componentes ni paginas
sin justificar y documentar una excepcion.

PostHog API keys nunca llegan al cliente.

### Rutas principales

Mantener estas rutas:

- `/`
- `/sesiones`
- `/visitantes/[visitorId]`
- `/grabaciones`
- `/campanas`
- `/servicios`
- `/eventos`
- `/tracking`

Se pueden cambiar labels y agrupacion visual de navegacion, pero no
romper deep links existentes.

### Visitor Intelligence

Debe seguir aceptando:

```text
/visitantes/[visitorId]?session=...&tab=...
```

La sesion activa debe preservarse al cambiar tabs.

Tabs esperadas en V1:

- Resumen
- Grabaciones
- Journey
- Sesiones
- Eventos
- Atribucion
- Tecnico / Datos tecnicos

Un tab invalido debe caer a Resumen sin romper.

### Sesiones

La fila completa debe seguir siendo clickeable hacia Visitor Intelligence.
El boton interno "Ver grabacion" debe seguir siendo clickeable de forma
independiente.

Patron actual:

- link de fila: capa `z-10`;
- boton interno: `z-20` / `pointer-events-auto`.

Si se rediseña la fila, validar manualmente ambos clicks.

### Grabaciones

No tocar sin leer `docs/architecture/recordings.md`:

- `RRWebPlayer`;
- `/api/recordings/[recordingId]/snapshots`;
- `lib/posthog/recordings.ts`;
- `blob_v2`;
- gzip latin1;
- `window_id`;
- sanitizacion de nodos;
- agrupacion de ventanas.

El player puede cambiar de contenedor visual, pero no de contrato de datos.

---

## 4. Filtros y navegacion que no deben romperse

### Servicio

El filtro `service` no significa solamente `session.service`.

Debe mantenerse:

```typescript
session.service === service ||
session.events.some((event) => event.service === service)
```

Esto aplica a:

- `/sesiones?service=...`
- `/grabaciones?service=...`

No simplificar. Romperia la consistencia con `/servicios`, que agrega por
`event.service`.

### Nota "Incluye eventos de X"

Debe seguir apareciendo cuando:

```typescript
service &&
session.service !== service &&
session.events.some((event) => event.service === service)
```

Puede cambiar su diseño visual, pero no desaparecer sin reemplazo
equivalente.

### Badge "Coincide con filtro"

En replay/timeline, los eventos cuyo `event.service` coincide con el
servicio filtrado deben seguir siendo reconocibles.

Puede cambiar de badge a borde, color o indicador, pero debe existir.

### `__missing__`

`__missing__` representa "Sin anuncio" en la dimension `content`.

Significa:

- `utm_content` vacio;
- `ad_id` vacio.

No mostrar `__missing__` como texto de negocio. La UI muestra "Sin anuncio".

### Campanas -> sesiones

Los links programaticos hacia `/sesiones` deben usar parametros explicitos:

- `?campaign=...`
- `?source=...`
- `?medium=...`
- `?content=...`

No usar `?q=` para navegacion programatica desde dashboard o campañas.
`?q=` queda solo para busqueda manual del usuario.

---

## 5. Estados que deben conservarse

Cada vista rediseñada debe contemplar:

- loading;
- empty;
- error/unavailable si aplica;
- datos faltantes;
- sin grabacion;
- sin UTMs;
- fuente directa/organica sin atribucion pagada;
- replay no disponible;
- filtro activo sin resultados.

No ocultar huecos de tracking. Si falta un campo, mostrar "Sin dato",
"Sin campaña", "Sin anuncio" o estado equivalente segun contexto.

---

## 6. Datos reales, inferidos y no existentes

La UI debe distinguir:

Datos reales:

- `visitor_id`;
- `session_id`;
- `event_id`;
- eventos capturados;
- UTMs cuando existen;
- grabaciones disponibles en PostHog.

Inferencias:

- `source`;
- `intent_level`;
- resumen narrativo de visitante;
- algunos agregados derivados de eventos.

Datos no existentes en V1:

- lead confirmado;
- venta;
- revenue;
- ROAS;
- costo de campaña;
- calificacion comercial;
- datos personales.

No diseñar espacios para datos no existentes como si fueran actuales.

---

## 7. Validacion minima despues de rediseñar

Despues de cualquier rediseño no trivial:

```bash
npm run lint
npm run build
```

Probar manualmente:

- `/`
- `/sesiones`
- `/sesiones?service=suspension`
- `/sesiones?campaign=campana_frenos_mayo` o una campaña real visible
- `/campanas?dimension=content`
- `/grabaciones`
- `/grabaciones?service=suspension`
- `/eventos?event=whatsapp_click`
- un `/visitantes/[visitorId]?session=...&tab=grabaciones` real
- `/tracking`

Validar que:

- no hay rutas 404/500;
- la sesion activa se preserva;
- los filtros activos se ven y se pueden limpiar;
- la fila de sesion y el boton "Ver grabacion" funcionan;
- el replay no se rompe;
- no aparece `__missing__` como texto visible;
- no aparece lead/venta/revenue/ROAS;
- datos tecnicos no dominan vistas principales.

---

## 8. Como trabajar con una IA de diseño

Antes de implementar, la IA debe entregar una propuesta breve:

- vista a rediseñar;
- referencia usada y patron tomado;
- archivos que tocaria;
- flujos que deben seguir funcionando;
- estados vacios/error que conservara;
- riesgos.

No pedir "rediseña toda la app" en una sola tarea. Orden recomendado:

1. `AppShell` y navegacion visual.
2. `/sesiones`.
3. Visitor Intelligence.
4. `/grabaciones`.
5. `/campanas` y `/servicios`.
6. `/eventos` y `/tracking`.

Cada etapa debe dejar la app usable antes de pasar a la siguiente.

