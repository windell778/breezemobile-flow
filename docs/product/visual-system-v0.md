# Sistema visual V0

_Última actualización: 2026-05-18_

Este documento define la base visual operativa de BreezeMobile Flow Intelligence.
Su objetivo es evitar que cada pantalla se rediseñe como una app distinta.

La plataforma es un command center de comportamiento y atribución. La interfaz
debe sentirse clara, rápida y confiable. No debe parecer un CRM genérico, una
landing page ni un dashboard decorativo.

---

## Principios

1. **Claridad antes que espectáculo**
   La UI debe ayudar a responder qué visitante hizo qué, desde dónde vino y si
   existe grabación. Evitar adornos que compitan con los datos.

2. **Una sola gramática visual**
   Dashboard, sesiones, grabaciones, eventos, campañas, servicios y tracking
   deben compartir paneles, tablas, filtros, badges y estados vacíos.

3. **Datos humanos primero**
   Usar labels como Visitante, Sesión, Fuente, Campaña, Servicio, Página,
   Evento, Grabación. Los nombres técnicos (`visitor_id`, `session_id`,
   `page_view_custom`) pueden aparecer como apoyo o en zonas técnicas.

4. **No inventar negocio**
   `whatsapp_click` es una señal anónima de alta intención. La UI nunca debe
   mostrar venta, revenue, ROAS o lead confirmado si no existen datos reales.

---

## Componentes base

### Panel

Usar `components/ui/Panel.tsx` para superficies principales. Debe tener borde
suave, fondo blanco, radio moderado y sombra ligera. No anidar paneles salvo que
el segundo panel sea una lista o un player que realmente necesita marco propio.

### StatTile

Usar `StatTile` para métricas pequeñas. Debe mostrar:

- label en mayúscula discreta;
- número en `font-mono`;
- detalle opcional en texto secundario.

No usar StatTile para métricas comerciales que no existen.

### FilterBar y FilterChip

Usar `FilterBar` para búsqueda y filtros. Los chips activos deben ser claros,
pero no deben saturar la vista. Los filtros temporales o aplicados desde otra
vista pueden usar tono ámbar.

### DataTable

Usar `DataTable` para tablas operativas. Las filas deben ser escaneables, con
líneas divisorias suaves y hover discreto. Si una fila completa es clickeable,
los botones internos deben tener `z-index` y `pointer-events` para no romper su
acción independiente.

### EmptyState

Usar `EmptyState` cuando una vista no tenga datos, resultados o grabación. El
mensaje debe explicar el estado sin sonar a error si el escenario es normal.

Ejemplo:

> Sin grabación disponible. La sesión existe, pero PostHog no generó replay para
> esta visita.

---

## Densidad

La densidad objetivo es media. La app debe caber bien en escritorio, pero sin
comprimir tanto que parezca una tabla técnica. Reglas:

- tablas con filas de al menos 48px;
- títulos de pantalla claros, no gigantes;
- números importantes en `font-mono`;
- no usar texto menor a 11px salvo badges muy cortos;
- evitar sombras grandes en pantallas operativas.

---

## Color

La base es clara, con grises azulados y acento azul. Verde se reserva para
tracking activo, replay disponible o señales positivas. Ámbar se reserva para
advertencias o filtros contextuales. Rojo se usa solo para errores o estados
críticos.

No usar gradientes decorativos ni paletas moradas dominantes.

---

## Motion

La app se usa para revisar datos con frecuencia. Las animaciones deben ser
breves y funcionales:

- hover discreto;
- `:active` sutil en links y botones;
- transiciones de color, borde, sombra y transform;
- no animar `width`, `height`, `top` o `left`;
- no agregar animaciones perpetuas en tablas o navegación.

---

## Riesgos a evitar

- Rediseñar solo el dashboard y dejar las demás rutas con otro lenguaje visual.
- Convertir cada métrica en una card grande.
- Repetir textos técnicos como contenido principal.
- Usar tablas tan densas que el usuario no pueda detectar señales.
- Ocultar grabaciones como detalle secundario.
- Mostrar estados vacíos como si fueran errores.
- Cambiar navegación o rutas sin revisar `docs/product/interface-map-v1.md`.

