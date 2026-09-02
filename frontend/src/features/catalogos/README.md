# Catálogos

UX de maestros: lista visible + overlay hijo. Los datos salen de `*Service.js` y `useCatalogCollection`. No hay stores.

## Rutas

Empresas y sedes se registran **antes** de `:slug` en `src/app/routes.jsx`.

| Ruta | Página |
| --- | --- |
| `/app/catalogos/empresas` | `EmpresasPage` (`features/organizacion/empresas/`) |
| `/app/catalogos/empresas/nueva` \| `:id` \| `:id/editar` | `EmpresaFormPage` / `EmpresaDetallePage` |
| `/app/catalogos/sedes` | `SedesPage` (`features/organizacion/sedes/`) |
| `/app/catalogos/sedes/nueva` \| `:id` \| `:id/editar` | `SedeFormPage` / `SedeDetallePage` |
| `/app/catalogos/:slug` | `CatalogoPage` |
| `/app/catalogos/:slug/nueva` \| `:id` \| `:id/editar` | `MaestroFormPage` / `MaestroDetallePage` |

Deep link de ficha: `/app/catalogos/areas/7` es un `:id` de ruta, no `?id=`.

Slugs de `maestros.js`: `areas`, `categorias`, `proveedores`, `ubicaciones`, `paises`.

## Configuración (`maestros.js`)

Cada maestro declara `service` (`getAll` / `getById` / `create` / `update` / `remove`), columnas, `fields`, `validate` y `toPayload`.

Lookups (`sedeNombre`, `empresaNombre`) no leen stores. `fields({ empresas, sedes, paises })` recibe listas cargadas en la página. Las columnas usan `getValue: (item) => nombres[item.idSede] ?? '—'`.

| Slug | Servicio | Lista |
| --- | --- | --- |
| `areas` | `areaService` | DataTable |
| `categorias` | `categoriaService` | DataTable |
| `proveedores` | `proveedorService` | DataTable |
| `ubicaciones` | `ubicacionService` | `UbicacionesMapPage` (tabla + Leaflet) |
| `paises` | `paisService` | `PaisesGrid` (banderas `fi fi-${codigoIso2}`) |

Inactivar: switch `habilitado` en el formulario. `PaisDto` no tiene `habilitado`; no hay switch ni soft-delete. `CatalogoPage` usa `rows` (no el filtro `activos`) para países.

Ubicaciones: `idSede` obligatorio. Lat/lng opcionales; si van, van las dos.

## Overlays

`OverlayOutlet` renderiza el hijo sobre la lista y pasa `{ reload, rows, lookups }`. El save de `MaestroFormPage` / empresa / sede llama `create` o `update` y recarga al padre.

## Geo

`shared/geo/`: `parseCoordinates`, `geocodeAddress` (Nominatim), `useResolvedPositions`. Prioridad: coordenadas del DTO; geocode solo si faltan.

## Integración API (FE-05)

`RecordFormOverlay` pinta `error.fieldErrors` del interceptor HTTP (400). Escritura según `useAuth().canWrite`. El selector de empresa del topbar filtra filas en cliente (Admin general).

Huecos que siguen en backend:

- `PaisDto` sin `habilitado`: no se puede inactivar un país.
- `AreaDto` no expone `responsable`; la columna se agrega cuando exista el campo.
- `ProveedorDto.Corre` → el servicio mapea a `correo`.
- Create de ubicación exige coords no nulas; el form puede mandar `null`.
- Geocoding Nominatim vs lat/lng que mande la API (`geocodeAddress.js`, `useResolvedPositions.js`).
