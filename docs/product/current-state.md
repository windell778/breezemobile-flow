# Current State

## 1. Estado general

El proyecto se encuentra en una etapa inicial entre tracking confiable e interfaz de visitantes anónimos.

Actualmente existe una aplicación Next.js con una interfaz V0 que usa datos mock compatibles con la forma esperada de los datos reales.

El objetivo actual no es solo mejorar la interfaz, sino conectar y validar datos reales de tracking, PostHog, grabaciones y Google Tag Manager.

## 2. Lo que ya existe

La aplicación ya tiene una estructura visual y funcional inicial para:

- Dashboard inicial.
- Sesiones.
- Eventos.
- Grabaciones.
- Campañas y fuentes.
- Servicios y páginas.
- Tracking Health.
- Visitor Intelligence.

También existe una estructura mock para:

- visitantes;
- sesiones;
- eventos;
- atribución;
- grabaciones;
- campañas;
- servicios;
- campos de tracking;
- alertas de tracking health.

## 3. Lo que la UI actual representa

La UI actual representa una versión inicial de cómo debería sentirse el producto:

- moderna;
- clara;
- enfocada en comportamiento;
- enfocada en visitantes;
- conectada a campañas y anuncios;
- capaz de mostrar eventos y grabaciones;
- consciente de los límites de la fase actual.

Debe tratarse como base real para mejorar, no como un prototipo descartable.

## 4. Lo que todavía no existe

Todavía no existe o no está confirmado:

- conexión real a PostHog API;
- carga real de grabaciones desde PostHog;
- mapas de calor reales;
- integración real entre datos de PostHog y datos de GTM dentro de la app;
- validación visual de campos faltantes desde datos reales;
- base de datos propia;
- autenticación;
- multi-tenant;
- integración con formularios;
- conversión de visitante anónimo a lead identificado;
- transcripción de llamadas;
- inteligencia artificial sobre llamadas;
- métricas de ventas o revenue;
- documentación completa de desarrollo.

## 5. Objetivo inmediato

El objetivo inmediato es terminar la fase de captación, relación y visualización inicial de datos de visitantes.

Para considerar esta fase terminada, la plataforma debe poder:

- recibir o leer datos reales de tracking;
- relacionar eventos con visitor_id y session_id;
- mostrar sesiones reales;
- mostrar datos de atribución reales;
- mostrar grabaciones reales de PostHog dentro de la plataforma;
- relacionar cada grabación con el visitante correcto;
- mostrar campos faltantes o incompletos;
- mantener la interfaz simple y comprensible.

## 6. Definición de victoria de la fase actual

La victoria real de esta fase es:

> Poder abrir un perfil de visitante y ver, con datos reales, de qué anuncio vino, qué página vio, qué eventos hizo, si hizo clic en WhatsApp, qué datos faltan y cuál grabación de PostHog corresponde a esa sesión.

## 7. Riesgos actuales

Los riesgos principales son:

- seguir agregando pantallas sin conectar datos reales;
- mostrar métricas que todavía no existen;
- llamar lead a un visitante que solo hizo una acción anónima;
- perder la relación entre PostHog, GTM y el perfil del visitante;
- construir una UI atractiva pero sin certeza de datos;
- mezclar datos personales antes de tener reglas claras de privacidad;
- depender de una sola herramienta sin validar el flujo completo.

## 8. Próximo enfoque recomendado

El siguiente enfoque debe ser:

1. Documentar el contrato de tracking.
2. Crear una capa adapter para separar mock data de datos reales.
3. Conectar PostHog de forma segura desde servidor.
4. Mostrar grabaciones reales relacionadas a sesiones.
5. Representar datos de GTM/dataLayer dentro del perfil.
6. Mostrar campos faltantes en Tracking Health.
7. Mantener la UI actual como base y mejorarla solo cuando los datos lo justifiquen.
