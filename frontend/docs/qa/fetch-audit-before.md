# Fetch audit (antes)

Línea base **antes** del cache compartido (`queryCache`). Sirve para comparar con `fetch-audit-after.md`.

## Contexto

- StrictMode activo (doble montaje en desarrollo).
- Sin `queryCache` / sin dedupe in-flight entre hooks.
- Cada `useResource` / `useCatalogCollection` disparaba su propio GET al montar.

## Cómo se medía

1. `pnpm dev`
2. DevTools → Network (Preserve log, cache del navegador desactivado)
3. Navegar: `/app` → `/app/activos` → vistas asignaciones/bajas → catálogos con overlay
4. Consola: `window.__slcRequests.report()` (tras instrumentación del Paso 0)

## Hallazgos típicos (pre-fix)

| Síntoma | Causa |
| --- | --- |
| Mismo `GET /api/Asignaciones` 2–4× al abrir bajas/mantenimientos/traslados | Página listaba con `listar()` y además pedía `asignacionService.getAll` para overlays |
| `GET /api/Empresas` duplicado | `useEmpresaActiva` + listados/catálogos |
| Lookups de catálogo (sedes, áreas, países…) siempre | `CatalogoPage` pedía los cinco lookups aunque el maestro no los usara |
| Overlay form re-fetch | Hijo volvía a pedir los mismos `getAll` que el padre ya tenía |
| StrictMode “duplicaba” | Segundo montaje cancelaba/re-lanzaba sin compartir promesa |

## Nota

Si no quedó un dump numérico pegado aquí, usar este cuadro como baseline cualitativa y llenar `fetch-audit-after.md` con el `report()` real tras el fix.
