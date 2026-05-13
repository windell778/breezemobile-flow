# Product Phases

## Principio general

El producto debe crecer por fases. Cada fase debe construir una base real para la siguiente.

El orden de prioridad es:

```txt
Tracking confiable → Visitantes anónimos → Leads → Llamadas → Inteligencia comercial → SaaS multi-cliente
```

No se deben construir módulos avanzados si los datos de las fases anteriores todavía no son confiables.

---

## Fase 0 — Tracking confiable

### Objetivo

Confirmar que el sistema captura correctamente los datos técnicos y de comportamiento necesarios para entender qué ocurre en la página web.

### Incluye

- Instalación y validación del tracking propio.
- Captura de visitor_id.
- Captura de session_id.
- Captura de event_id.
- Captura de UTMs.
- Captura de campaign_id, adset_id y ad_id.
- Captura de fbclid, fbp y fbc.
- Envío correcto de eventos a dataLayer / GTM.
- Envío correcto de eventos a PostHog.
- Validación en Meta Events Manager cuando aplique.
- Confirmación de que no se envía información personal.

### Resultado esperado

Se puede comprobar que los eventos básicos existen, contienen los campos esperados y se pueden relacionar por visitante y sesión.

---

## Fase 1 — Interfaz de visitantes anónimos

### Objetivo

Construir la interfaz inicial que une sesiones, eventos, atribución y grabaciones en un mismo perfil de visitante anónimo.

### Incluye

- Dashboard inicial.
- Módulo de sesiones.
- Módulo de eventos.
- Módulo de campañas/fuentes.
- Módulo de servicios/páginas.
- Módulo de grabaciones.
- Tracking Health.
- Visitor Intelligence.
- Visualización de campos faltantes.
- Relación entre PostHog, dataLayer/GTM y datos técnicos de tracking.

### Resultado esperado

El usuario puede abrir un visitante y ver:

- sesiones;
- eventos;
- fuente;
- campaña;
- anuncio;
- servicio;
- página;
- conversión anónima;
- grabación;
- campos técnicos;
- datos faltantes.

---

## Fase 2 — Leads y contacto comercial

### Objetivo

Conectar el comportamiento anónimo con datos reales de lead cuando el usuario deje información personal mediante formularios, WhatsApp u otro canal integrado.

### Incluye

- Formularios.
- Captura de nombre, teléfono, correo u otros datos permitidos.
- Conversión de visitante anónimo a lead identificado.
- Relación entre lead y sesiones previas.
- Historial del recorrido antes de convertirse.
- Integraciones con CRM o herramientas comerciales si son necesarias.

### Resultado esperado

El sistema puede mostrar qué hizo una persona antes de convertirse en lead.

---

## Fase 3 — Cotizaciones, ventas y resultado comercial

### Objetivo

Relacionar el comportamiento y los leads con resultados comerciales reales.

### Incluye

- Cotizaciones.
- Estados comerciales.
- Ventas.
- Valor de oportunidad.
- Resultado de cada lead.
- Relación entre campaña, comportamiento, lead y venta.

### Resultado esperado

El sistema puede comenzar a responder qué campañas y comportamientos están generando oportunidades o ventas reales.

---

## Fase 4 — Llamadas e inteligencia comercial

### Objetivo

Agregar análisis de llamadas para entender qué se habló con los leads y qué patrones comerciales se repiten.

### Incluye

- Grabación o importación de llamadas.
- Transcripción de llamadas.
- Resumen automático con IA.
- Identificación de objeciones.
- Identificación de intención.
- Detección de patrones repetidos.
- Relación entre llamada, lead, campaña, sesión y resultado comercial.

### Resultado esperado

La plataforma no solo muestra qué hizo el usuario en la web, sino también qué ocurrió en la conversación comercial posterior.

---

## Fase 5 — Inteligencia de campañas

### Objetivo

Crear una capa de análisis que ayude a decidir qué campañas, anuncios, páginas y servicios están generando mejores resultados.

### Incluye

- Comparación entre campañas.
- Comparación entre anuncios.
- Calidad de visitantes.
- Calidad de leads.
- Relación entre anuncios y comportamiento.
- Relación entre anuncios y llamadas.
- Relación entre anuncios y ventas.
- Detección de patrones.
- Recomendaciones asistidas.

### Resultado esperado

El sistema ayuda a tomar mejores decisiones de marketing basadas en comportamiento, conversaciones y resultados reales.

---

## Fase 6 — SaaS multi-cliente

### Objetivo

Convertir el sistema en una plataforma vendible para múltiples clientes.

### Incluye

- Multi-tenant.
- Autenticación.
- Roles y permisos.
- Onboarding de clientes.
- Configuración de tracking por cliente.
- Panel de cliente.
- Gestión de integraciones.
- Facturación o planes.
- Seguridad y privacidad avanzada.

### Resultado esperado

La plataforma puede ser usada por distintos negocios o agencias sin mezclar datos entre clientes.

---

## Regla de avance entre fases

Una fase no debe considerarse completa solo porque exista una interfaz.

Debe considerarse completa cuando:

- los datos existen;
- los datos se capturan correctamente;
- los datos se relacionan correctamente;
- la interfaz no inventa información;
- los campos faltantes se detectan;
- el sistema puede ser validado manualmente.

## Estado actual esperado

El estado actual se ubica entre:

```txt
Fase 0 — Tracking confiable
Fase 1 — Interfaz de visitantes anónimos
```

La UI inicial ya existe con datos mock, pero el objetivo real es conectar datos reales y confirmar que PostHog, dataLayer/GTM y las grabaciones se pueden unir en un mismo perfil de visitante.
