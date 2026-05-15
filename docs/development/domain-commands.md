# Comandos de dominio para Claude (.claude/commands/)

_Última actualización: 2026-05-15_

Este documento explica qué son los comandos de dominio, por qué existen,
cómo usarlos, y cómo agregar nuevos cuando sea necesario.

---

## 1. Qué son y por qué existen

Los comandos de dominio son archivos Markdown en `.claude/commands/` que
Claude Code puede invocar con `/nombre-del-comando`. Cada archivo contiene
el contexto específico de un dominio de la app: qué archivos tocar, qué
contratos respetar, qué no tocar, y cómo funciona el caché.

### El problema que resuelven

Este proyecto tiene reglas críticas distribuidas en múltiples documentos
(`tracking-contract.md`, `data-flow-and-adapter.md`, `recordings.md`,
`plan.md`). Sin un punto de entrada rápido, Claude o cualquier agente
tiene que leer toda la documentación antes de cada cambio — o arriesgarse
a romper algo.

Los comandos de dominio son atajos: condensan exactamente lo que hay que
saber para trabajar en un área sin tocar las demás.

### Inspiración

El patrón viene de `full-funnel-ai-analytics` (repositorio de referencia
en `/home/user/full-funnel-ai-analytics`), que usa `.claude/commands/`
con archivos por área de análisis (marketing, campaña, tráfico, pipeline).
Aquí se adaptó para dominios de UI/datos del producto.

---

## 2. Comandos disponibles

| Comando | Archivo | Dominio |
|---|---|---|
| `/dashboard` | `.claude/commands/dashboard.md` | Dashboard principal, KPIs, métricas |
| `/sesiones` | `.claude/commands/sesiones.md` | Lista de sesiones, filtros, tabla |
| `/visitantes` | `.claude/commands/visitantes.md` | Perfil de visitante, 7 tabs, journey |
| `/grabaciones` | `.claude/commands/grabaciones.md` | Player rrweb, snapshots, recordings |
| `/campanas` | `.claude/commands/campanas.md` | Atribución UTM, campañas, tasa WA |

---

## 3. Qué contiene cada comando

Cada archivo tiene la misma estructura:

```markdown
# Dominio: Nombre

## Archivos clave
Lista de los archivos relevantes para este dominio.

## Leer antes de cambiar
Documentación obligatoria antes de tocar código.

## Contrato de datos / Estructura / Caché
Lo específico de este dominio: tipos, TTLs, fuentes de datos.

## No tocar
Líneas rojas: qué no modificar y por qué.
```

---

## 4. Cómo invocar un comando

En una sesión de Claude Code, escribe el slash command en el chat:

```
/sesiones
```

Claude Code carga el contenido del archivo correspondiente y lo usa como
contexto para la conversación. No hay que repetirle las reglas del dominio
manualmente.

---

## 5. Cómo agregar un nuevo comando

1. Crear `.claude/commands/{nombre}.md` con la estructura del §3.
2. Incluir siempre:
   - Los archivos clave del dominio (rutas completas desde la raíz).
   - Los documentos de arquitectura relevantes que hay que leer antes de cambiar.
   - Las reglas de caché (qué función, qué TTL, qué tag).
   - Las líneas rojas — qué nunca modificar.
3. Documentar el nuevo comando en este archivo (tabla §2).

### Qué NO poner en un comando de dominio

- No duplicar el contrato de tracking completo — referenciar
  `docs/tracking/tracking-contract.md`.
- No incluir credenciales ni variables de entorno.
- No escribir instrucciones de diseño visual — los comandos son de
  arquitectura y datos, no de UI.

---

## 6. Relación con otros documentos

Los comandos de dominio son una **capa de entrada rápida**, no la fuente
de verdad. Si hay conflicto entre un comando y la documentación principal,
la documentación principal gana (ver jerarquía en `AGENTS.md`).

```
Jerarquía (más autoritativo primero):
  tracking-contract.md
  plan.md
  phases.md
  scope-and-non-goals.md
  otros docs en docs/
  .claude/commands/ (contexto de trabajo, no fuente de verdad)
```

---

## 7. Qué no hacer

- **No eliminar un comando de dominio** sin revisar si hay reglas críticas
  en él que no están duplicadas en otro documento.
- **No usar comandos para evadir la documentación principal.** Si un comando
  dice algo diferente a `tracking-contract.md`, el contrato gana siempre.
- **No crear comandos para tareas únicas.** Los comandos son para dominios
  persistentes del producto, no para features temporales o tareas de un día.
- **No poner lógica de negocio en los comandos.** El código vive en el código.
  Los comandos son documentación contextual, no instrucciones ejecutables.
