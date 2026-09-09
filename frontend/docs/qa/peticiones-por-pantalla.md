# Peticiones por pantalla (FE-18)

Medición del bucle de fetches antes/después del arreglo de `useQueryResource` + `queryCache`.

## Cómo medir

1. `pnpm dev` → consola: `window.__slcRequests.reset()`, navegar, esperar carga, `window.__slcRequests.report()`.
2. `pnpm build && pnpm preview` → misma ruta (sin doble montaje de StrictMode).
3. En reposo 60 s: el contador no debe seguir creciendo.

**Antes (síntoma reportado):** `/app/catalogos/sedes` ~1333× `GET /api/Usuarios` en 22 s (muy probablemente `/app/catalogos/usuarios` u otra pantalla con `listQueryKey('usuarios')`; sedes no llama Usuarios). Dashboard: cada reporte 5–6×.

**Nota StrictMode:** en `pnpm dev` el primer montaje puede verse ×2; en `pnpm preview` debe ser ×1.

## Tabla

| Pantalla | Esperado al montar (prod) | Observado `pnpm dev` (StrictMode) | Observado `pnpm preview` | Estado |
| --- | --- | --- | --- | --- |
| Catálogo áreas | 1× áreas + lookups sedes | ≤2× por recurso | 1× | pendiente medición manual |
| Catálogo categorías | 1× categorías + empresas | ≤2× | 1× | pendiente |
| Catálogo proveedores | 1× proveedores + empresas/países | ≤2× | 1× | pendiente |
| Catálogo ubicaciones | 1× ubicaciones + sedes/países | ≤2× | 1× | pendiente |
| Catálogo países | 1× países (+ empresas si aplica) | ≤2× | 1× | pendiente |
| Catálogo estados | 1× estados | ≤2× | 1× | pendiente |
| Catálogo tipos-asignacion | 1× tipos | ≤2× | 1× | pendiente |
| Catálogo redes-conocidas | 1× redes + ubicaciones | ≤2× | 1× | pendiente |
| Catálogo usuarios | 1× usuarios (+ empresas) | ≤2× | 1× | pendiente |
| Catálogo responsables | 1× responsables + areas/países | ≤2× | 1× | pendiente |
| Empresas | 1× empresas + países | ≤2× | 1× | pendiente |
| Sedes | 1× sedes + empresas + países | ≤2× (no Usuarios) | 1× | pendiente |
| Activos | 1× por recurso de la página | ≤2× | 1× | pendiente |
| Ficha activo | 1× detalle + catálogos | ≤2× | 1× | pendiente |
| Asignaciones | 1× asignaciones + lookups | ≤2× | 1× | pendiente |
| Traslados | 1× asignaciones (filtro) + lookups | ≤2× | 1× | pendiente |
| Mantenimientos | 1× asignaciones (filtro) + lookups | ≤2× | 1× | pendiente |
| Bajas | 1× asignaciones + usuarios si permitido | ≤2× | 1× | pendiente |
| Inventario físico | 1× jornadas + sedes | ≤2× | 1× | pendiente |
| Detalle jornada | 1× jornada + detalles | ≤2× | 1× | pendiente |
| Bitácora | 1× bitácoras + usuarios si permitido | ≤2× | 1× | pendiente |
| Dashboard | 1× por cada uno de 6 reportes/jornadas | ≤2× c/u | 1× c/u | pendiente |
| Reportes / activos | 1× reporte filtrado + catálogos | ≤2× | 1× | pendiente |
| Rastreo | 1× rastreo + ubicaciones/sedes | ≤2× | 1× | pendiente |
| Consulta pública QR | 1× ficha | ≤2× | 1× | pendiente |

Criterio de rechazo: el mismo recurso >2 veces en desarrollo tras la carga inicial, o cualquier crecimiento en reposo.

## Call site Usuarios (Paso 0)

No hay `usuarioService` en `SedesPage`. Quien dispara `GET /api/Usuarios`:

- `CatalogoPage` con `slug === 'usuarios'`
- `ActivosPage` / `ActivoDetallePage` / `BajasPage` / `BitacoraPage` vía `getAllIfAllowed` + `listQueryKey('usuarios')`
