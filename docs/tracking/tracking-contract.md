# Tracking Contract

## 1. Objetivo del contrato

Este documento define cómo deben entenderse los datos de tracking en la fase actual.

El objetivo es que PostHog, dataLayer, Google Tag Manager y la interfaz puedan relacionar los mismos eventos, sesiones y visitantes sin perder contexto.

La regla principal es:

> Todos los datos de comportamiento, atribución y grabaciones deben poder relacionarse con el mismo visitor_id y session_id.

## 2. Fuentes y destinos de datos

En la fase actual, los datos vienen principalmente del navegador cuando el visitante entra a la página web.

El tracking propio captura datos de sesión, visitante, página, evento y atribución.

Estos datos pueden ir a distintos destinos:

```txt
Tracking del navegador
  → dataLayer
  → Google Tag Manager
  → Meta Pixel / etiquetas configuradas

Tracking del navegador
  → PostHog
  → Eventos, sesiones y grabaciones

PostHog
  → Plataforma
  → Sesiones, eventos, grabaciones y comportamiento
```

## 3. Rol de cada herramienta

### Tracking propio

Genera y mantiene el contrato de datos.

Debe encargarse de capturar:

- visitor_id;
- session_id;
- event_id;
- página;
- servicio;
- evento;
- datos de atribución;
- datos de CTA;
- datos técnicos necesarios.

### dataLayer

Funciona como capa de comunicación para Google Tag Manager.

Debe recibir eventos estructurados para que GTM pueda activar etiquetas o validaciones.

### Google Tag Manager

Funciona como orquestador de etiquetas y validación.

Debe permitir:

- revisar si los eventos llegan;
- revisar si los campos esperados existen;
- activar etiquetas como Meta Pixel cuando corresponda;
- ayudar a detectar campos faltantes.

### PostHog

Debe ser la fuente principal para:

- eventos de comportamiento;
- sesiones;
- grabaciones;
- mapas de calor cuando se integren;
- análisis visual de comportamiento.

La plataforma debe leer datos de PostHog de forma segura, preferiblemente desde el servidor, no exponiendo API keys en el frontend.

### Interfaz de la plataforma

Debe unir la información de tracking, GTM/dataLayer y PostHog en un mismo perfil de visitante.

Debe mostrar datos faltantes o incompletos de forma visible.

## 4. Eventos obligatorios V0

Los eventos obligatorios de la fase actual son:

```txt
page_view_custom
service_click
whatsapp_click
```

### page_view_custom

Indica que el visitante cargó o visitó una página relevante.

### service_click

Indica que el visitante hizo clic en un elemento relacionado con un servicio.

### whatsapp_click

Indica que el visitante hizo clic en un botón o enlace de WhatsApp.

En esta fase, whatsapp_click debe tratarse como conversión anónima o señal de alta intención, no como lead confirmado.

## 5. Campos esperados

Los eventos deben incluir, cuando aplique:

```txt
visitor_id
session_id
event_id
event_name
timestamp
page_url
page_path
page_title
referrer
service
cta_text
cta_location
link_url
utm_source
utm_medium
utm_campaign
utm_content
utm_term
campaign_id
adset_id
ad_id
fbclid
fbp
fbc
```

## 6. Relación entre datos

La plataforma debe poder relacionar:

```txt
visitor_id → múltiples session_id
session_id → múltiples event_id
session_id → grabación de PostHog
session_id → atribución de campaña
session_id → página y servicio
visitor_id → historial completo de comportamiento
```

La interfaz no debe depender solo de métricas agregadas. Debe permitir entrar al detalle del visitante y revisar su recorrido.

## 7. Campos faltantes

Si falta un campo esperado, la interfaz debe mostrarlo de forma clara.

Ejemplos:

- campo vacío;
- etiqueta de advertencia;
- estado en rojo;
- alerta en Tracking Health;
- mensaje de campo no disponible.

La plataforma no debe ocultar silenciosamente problemas de tracking.

## 8. Grabaciones

Las grabaciones deben venir de PostHog.

Cada grabación debe relacionarse con:

- visitor_id;
- session_id;
- timestamp;
- eventos de la sesión;
- fuente;
- campaña;
- página;
- servicio.

La meta es poder ver grabaciones dentro de la plataforma y no como un elemento aislado sin contexto.

## 9. Mapas de calor

Los mapas de calor son una necesidad importante para el producto, pero su implementación depende de la capacidad real de PostHog o de la estrategia técnica elegida.

Deben tratarse como parte del análisis de comportamiento visual, junto con grabaciones y eventos.

## 10. Datos personales

En la fase actual no se deben enviar datos personales.

No enviar a PostHog, dataLayer, GTM o Meta Pixel:

- nombre;
- correo;
- teléfono;
- cédula;
- placa;
- dirección exacta;
- información personal identificable.

Sí se pueden enviar identificadores técnicos anónimos y datos de atribución.

## 11. Futuro: leads identificados

En fases futuras, cuando existan formularios u otros mecanismos de captura de datos personales, el visitante anónimo podrá convertirse en lead identificado.

En ese momento se deberá documentar:

- qué datos personales se capturan;
- dónde se guardan;
- qué datos no se envían a herramientas de analítica;
- cómo se conecta el lead con sesiones anteriores;
- reglas de privacidad y seguridad.

## 12. Reglas para modificaciones

Una IA, programador o colaborador no debe modificar sin autorización:

- nombres de eventos;
- estructura de payloads;
- visitor_id;
- session_id;
- event_id;
- claves de localStorage/sessionStorage;
- reglas de privacidad;
- lógica de atribución;
- integraciones con PostHog;
- configuración relacionada a GTM o Meta Pixel.

Cualquier cambio en el contrato de tracking debe documentarse antes de implementarse.
