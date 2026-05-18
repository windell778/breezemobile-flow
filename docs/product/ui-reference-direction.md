# Direccion visual para rediseño

_Creado: 2026-05-17_

Este documento traduce referencias externas como OpenPanel, Dub, TwentyCRM
y OpenReplay en criterios de diseño para BreezeMobile Flow Intelligence.
No define una arquitectura visual cerrada. Su objetivo es dar direccion,
no congelar layouts.

La UI puede cambiar bastante: paneles, tablas, split views, sidebars,
densidad, jerarquia, cards y navegacion visual. Lo que no puede cambiar
es el significado de los datos ni los flujos funcionales estabilizados.

Antes de implementar cualquier rediseño, leer tambien:

- `docs/product/interface-map-v1.md`
- `docs/product/redesign-guardrails.md`
- `docs/development/ai-handoff-guide.md`
- `docs/architecture/data-flow-and-adapter.md §15`
- `docs/architecture/recordings.md` si el cambio toca replay

---

## 1. Personalidad visual del producto

BreezeMobile Flow debe sentirse como:

- un centro operativo de comportamiento anonimo;
- una herramienta de atribucion y sesiones;
- un explorador de visitantes y grabaciones;
- una interfaz rapida, densa y clara para tomar decisiones;
- una capa propia encima de PostHog, no un clon de PostHog.

No debe sentirse como:

- CRM;
- dashboard generico de BI;
- panel financiero;
- Meta Ads Manager;
- Google Analytics clonado;
- landing page SaaS;
- prototipo decorativo con metricas inventadas.

La sensacion deseada es: **precisa, sobria, moderna, operacional y rapida**.

---

## 2. Como usar referencias externas

No copiar pantallas completas. Extraer patrones.

Una referencia sirve para responder:

- como organizan densidad de datos;
- como jerarquizan filtros y tablas;
- como manejan navegacion secundaria;
- como presentan estados vacios y errores;
- como reducen ruido visual;
- como hacen que una interfaz compleja se sienta rapida.

Una referencia no autoriza:

- copiar el modelo de negocio;
- copiar metricas que no existen;
- copiar modulos fuera de fase;
- cambiar rutas o semantica de datos;
- convertir el producto en CRM, BI o growth dashboard.

---

## 3. Referencias permitidas y que tomar

### OpenPanel

Tomar:

- densidad de analytics sin sentirse pesado;
- tablas legibles con filtros claros;
- dashboards que priorizan interpretacion rapida;
- separacion entre exploracion de eventos y resumen;
- estilo de herramienta tecnica-operativa.

No tomar:

- BI generico;
- graficas por llenar espacio;
- metricas sin accion;
- navegacion que esconda visitor/session context.

Uso recomendado:

- `/sesiones`
- `/eventos`
- `/campanas`
- `/tracking`

---

### Dub

Tomar:

- limpieza visual;
- jerarquia clara en cards y tablas;
- uso sobrio de bordes, spacing y estados;
- sensacion SaaS moderna y ligera;
- microcopy corto y humano.

No tomar:

- logica de links como producto central;
- metricas de growth/revenue;
- paginas con tono marketing;
- visuales demasiado promocionales.

Uso recomendado:

- `AppShell`
- resumen general `/`
- cards de campanas/servicios
- empty states

---

### TwentyCRM

Tomar:

- velocidad percibida;
- layout de herramienta de trabajo;
- listas densas y escaneables;
- paneles laterales o inspectors si ayudan a ver detalle sin perder lista;
- consistencia de controles.

No tomar:

- pipeline CRM;
- conceptos de cuentas/contactos/deals;
- estados comerciales;
- labels que impliquen lead calificado o venta.

Uso recomendado:

- posible layout lista + detalle para `/sesiones`;
- Visitor Intelligence como panel de detalle rico;
- patrones de navegacion rapida.

---

### OpenReplay

Tomar:

- foco en replay como evidencia;
- timeline de eventos alrededor de la grabacion;
- estados claros cuando no hay replay;
- separacion entre video, eventos y metadata tecnica.

No tomar:

- complejidad de plataforma completa de replay;
- features de error monitoring o frontend monitoring fuera de V1;
- configuraciones avanzadas que no existen en el producto.

Uso recomendado:

- `/grabaciones`
- tab Grabaciones en Visitor Intelligence
- timeline y estados del player

---

## 4. Direccion de layout

No hay layout final obligatorio. Se pueden explorar estas formas:

- tabla/lista principal con inspector lateral;
- split view lista + detalle;
- panel superior de filtros + tabla densa;
- cards compactas cuando el contenido es resumido;
- tabs para detalle de visitante;
- drawer tecnico para payloads o debug;
- dashboard con secciones operativas, no pared de KPIs.

Preferencias:

- mantener alta densidad sin comprimir texto hasta hacerlo ilegible;
- priorizar lectura horizontal en desktop;
- que cada fila/celda tenga una accion clara;
- que los filtros activos sean visibles y faciles de limpiar;
- que el contexto `visitor_id + session_id` siempre sea recuperable;
- que el replay tenga suficiente espacio visual.

Evitar:

- hero sections;
- cards gigantes decorativas;
- gradientes dominantes;
- orbes/burbujas decorativas;
- layouts de landing page;
- modales innecesarios para tareas frecuentes;
- UI que esconda tablas utiles para verse "minimal".

---

## 5. Reglas por vista

### Resumen general

Debe responder rapido: que esta pasando, que fuente/campana/servicio destaca,
donde hay problemas de tracking y que sesiones recientes conviene abrir.

Puede cambiar:

- distribucion de secciones;
- cantidad de cards visibles;
- agrupacion de alertas;
- uso de paneles o columnas.

No debe convertirse en:

- dashboard financiero;
- BI generico;
- pagina de marketing;
- ranking de ventas.

---

### Sesiones

Es el nucleo operativo. Debe ser la vista mas eficiente para encontrar,
filtrar y abrir visitantes.

Patrones recomendados:

- tabla/lista densa;
- fila completa clickeable;
- acciones secundarias claras;
- filtros persistentes;
- IDs cortos con tooltip/title;
- notas contextuales como "Incluye eventos de X".

No romper:

- link de fila a Visitor Intelligence;
- boton "Ver grabacion" independiente;
- paginacion con filtros activos;
- semantica ampliada de `service`;
- `campaign/source/medium/content` como filtros explicitos.

---

### Visitor Intelligence

Debe sentirse como el expediente anonimo del visitante, no como ficha CRM.

Patrones recomendados:

- header persistente con visitante/sesion/contexto;
- tabs claros;
- resumen narrativo;
- timeline/journey;
- tecnico separado;
- grabaciones visibles como seccion importante.

No debe mostrar:

- nombre, telefono, email;
- pipeline;
- lead status;
- revenue;
- scoring predictivo.

---

### Grabaciones

Debe priorizar el player y el timeline. La metadata acompaña, no domina.

Patrones recomendados:

- player grande;
- timeline legible;
- lista de sesiones del scope;
- badges para eventos que coinciden con filtro;
- estados "sin grabacion" claros.

No romper:

- `RRWebPlayer`;
- API `/api/recordings/*`;
- agrupacion por `window_id`;
- seek con margen;
- notas de servicio filtrado.

---

### Campanas y Servicios

Deben ayudar a navegar a sesiones, no convertirse en dashboards de marketing.

Patrones recomendados:

- tablas/cards compactas;
- ranking por senal;
- acciones "Ver sesiones";
- parametros explicitos por dimension.

No mostrar:

- costo;
- ROAS;
- CPA/CPL;
- conversion confirmada;
- ventas.

---

### Eventos y Estado del tracking

Son vistas tecnico-operativas. Pueden ser mas densas y menos "comerciales".

Patrones recomendados:

- tablas claras;
- labels humanos como principal;
- nombres tecnicos como secundario;
- severidad y recomendaciones concretas;
- payloads/datos crudos solo donde correspondan.

---

## 6. Componentes visuales que conviene preparar

Antes o durante el rediseño, conviene estandarizar:

- `PageHeader`: titulo, descripcion, acciones opcionales.
- `FilterBar`: busqueda + filtros + estado compacto.
- `ActiveFilterChips`: chips activos con limpieza.
- `DataState`: loading, empty, error, unavailable.
- `KpiGrid`: grid de metricas compacto.
- `SessionRow` o `SessionListItem`: fila reutilizable.
- `RecordingPanel`: player + estado + metadata.
- `EventTimeline`: timeline compartido para replay/journey.
- `TechnicalSection` o `TechnicalDrawer`: datos crudos y debug.

No crear un design system enorme antes de necesitarlo. Extraer componentes
cuando reduzcan duplicacion real o protejan patrones criticos.

---

## 7. Copy y lenguaje visual

Usar labels humanos:

- Visitante
- Sesion
- Fuente
- Medio
- Campana
- Anuncio / Creativo
- Servicio
- Evento
- CTA tocado
- Ubicacion del CTA
- Grabacion
- Estado del tracking

Reservar nombres tecnicos para texto secundario, tecnico o debug:

- `utm_source`
- `session_id`
- `visitor_id`
- `event_name`
- `page_path`
- `campaign_id`
- `adset_id`
- `ad_id`

Evitar:

- "lead confirmado";
- "venta";
- "revenue";
- "ROAS";
- "pipeline";
- "deal";
- "conversion" si implica venta o lead confirmado.

---

## 8. Checklist antes de implementar rediseño

Antes de cambiar UI, responder:

- Que vista se rediseña?
- Que referencia inspira esta vista y que patron se toma?
- Que flujo funcional debe seguir funcionando?
- Que rutas y query params se preservan?
- Que estados vacios/error deben mantenerse?
- Que datos son reales, inferidos o faltantes?
- Que no debe aparecer en esta vista?
- Que pruebas manuales se haran despues?

Si una respuesta no esta clara, pausar y leer:

- `docs/product/interface-map-v1.md`
- `docs/product/redesign-guardrails.md`
- `docs/development/where-to-change-what.md`

