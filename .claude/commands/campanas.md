# Dominio: Campañas / Atribución

Contexto de trabajo para el dominio de atribución en BreezeMobile Flow.

## Archivos clave

- `app/campanas/page.tsx` — tabla de atribución por dimensión (source, medium, campaign, content)
- `lib/posthog/hogql.ts` → `getCampaignSummariesHogQL` — query de resumen por campaña
- `lib/data/types.ts` → `CampaignSummary`, `Attribution`

## Leer antes de cambiar

1. `docs/tracking/tracking-contract.md` — campos de atribución, reglas de sesión
2. `docs/architecture/data-flow-and-adapter.md` — cómo fluyen los UTMs desde eventos

## Contrato de datos

- Atribución es **de nivel sesión** — viene del primer evento de la sesión
- Los campos UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) se registran en `sessionStorage` al landing y se adjuntan a cada evento
- `campaign_id`, `adset_id`, `ad_id` son parámetros propios de Meta (fbclid no es un UTM)
- La atribución de una sesión **no se hereda** a sesiones posteriores del mismo visitante

## Caché (golden layer)

- `getCampaignSummariesHogQL` usa `runHogQLGolden` — caché de **900s (15 min)**
- Es parte de la capa golden: datos agregados que no necesitan frescura en tiempo real
- Se puede invalidar con `revalidateTag("golden")` si se necesita forzar refresh

## Tasa de conversión (whatsapp)

La "tasa WA" en la tabla de campañas = `whatsapp_clicks / sessions`.

**Reglas críticas:**
- `whatsapp_click` = señal anónima de alta intención, NO lead confirmado
- NO mostrar como "tasa de conversión de ventas"
- NO llamar "lead" a una sesión con `whatsapp_click`
- NO mostrar revenue o ROAS sin datos comerciales reales

## No tocar

- Significado de `whatsapp_click` — nunca llamarlo lead, venta o conversión comercial
- Campos de atribución en `tracking-contract.md`
- Lógica de atribución por sesión (no por visitante, no heredada)
