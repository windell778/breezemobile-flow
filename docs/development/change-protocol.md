# Change Documentation Protocol

**Versión:** 1.0
**Fecha:** Mayo 2026
**Estado:** Activo

---

## 1. Objetivo

Este documento define cómo cualquier IA, programador o colaborador debe
documentar los cambios que haga en el proyecto.

El objetivo es evitar cambios difíciles de entender, decisiones perdidas
en chats, modificaciones sin contexto y alteraciones accidentales del
tracking, la interfaz o el alcance del producto.

Todo cambio importante debe dejar una explicación clara de:

- qué se cambió;
- por qué se cambió;
- qué archivos fueron modificados;
- cómo funciona;
- cómo validarlo;
- qué riesgos quedan;
- qué documentación fue actualizada;
- qué queda pendiente.

---

## 2. Niveles de cambio

No todos los cambios requieren el mismo nivel de documentación.

| Nivel | Cuándo aplica | Reporte requerido |
|---|---|---|
| **Micro** | Fix de texto, ajuste de estilo, typo, comentario | Solo commit message claro |
| **Estándar** | Nueva vista, componente, query, mock, ruta | Secciones 4.1 a 4.6 |
| **Arquitectural** | Tracking, PostHog, GTM, modelo de datos, fases, storage | Reporte completo + documentación actualizada |

Ante la duda, usar el nivel superior.

---

## 3. Instrucción general antes de programar

Antes de programar, cualquier IA o programador debe revisar:

- la documentación del proyecto;
- el alcance de la fase actual (`docs/product/phases.md`);
- el contrato de tracking (`docs/tracking/tracking-contract.md`);
- el plan de arquitectura (`docs/architecture/plan.md`);
- el estado actual de la app (`docs/product/current-state.md`);
- la tarea solicitada;
- los archivos probablemente relacionados.

Antes de tocar código, confirmar:

1. La tarea pertenece a la fase actual.
2. La tarea no inventa datos que todavía no existen.
3. La tarea no convierte la plataforma en CRM genérico.
4. La tarea no modifica tracking crítico sin autorización.
5. La tarea no cambia PostHog, GTM/dataLayer o payloads sin documentarlo.
6. La tarea no agrega ventas, revenue, ROAS o lead confirmado sin datos reales.

> Primero entender el contexto. Después modificar. Al final documentar el cambio.

---

## 4. Formato de reporte después de programar

### 4.1 Resumen del cambio

Explicar en lenguaje claro qué se hizo.

Ejemplo:

```txt
Se agregó una vista de sesiones filtrable por evento, fuente y servicio.
La vista permite abrir Visitor Intelligence manteniendo la sesión activa.
```

### 4.2 Archivos modificados

Listar todos los archivos tocados.

Ejemplo:

```txt
app/sesiones/page.tsx
components/layout/NavLinks.tsx
lib/mock-data.ts
```

### 4.3 Cómo funciona

Explicar la lógica principal del cambio. Incluir:

- flujo del usuario;
- datos usados;
- estados relevantes;
- relación con otras vistas o componentes.

### 4.4 Qué no se debe tocar

Indicar explícitamente qué partes quedaron protegidas o no deben
cambiarse sin autorización.

Ejemplo:

```txt
No cambiar nombres de eventos.
No cambiar visitor_id/session_id.
No cambiar el significado de whatsapp_click.
No mostrar lead confirmado, venta o revenue.
```

### 4.5 Cómo validarlo

Indicar pasos concretos de validación.

Ejemplo:

```txt
1. Abrir /sesiones.
2. Filtrar por whatsapp_click.
3. Abrir Ver visitante.
4. Confirmar que el visitante abre en Resumen.
5. Abrir Ver replay.
6. Confirmar que abre Grabaciones con la sesión activa.
```

Comandos cuando apliquen:

```bash
npm run lint
npm run build
```

### 4.6 Riesgos

Listar riesgos o puntos a vigilar.

Ejemplo:

```txt
El mock todavía no confirma cómo PostHog devolverá recordings reales.
La UI muestra replay placeholder hasta conectar API real.
```

### 4.7 Documentación actualizada

Indicar si se actualizó documentación.

Si no se actualizó:

```txt
No se actualizó documentación porque el cambio no modificó alcance,
tracking, PostHog, GTM/dataLayer ni flujo de producto.
```

### 4.8 Pendientes

Listar lo que queda por hacer relacionado con este cambio.

### 4.9 Commit sugerido

Proponer un mensaje de commit en formato convencional.

Ejemplo:

```txt
feat: add session explorer filters
```

---

## 5. Cambios de UI

Si el cambio es de UI, el reporte debe documentar:

- qué vista cambió;
- qué componentes cambiaron;
- qué navegación cambió;
- qué estados visuales se agregaron;
- qué datos se muestran;
- qué datos no se muestran;
- qué labels humanos se usaron;
- si hay cambios mobile/responsive;
- cómo se validó visualmente.

La UI debe mantener estos principios:

- moderna;
- clara;
- rápida de escanear;
- enfocada en visitantes, sesiones, eventos, atribución y grabaciones;
- no CRM tradicional;
- no dashboard genérico;
- sin ventas, revenue o ROAS si no existen datos reales.

Campos técnicos como `visitor_id`, `session_id`, `event_id`, `utm_source`
o `event_name` pueden mostrarse, pero deben vivir principalmente en zonas
técnicas o como texto secundario.

---

## 6. Cambios de tracking

Si el cambio toca tracking, el reporte debe documentar:

- qué evento se agregó o modificó;
- qué payload cambió;
- qué campos son obligatorios;
- qué campos son opcionales;
- cómo se conserva `visitor_id`;
- cómo se conserva `session_id`;
- cómo se genera o conserva `event_id`;
- si cambia la lógica de atribución;
- si cambia localStorage o sessionStorage;
- si cambia la privacidad;
- cómo se valida en navegador;
- cómo se valida en PostHog;
- cómo se valida en GTM/dataLayer.

Cambios de tracking siempre deben revisar:

- `page_view_custom`;
- `service_click`;
- `whatsapp_click`;
- UTMs;
- `campaign_id`, `adset_id`, `ad_id`;
- `fbclid`, `fbp`, `fbc`;
- reglas de no enviar PII.

---

## 7. Cambios de PostHog

Si el cambio toca PostHog, el reporte debe documentar:

- qué endpoint o API se usa;
- si la llamada ocurre server-side;
- qué variables de entorno se necesitan;
- qué datos se leen;
- cómo se normalizan al modelo interno;
- cómo se relaciona PostHog con `visitor_id`;
- cómo se relaciona PostHog con `session_id`;
- cómo se relacionan grabaciones con sesiones;
- qué pasa si no hay grabación;
- límites, rate limits o riesgos conocidos;
- cómo se evita exponer API keys en frontend.

> Nunca exponer una API key privada de PostHog en el frontend.

---

## 8. Cambios de GTM/dataLayer

Si el cambio toca GTM o dataLayer, el reporte debe documentar:

- qué evento se empuja a dataLayer;
- qué campos incluye;
- qué etiqueta o trigger podría activar GTM;
- si afecta Meta Pixel;
- si afecta `whatsapp_click`;
- si cambia el evento Lead de Meta;
- cómo se valida en modo preview de GTM;
- cómo se compara con PostHog;
- qué campos se usan solo para validación.

> dataLayer/GTM ayudan a validar y activar etiquetas, pero no son la
> base histórica principal de la interfaz.

---

## 9. Cambios de documentación

Si el cambio es de documentación, el reporte debe incluir:

- qué documento se creó o modificó;
- qué problema resuelve;
- qué decisiones deja claras;
- qué documentos relacionados debería leer una IA o programador;
- si cambia alcance, fases, tracking, PostHog, GTM/dataLayer o UI;
- si hay documentos pendientes.

Los cambios importantes de documentación deben evitar duplicar información
sin motivo. Si un documento nuevo complementa a otro, debe explicarlo.

---

## 10. Jerarquía de documentos

En caso de conflicto entre documentos, aplicar esta prioridad:

1. `docs/tracking/tracking-contract.md` — fuente de verdad de eventos,
   payloads, atribución y privacidad. Siempre tiene prioridad.
2. `docs/architecture/plan.md` — decisiones técnicas y modelo de datos.
3. `docs/product/phases.md` — alcance y fases.
4. `docs/product/scope-and-non-goals.md` — qué no construir.
5. Cualquier otro documento de `docs/`.

Si hay conflicto entre dos documentos del mismo nivel, tiene prioridad
el más reciente según fecha de modificación. Documentar el conflicto
y resolverlo actualizando el documento de menor prioridad.

---

## 11. Checklist antes de push

- [ ] La tarea está terminada o sus límites están claros
- [ ] No se modificó tracking crítico sin autorización
- [ ] No se cambiaron nombres de eventos sin documentarlo
- [ ] No se rompió `visitor_id`, `session_id` ni `event_id`
- [ ] No se agregó PII al tracking
- [ ] No se muestran ventas, revenue o ROAS sin datos reales
- [ ] No se llama lead confirmado a un `whatsapp_click`
- [ ] No se expone API key privada
- [ ] La navegación principal sigue funcionando
- [ ] La documentación fue actualizada si cambió alcance, datos o integración
- [ ] Se corrió validación cuando aplica

```bash
npm run lint
npm run build
```

---

## 12. Cosas que nunca deben cambiarse sin autorización

- nombres de eventos
- significado de eventos
- estructura de payloads
- generación de `visitor_id`, `session_id`, `event_id`
- claves de localStorage y sessionStorage
- reglas de atribución
- reglas de privacidad
- integración con PostHog, GTM/dataLayer, Meta Pixel
- interpretación de `whatsapp_click`
- textos que conviertan `whatsapp_click` en lead confirmado
- pantallas que muestren ventas, revenue o ROAS sin datos reales
- lógica que herede UTMs de una sesión anterior
- lógica que una visitantes distintos sin evidencia
- API keys o secretos
- documentos de alcance sin dejar claro el motivo

```txt
whatsapp_click = conversión anónima / señal de alta intención
whatsapp_click ≠ lead confirmado
whatsapp_click ≠ venta
whatsapp_click ≠ revenue
```

---

## 13. Instrucciones para AGENTS.md y CLAUDE.md

El contenido de esta sección vive en inglés en `AGENTS.md` para que
cualquier IA lo cargue en contexto al inicio de cada sesión.

Ver `AGENTS.md` para la versión comprimida y ejecutable de este protocolo.

---

## 14. Regla final

Nada importante debe quedar solo en el chat.

Todo cambio relevante debe terminar en:

- código;
- documentación;
- issue;
- pull request;
- o reporte claro dentro del historial del proyecto.

La documentación no es un paso extra. Es parte del trabajo.
