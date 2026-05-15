# Dominio: Dashboard

Contexto de trabajo para el dashboard principal de BreezeMobile Flow.

## Archivos clave

- `app/page.tsx` — dashboard principal
- `components/dashboard/RecentSessions.tsx` — widget de sesiones recientes
- `components/ui/MetricCard.tsx` — tarjeta de KPI (con barra decorativa)
- `lib/posthog/hogql.ts` → `getDashboardMetricsHogQL` — métricas agregadas
- `lib/data/types.ts` → `DashboardMetrics`

## Leer antes de cambiar

1. `docs/product/scope-and-non-goals.md` — qué NO mostrar en el dashboard
2. `docs/product/phases.md` — fase actual y qué está en scope

## Caché (golden layer)

- `getDashboardMetricsHogQL` usa `runHogQLGolden` — caché de **900s (15 min)**
- `getCampaignSummariesHogQL` y `getServiceSummariesHogQL` también son golden (900s)
- Las métricas del dashboard son datos agregados; no necesitan frescura de 60s
- `RecentSessions` usa `listSessions` con caché de 60s (datos en vivo)

## Qué se puede mostrar

✅ Sesiones totales, visitantes únicos  
✅ WhatsApp clicks (señal de intención, NO ventas)  
✅ Service clicks  
✅ Tasa de replay disponible  
✅ Top campañas por whatsapp_clicks  
✅ Top servicios por sesiones  
✅ Salud del tracking (estática)  

## Qué NO se puede mostrar (scope-and-non-goals.md)

❌ Revenue, ROAS, costo por lead  
❌ Leads confirmados, ventas, pipeline  
❌ Cotizaciones o resultados comerciales  
❌ Cualquier métrica que implique conversión comercial real  

## Regla de `whatsapp_click`

```
whatsapp_click = señal anónima de alta intención
whatsapp_click ≠ lead confirmado
whatsapp_click ≠ venta
whatsapp_click ≠ revenue
```

Nunca mostrar `whatsapp_clicks` como "conversiones" en el sentido comercial.
Usar etiqueta "Señales de intención" o "Alta intención".

## No tocar

- Nombres de métricas que impliquen ventas o revenue
- La interpretación de `whatsapp_click`
- Agregar datos que no existen en el contrato de tracking V0
