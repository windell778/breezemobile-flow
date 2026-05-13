# Project Overview

> Documento de proyecto. El nombre operativo actual del repositorio es `BreezeMobile Flow`, pero el nombre del producto puede cambiar en el futuro. Por eso, este documento usa principalmente los términos "la plataforma", "el sistema" o "el producto".

## 1. Propósito del proyecto

La plataforma busca ayudar a una persona o negocio que corre anuncios hacia una página web a entender qué ocurre después del clic.

El problema principal que resuelve es:

> Saber qué está pasando en la página web y qué anuncios publicitarios están trayendo mejores visitantes, mejores señales de intención y mejores oportunidades comerciales.

La plataforma no se limita a mostrar métricas generales de campañas. Su objetivo es conectar comportamiento, atribución, eventos y grabaciones en un mismo perfil de visitante.

## 2. Usuario inicial

El usuario inicial es una persona, negocio o equipo que:

- corre anuncios de Facebook / Meta Ads;
- envía tráfico a una página web o landing page;
- usa botones de contacto, especialmente WhatsApp;
- necesita saber qué anuncios generan visitantes con mejor intención;
- quiere revisar comportamiento real, sesiones, eventos y grabaciones.

En la fase inicial, el caso base es un negocio que no utiliza todavía un embudo con llamada. El contacto principal ocurre mediante un botón de WhatsApp.

## 3. Resultado esperado para el usuario

El usuario debe poder entrar a la plataforma y responder preguntas como:

- ¿De dónde vino este visitante?
- ¿Qué campaña, anuncio o UTM lo trajo?
- ¿Qué página vio?
- ¿Qué servicio le interesó?
- ¿Hizo clic en WhatsApp?
- ¿Qué eventos ocurrieron en su sesión?
- ¿Existe grabación de esa sesión?
- ¿Falta algún dato importante de tracking?
- ¿Qué anuncios parecen traer mejores visitantes?

## 4. Concepto central

La plataforma debe unir en un solo perfil de visitante los datos que hoy suelen estar separados en varias herramientas.

Flujo base de esta fase:

```txt
Anuncio / UTM → Página web → Sesión → Eventos → Grabación → Perfil de visitante
```

Flujo futuro del producto:

```txt
Anuncio → Página web → Sesión → Evento → Conversión anónima → Lead → Llamada → Transcripción → Resumen IA → Patrones comerciales → Venta
```

## 5. Qué estamos construyendo ahora

En la fase actual se está construyendo una base para:

- conectar datos de PostHog;
- mostrar grabaciones de sesiones dentro de la plataforma;
- leer y visualizar datos capturados por tracking propio, dataLayer y Google Tag Manager;
- relacionar datos técnicos, eventos, atribución y grabaciones en el mismo perfil de visitante;
- mostrar alertas cuando falten datos esperados;
- crear una interfaz moderna, clara y fácil de entender;
- preparar la arquitectura para fases posteriores.

## 6. Qué no estamos construyendo ahora

En esta fase no se busca construir todavía:

- un CRM completo;
- un sistema completo de ventas;
- transcripción de llamadas;
- IA de análisis comercial de llamadas;
- automatizaciones comerciales avanzadas;
- ROAS, revenue o métricas financieras si no están conectadas a datos reales;
- multi-tenant avanzado;
- portal SaaS final para múltiples clientes;
- optimización automática de campañas.

La regla principal es:

> No construir funciones que dependan de datos que todavía no se capturan o no se relacionan de forma confiable.

## 7. Dirección visual y experiencia

La interfaz debe sentirse:

- moderna;
- llamativa;
- premium;
- fácil de entender;
- poco densa;
- útil para personas no técnicas;
- diferente a un CRM tradicional;
- diferente a un dashboard SaaS genérico.

La plataforma debe sentirse como un command center simple para entender visitantes, campañas, eventos y grabaciones.

La innovación visual debe ayudar a comprender el recorrido del visitante, no solo decorar la interfaz.

## 8. Principio de producto

El principio central del producto es:

> Primero datos confiables y correctamente relacionados. Después interfaz más avanzada, automatización, inteligencia comercial y SaaS escalable.

Esto significa que la fase actual no se considera terminada solo por tener una UI atractiva. Se considera terminada cuando el tracking, los eventos, las sesiones, la atribución y las grabaciones se pueden relacionar con certeza dentro del mismo perfil de visitante.
