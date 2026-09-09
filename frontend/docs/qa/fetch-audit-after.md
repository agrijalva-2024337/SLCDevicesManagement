# Fetch audit (después)

Este archivo documenta el reporte de duplicación de requests usando `window.__slcRequests.report()` (solo en **dev**).

## Cómo generar el reporte

1. Levantar la app en modo desarrollo:
   - `cd frontend`
   - `pnpm dev`
2. Abrir DevTools → **Network** y activar:
   - **Preserve log**
   - Cache deshabilitado
3. Navegar por el flujo a auditar:
   - `/app`
   - `/app/activos`
   - cambiar a `?vista=asignaciones`
   - cambiar a `?vista=bajas`
   - `/app/catalogos/ubicaciones`
   - `/app/catalogos/ubicaciones/nueva`
   - `/app/catalogos/sedes/nueva`
4. En la consola correr:

```js
window.__slcRequests.report()
```

## Qué se espera ver

- Para cada endpoint, el contador debe ser **1** en la mayoría de los casos.
- Si algún endpoint sigue apareciendo con `count > 1`, registrar la(s) key(s) y qué navegación lo dispara.

## Checklist post-fix (manual)

| Flujo | Esperado |
| --- | --- |
| `/app` (dashboard) | Un GET por reporte/key; no N× el mismo path |
| `/app/activos` → vistas | Un solo `GET Asignaciones` compartido entre vistas |
| Overlay catálogo | Form hijo sin re-pedir lookups que el padre ya tiene |
| Empresa activa | Un `GET Empresas` (provider + páginas) |
| Logout → login | Cache vacío; `/consulta/:codigo` sin datos de sesión |

## Pendiente

Pegar aquí el resultado de `window.__slcRequests.report()` (salida `duplicates`) tras una pasada manual en el navegador.

