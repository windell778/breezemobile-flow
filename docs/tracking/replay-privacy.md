# Privacidad y masking en Session Replay

_Última actualización: 2026-05-16_

Este documento define qué elementos del sitio BreezeMobile deben estar
enmascarados en PostHog Session Replay, cuáles se pueden capturar sin
restricción, y cuáles deben ocultarse completamente.

Es la fuente de verdad para decisiones de masking en replay. Cualquier
cambio en los niveles de masking debe actualizarse aquí primero.

---

## Principios generales

- **Sin PII en replay.** El tracking V0 no captura nombre, correo, teléfono,
  cédula ni ningún dato personal. El replay tampoco debe capturarlos.
- **Modo conservador por defecto.** Ante la duda, enmascarar. Es más fácil
  desactivar masking que recuperar datos que no debieron grabarse.
- **El masking es en el browser.** PostHog enmascara el DOM antes de enviar
  los snapshots rrweb. Los datos nunca llegan a PostHog en texto claro si
  están correctamente marcados.

---

## Niveles de masking

PostHog Session Replay soporta tres niveles, análogos a los de OpenReplay:

| Nivel | Atributo HTML | Efecto en el replay |
|---|---|---|
| **Capture** (visible) | `data-ph-unmask` | Capturado y visible en el player |
| **Masked** (oscurecido) | `data-ph-mask` | Texto reemplazado por `***`, layout preservado |
| **No capture** (oculto) | `data-ph-no-capture` | Elemento eliminado del snapshot; área queda en blanco |

PostHog también enmascara inputs por defecto — todos los `<input>` y
`<textarea>` se oscurecen a menos que se configure explícitamente lo contrario.

---

## Reglas para BreezeMobile V0

### Elementos que SIEMPRE deben ir masked o no-capture

Aunque V0 no tiene formularios con PII, estas reglas aplican desde el inicio
para que no haya riesgo si el sitio evoluciona:

| Elemento | Nivel recomendado | Razón |
|---|---|---|
| Cualquier `<input type="text/email/tel">` | `masked` (default PostHog) | Puede contener PII si se agrega un formulario |
| Cualquier `<input type="password">` | `no-capture` | Nunca debe grabarse |
| Campos de teléfono o correo visibles en UI | `masked` | PII |
| Números de cédula o identificación | `no-capture` | PII sensible |
| Precios específicos (si se agregan en futuro) | `masked` | Confidencial comercial |

### Elementos seguros de capturar en V0

| Elemento | Justificación |
|---|---|
| Botones de WhatsApp (texto del CTA) | Texto estático de marketing, sin PII |
| Nombres de servicios | Datos del catálogo, no del usuario |
| Páginas de servicio | Contenido público |
| Navegación y menús | Contenido público |
| Parámetros UTM en URL | Atribución de campaña, no PII |

### Elementos con decisión pendiente

| Elemento | Estado | Decisión necesaria |
|---|---|---|
| Chat embebido (si se agrega) | ⚠️ Pendiente | Enmascarar todo el iframe o `no-capture` completo |
| Formularios de cotización (V3+) | ⚠️ Pendiente | Definir qué campos van masked vs no-capture |
| Mapas o ubicaciones | ⚠️ Pendiente | Depende de si muestran dirección del usuario |

---

## Configuración en PostHog

PostHog Session Replay se configura en el script de inicialización:

```javascript
posthog.init('<PROJECT_API_KEY>', {
  session_recording: {
    maskAllInputs: true,           // todos los inputs → masked por defecto
    maskInputFn: (text, element) => {
      // Opcionalmente: lógica custom por tipo de input
      if (element.type === 'password') return '***';
      return text;
    },
  },
});
```

Para marcar elementos específicos en el HTML:

```html
<!-- Capturar aunque maskAllInputs esté activo -->
<input data-ph-unmask placeholder="Buscar servicio..." />

<!-- Ocultar texto pero preservar layout -->
<span data-ph-mask>texto sensible</span>

<!-- Eliminar completamente del snapshot -->
<div data-ph-no-capture>contenido confidencial</div>
```

---

## Relación con `sanitizeNode()` en BreezeMobile

Cuando PostHog enmascara un elemento con `data-ph-mask` o similar, el
snapshot rrweb incluye nodos `null` en los arrays `childNodes`. rrweb-player
estándar no maneja estos nulls y crashea.

`lib/posthog/recordings.ts` → `sanitizeNode()` filtra todos los nulls
recursivamente antes de pasar los eventos al player. **No eliminar esta
función.** Es la razón por la que el player no crashea con elementos
enmascarados.

Ver `docs/architecture/recordings.md §5` para detalles del crash y la fix.

---

## Lo que nunca debe capturarse

Independientemente del masking:

❌ Nombre completo del visitante  
❌ Correo electrónico  
❌ Número de teléfono  
❌ Cédula o documento de identidad  
❌ Dirección postal  
❌ Datos de tarjeta de crédito  
❌ Contraseñas  
❌ Tokens de autenticación  

Si alguno de estos datos aparece en el sitio en el futuro (formularios,
áreas de cuenta, etc.), debe ir marcado con `data-ph-no-capture` antes
de que el sitio salga a producción.

---

## Referencias

- `docs/tracking/tracking-contract.md §10` — reglas generales de PII
- `docs/architecture/recordings.md §5` — `sanitizeNode()` y nulls de PostHog
- PostHog docs: Session Replay privacy controls
