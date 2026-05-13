# AI Workflow

## 1. Objetivo

Este documento define cómo deben trabajar las herramientas de IA dentro del proyecto.

El objetivo es evitar trabajo desordenado, cambios no documentados y modificaciones que rompan el tracking.

## 2. Roles recomendados

### ChatGPT

Rol principal:

- planificación;
- revisión;
- definición de alcance;
- documentación estratégica;
- control de fases;
- creación de prompts para ejecución;
- revisión de entregables.

ChatGPT debe ayudar a decidir si una tarea va en la fase actual o debe esperar.

### Claude / Claude Pro

Rol principal:

- documentación larga;
- arquitectura;
- explicación de decisiones;
- redacción de documentos técnicos;
- análisis de producto.

Debe usarse para convertir ideas desordenadas en documentos serios.

### Claude Code

Rol principal:

- ejecución de código en local;
- cambios que tocan varios archivos;
- refactors;
- conexión de APIs;
- validación con lint/build;
- implementación de tareas definidas.

Claude Code debe recibir tareas claras, con alcance, fuera de alcance y reglas técnicas.

### Codex

Rol principal:

- tareas concretas;
- cambios de UI;
- componentes aislados;
- prototipos;
- refactors pequeños;
- ejecución sobre issues definidos.

Codex no debe modificar tracking crítico sin una tarea muy clara.

## 3. Fuente de verdad

La fuente de verdad del proyecto debe ser GitHub.

GitHub debe contener:

- código;
- documentación;
- issues;
- historial de cambios;
- decisiones importantes;
- pull requests cuando aplique.

Los chats sirven para pensar y ejecutar, pero las decisiones importantes deben terminar documentadas en el repo.

## 4. Flujo recomendado

```txt
Idea o problema
  → Planificación en ChatGPT
  → Issue o tarea definida
  → Ejecución con Claude Code o Codex
  → Prueba local
  → Commit / push
  → Revisión
  → Documentación actualizada
```

## 5. Formato recomendado de tarea

Cada tarea importante debe incluir:

```md
## Objetivo

## Contexto

## Alcance

## Fuera de alcance

## Archivos probablemente relacionados

## Reglas técnicas

## Criterios de aceptación

## Validación manual
```

## 6. Reglas para tareas de tracking

Antes de cambiar tracking, la IA debe revisar:

- eventos existentes;
- campos esperados;
- relación visitor_id/session_id/event_id;
- dataLayer;
- PostHog;
- GTM;
- reglas de privacidad.

No se debe cambiar sin autorización:

- nombres de eventos;
- claves de localStorage/sessionStorage;
- payloads;
- reglas de privacidad;
- lógica de atribución;
- conexión con PostHog;
- comportamiento de dataLayer;
- etiquetas o supuestos de GTM.

## 7. Reglas para tareas de UI

La UI debe mantener estos principios:

- moderna;
- clara;
- fácil de entender;
- no densa;
- no genérica;
- no CRM tradicional;
- enfocada en visitantes, sesiones, eventos, grabaciones y atribución.

La UI no debe mostrar datos que no existan.

Ejemplo: no mostrar ventas, revenue o ROAS si esos datos no están conectados.

## 8. Reglas de documentación

Cuando se agregue una función importante, se debe actualizar documentación si cambia:

- alcance del producto;
- fase actual;
- contrato de tracking;
- fuente de datos;
- flujo de IA;
- integración con PostHog;
- integración con GTM;
- reglas de privacidad.

## 9. Checklist antes de push

Antes de hacer push, revisar:

- la app corre en local;
- no hay errores visibles;
- no se rompió navegación principal;
- no se cambiaron contratos de tracking sin documentar;
- no se agregaron datos personales al tracking;
- no se agregaron métricas falsas;
- lint/build se corren cuando aplique.

Comandos útiles:

```bash
npm run dev
npm run lint
npm run build
```

## 10. Checklist después de una tarea

Después de terminar una tarea, resumir:

- qué se cambió;
- qué archivos fueron modificados;
- qué se probó;
- qué falta;
- qué riesgos quedan;
- si hay documentación que actualizar.

## 11. Regla central

La regla central del proyecto es:

> Nada importante debe quedar solo en un chat. Todo cambio relevante debe terminar en código, documentación o issue dentro de GitHub.
