# Requisitos de integración para sitios cliente

_Última actualización: 2026-05-14_

Este documento describe qué debe incluir el script de tracking de cualquier sitio web para integrarse correctamente con BreezeMobile Flow.

---

## Resumen de componentes requeridos

| Componente | Obligatorio | Propósito |
|---|---|---|
| posthog-js SDK | Sí | Grabaciones de sesión (rrweb automático) |
| `posthog.identify(visitor_id)` | Sí | Vincular PostHog distinct_id con nuestro visitor_id |
| `posthog.register({...})` | Sí | Adjuntar visitor_id y session_id a todos los eventos |
| Evento `page_view_custom` | Sí | Registro de páginas vistas |
| Evento `service_click` | Según sitio | Click en servicios del negocio |
| Evento `whatsapp_click` | Según sitio | Click en botón de WhatsApp |
| visitor_id en `localStorage` | Sí | Persistencia del visitante entre sesiones |
| session_id en `sessionStorage` | Sí | Aislamiento de sesión por pestaña/visita |

---

## 1. Inicialización de posthog-js

```js
posthog.init('phc_CLAVE_PUBLICA_DEL_PROYECTO', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: false,   // manejamos page_view_custom manualmente
  capture_pageleave: true,
  autocapture: false,
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-ph-mask]'  // elementos a ocultar del replay
  }
});
```

**Notas:**
- La clave `phc_...` es la **Project API Key** (pública, puede estar en el frontend).
- Nunca usar la **Personal API Key** (`phx_...`) en el frontend — esa es solo server-side.
- `capture_pageview: false` es obligatorio para evitar duplicados con `page_view_custom`.
- `session_recording` habilita rrweb automáticamente. Sin esto no hay grabaciones.

---

## 2. Gestión de visitor_id

```js
var VISITOR_KEY = 'breeze_visitor_id';
var visitorId = localStorage.getItem(VISITOR_KEY) || '';
if (!visitorId) {
  visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  localStorage.setItem(VISITOR_KEY, visitorId);
}
```

**Reglas:**
- Prefijo obligatorio: `visitor_`
- Formato: `visitor_{timestamp}_{random7chars}`
- Persiste en `localStorage['breeze_visitor_id']`
- Nunca contiene PII

---

## 3. Gestión de session_id

```js
var SESSION_KEY = 'breeze_session';
var session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');

if (!session) {
  session = {
    session_id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    started_at: new Date().toISOString(),
    landing_page: window.location.href,
    // ... UTMs y demás campos de atribución
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
```

**Reglas:**
- Prefijo obligatorio: `sess_`
- Formato: `sess_{timestamp}_{random7chars}`
- Persiste en `sessionStorage['breeze_session']` (se resetea al cerrar pestaña)
- Una nueva sesión se crea si llegan UTMs distintos a los de la sesión activa

---

## 4. Identificación en PostHog

```js
posthog.identify(visitorId, {
  session_id: session.session_id,
  service: session.service || '',
  utm_source: session.utm_source || '',
  utm_medium: session.utm_medium || '',
  utm_campaign: session.utm_campaign || '',
  // ... resto de campos de atribución
});
```

**Crítico:** `posthog.identify(visitorId)` hace que el `distinct_id` de PostHog sea exactamente nuestro `visitor_id`. Esto permite que la plataforma busque grabaciones por `person_uuid` a partir del `visitor_id`. Sin esta llamada, las grabaciones no se pueden vincular al perfil del visitante.

---

## 5. Registro de propiedades globales

```js
posthog.register({
  visitor_id: visitorId,
  session_id: session.session_id,
  service: session.service || '',
  page_path: window.location.pathname || '',
  utm_source: session.utm_source || '',
  utm_medium: session.utm_medium || '',
  utm_campaign: session.utm_campaign || '',
  utm_content: session.utm_content || '',
  utm_term: session.utm_term || '',
  campaign_id: session.campaign_id || '',
  adset_id: session.adset_id || '',
  ad_id: session.ad_id || '',
  fbclid: getFbclid(),
  fbp: getCookie('_fbp'),
  fbc: getCookie('_fbc'),
  landing_page: session.landing_page || '',
  referrer: document.referrer || ''
});
```

Esto adjunta estos campos a **todos** los eventos de PostHog, incluyendo los de grabación de sesión (`$snapshot`).

---

## 6. Eventos requeridos

### page_view_custom

Disparar en cada carga de página (no usar el autocapture de PostHog).

```js
posthog.capture('page_view_custom', {
  visitor_id: visitorId,
  session_id: session.session_id,
  event_id: 'page_view_custom_' + session.session_id + '_' + Date.now(),
  page_url: window.location.href,
  page_path: window.location.pathname,
  page_title: document.title,
  referrer: document.referrer || '',
  service: session.service || '',
  // ... UTMs y atribución
});
```

### service_click

Disparar cuando el usuario hace click en un servicio específico del negocio.

```js
posthog.capture('service_click', {
  // mismos campos base
  service: 'nombre_del_servicio',  // snake_case
  cta_location: 'header' | 'hero' | 'card' | ...,
  cta_text: 'texto del botón',
  link_url: 'URL de destino'
});
```

### whatsapp_click

Disparar exclusivamente cuando el usuario hace click en un botón que abre WhatsApp.

```js
posthog.capture('whatsapp_click', {
  // mismos campos base
  cta_location: 'ubicación del botón',
  cta_text: 'texto del botón',
  link_url: 'https://wa.me/...',
  fbclid: getFbclid(),
  fbp: getCookie('_fbp'),
  fbc: getCookie('_fbc')
});
```

**Importante:** `whatsapp_click` es una señal de alta intención anónima. No es un lead confirmado, no es una venta, no es revenue.

---

## 7. Campos de atribución

Capturar en cada nueva sesión desde los parámetros de URL:

| Campo | Parámetro URL | Descripción |
|---|---|---|
| `utm_source` | `?utm_source=` | Fuente (facebook, google, ...) |
| `utm_medium` | `?utm_medium=` | Medio (paid_social, cpc, organic, ...) |
| `utm_campaign` | `?utm_campaign=` | Nombre de campaña |
| `utm_content` | `?utm_content=` | Creativo o variante |
| `utm_term` | `?utm_term=` | Término o segmento |
| `campaign_id` | `?campaign_id=` | ID de campaña en Meta/Google |
| `adset_id` | `?adset_id=` | ID de conjunto de anuncios |
| `ad_id` | `?ad_id=` | ID de anuncio específico |
| `fbclid` | `?fbclid=` | Click ID de Facebook |

Cookies de Facebook (si Meta Pixel está activo):
- `_fbp` — Facebook Browser ID
- `_fbc` — Facebook Click ID cookie

---

## 8. Reglas de privacidad

- Ningún evento debe contener nombre, teléfono, correo, cédula u otro dato personal.
- Los inputs de formularios se enmascaran automáticamente via `maskAllInputs: true`.
- Agregar `data-ph-mask` a cualquier elemento adicional que deba ocultarse del replay.
- No capturar números de placa ni otros datos sensibles del negocio.

---

## 9. Variables de entorno en la plataforma

Para activar la integración en BreezeMobile Flow:

```bash
DATA_SOURCE=posthog
POSTHOG_PROJECT_ID=415134       # ID del proyecto en PostHog
POSTHOG_API_KEY=phx_...         # Personal API Key — NUNCA commitear
POSTHOG_HOST=https://us.i.posthog.com
```

La `POSTHOG_API_KEY` (`phx_...`) es distinta a la `Project API Key` (`phc_...`):
- `phc_...` — va en el script del sitio web (pública)
- `phx_...` — va en `.env.local` del servidor (privada, nunca en frontend)

---

## 10. Servicios compatibles con `service_click`

Los valores actuales de `service` reconocidos por la plataforma:

```
aire_acondicionado
cambio_aceite
frenos
suspension
general
```

Para agregar nuevos servicios, actualizar `lib/data/types.ts` (`ServiceKey`) y `lib/labels.ts` (`serviceLabels`).

---

## Referencia de implementación

El script de referencia completo está en `breeze-scripts_2.js` (sitio de BreezeMobile).
El contrato técnico completo de eventos está en `docs/tracking/tracking-contract.md`.
