# Scope and Non-Goals

## 1. Alcance de la fase actual

La fase actual está enfocada en construir la base de tracking, unificación y visualización de visitantes anónimos.

El objetivo no es construir todas las funciones finales del producto, sino dejar lista la estructura correcta para que las siguientes fases se puedan desarrollar sobre datos confiables.

## 2. Alcance funcional

Esta fase sí incluye:

### Tracking y datos

- Captar eventos de comportamiento del visitante.
- Captar datos de atribución como UTMs, campaign_id, adset_id, ad_id, fbclid, fbp y fbc.
- Mantener visitor_id y session_id para relacionar sesiones y eventos.
- Captar eventos relevantes como page_view_custom, service_click y whatsapp_click.
- Leer datos desde PostHog cuando sea necesario para eventos, sesiones y grabaciones.
- Leer o representar datos capturados mediante dataLayer y Google Tag Manager.
- Mostrar campos faltantes o incompletos como problemas visibles de tracking.

### Perfil de visitante

- Crear una vista de visitante anónimo.
- Relacionar en el mismo perfil:
  - sesiones;
  - eventos;
  - fuente;
  - campaña;
  - anuncio;
  - servicio visto;
  - página visitada;
  - clics importantes;
  - grabaciones;
  - campos técnicos de tracking.

### Grabaciones y comportamiento

- Mostrar una sección de grabaciones dentro de la plataforma.
- Relacionar cada grabación con su sesión y visitante correspondiente.
- Usar PostHog como fuente principal para grabaciones y comportamiento visual.
- Preparar el producto para mapas de calor cuando la integración lo permita.

### Interfaz

- Construir una interfaz moderna, clara y fácil de entender.
- Evitar que la interfaz sea densa o difícil para usuarios no técnicos.
- Mostrar dashboard, sesiones, eventos, campañas, servicios, grabaciones, tracking health y visitor intelligence.
- Priorizar claridad sobre complejidad visual.

## 3. Fuera de alcance en esta fase

Esta fase no incluye todavía:

- CRM completo.
- Gestión avanzada de leads.
- Pipeline comercial.
- Cotizaciones.
- Ventas.
- Revenue.
- ROAS.
- Costos de campaña cruzados con ventas reales.
- Transcripción de llamadas.
- Resumen de llamadas con IA.
- Detección de patrones en llamadas.
- Automatizaciones de seguimiento comercial.
- Multi-tenant completo.
- Facturación SaaS.
- Portal final de clientes.
- Optimización automática de anuncios.

## 4. Conversión anónima

En esta fase, un clic en WhatsApp debe tratarse como una conversión anónima.

No debe tratarse todavía como lead real, porque el sistema aún no está captando información personal como nombre, teléfono o correo dentro de la plataforma.

Términos recomendados para esta fase:

- Conversión anónima.
- Evento de alta intención.
- Señal de intención.

Términos a evitar en esta fase:

- Venta.
- Cliente.
- Lead confirmado.
- Revenue.
- ROAS.

## 5. Reglas de alcance

Toda nueva función debe pasar por estas preguntas:

1. ¿Esta función ayuda a validar o visualizar datos reales de tracking?
2. ¿Esta función ayuda a relacionar eventos, sesiones, atribución y grabaciones?
3. ¿Esta función depende de datos que ya capturamos?
4. ¿Esta función pertenece realmente a esta fase?
5. ¿Puede construirse sin romper el contrato de tracking?

Si la respuesta es no, la función debe moverse a una fase posterior.

## 6. Principio de decisión

La prioridad de construcción es:

```txt
Datos confiables → Relación de datos → Perfil de visitante → Interfaz clara → Inteligencia comercial → SaaS escalable
```

La plataforma no debe avanzar hacia fases comerciales si todavía no puede demostrar con certeza:

- de dónde vino el visitante;
- qué sesión tuvo;
- qué eventos realizó;
- qué grabación corresponde a esa sesión;
- qué datos faltan o están incompletos.
