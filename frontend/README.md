# SLCDevicesManagement — Frontend

Interfaz web del inventario de activos multiempresa (Sistemas Logísticos y Corporativos, S.A.). Producto: **DERCAS**.

## Stack

React 19 + Vite 8 (JavaScript) + Tailwind CSS 4 + Axios + **react-router** 7 (`createBrowserRouter`).

UI del prototipo: PrimeReact / PrimeIcons, react-icons, flag-icons, Leaflet / react-leaflet, Motion, GSAP, OGL.

Gestor de paquetes: **pnpm es obligatorio**. Hay un `preinstall` que aborta si alguien usa npm o yarn, y `frontend/.npmrc` con `engine-strict=true`. Nunca `npm install` ni `yarn`.

## Cómo levantar el proyecto

Requisitos: Node.js 20.19 o superior y **pnpm** ≥ 11.

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

La app queda en [http://localhost:5173](http://localhost:5173). `/` es la landing pública, `/login` inicia sesión contra la API (o el mock) y `/app` es el panel protegido.

Otros comandos:

| Script                 | Qué hace                  |
| ---------------------- | ------------------------- |
| `pnpm dev`             | Servidor de desarrollo    |
| `pnpm build`           | Build de producción       |
| `pnpm preview`         | Sirve el build localmente |
| `pnpm lint`            | ESLint                    |
| `pnpm format`          | Prettier (escribe)        |
| `pnpm format:check`    | Prettier (solo verifica)  |

## Sistema de diseño

Tokens en `src/index.css`. La paleta cruda (`--palette-*`) no se consume en componentes. La capa semántica sí:

| Token | Uso |
| --- | --- |
| `--surface` `--surface-elevated` `--surface-muted` `--surface-inverse` | Fondos |
| `--border` `--border-strong` | Bordes |
| `--text` `--text-secondary` `--text-muted` `--text-on-inverse` | Texto |
| `--accent` `--accent-hover` `--accent-soft` `--accent-text` | Marca (verde). Texto verde: `text-accent-text`, nunca `#26a621` sobre blanco |
| `--success` `--success-soft` `--warning` `--warning-soft` `--danger` `--danger-soft` | Semántica, no marca |
| `--header-height` `--sidebar-width` `--container-max` `--content-gutter` `--shadow-sm` `--shadow-md` | Layout |

`[data-theme='dark']` redefine solo la capa semántica. El toggle vive en el topbar y el sidebar; persiste en `localStorage['slcdm-theme']`.

Hojas: `shared/styles/app-ui.css` (shell, botones, overlays), `data-table.css`, `tooltip.css`, `features/landing/landing.css`.

Fuentes: Inter (cuerpo) y Plus Jakarta Sans (`font-display`).

## Variables de entorno

Copiar `.env.example` a `.env`. Nunca hardcodear la URL de la API.

| Variable            | Descripción                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `VITE_API_URL`      | Base URL de la API .NET (`http://localhost:5139` en el perfil HTTP)        |
| `VITE_USE_API_MOCK` | `true` (catálogos, login y health en memoria). `false` para pegarle a `SLCDM.Api` |

### Mocks vs API real

En local el frontend apunta a la API real: creá `.env` con `VITE_USE_API_MOCK=false` (ese archivo no se commitea). `.env.example` se queda en `true` para quien no tenga el backend.

Para volver al mock:

```bash
# en frontend/.env
VITE_USE_API_MOCK=true
```

Reiniciá `pnpm dev`. Login mock: cualquier usuario de `src/features/auth/mocks/usuariosSesion.js` con clave `Practica2026`.

Con mock en `false`, login, health y los siete catálogos van por Axios. Paths en `src/shared/api/paths.js` (nombres de controller, no kebab-case). `GET` de catálogos manda `incluirInhabilitados=true`. Inactivar empresas/sedes/áreas/categorías/proveedores/ubicaciones es `POST {id}/disable`; países usan `DELETE`. Create responde `{ id }`; update/disable 204.

Los cambios de crear/editar/inactivar **no se persisten al recargar** en modo mock.

`healthService` llama `GET /api/health` → `{ status, timestamp, service }`.

### Perfiles

El JWT trae `role` y `id_empresa`. `RutaProtegida` exige token en `/app`. Sin escritura se ocultan `RegisterButton`, acciones de fila y overlays.

| Perfil | Lectura | Escritura en UI |
| --- | --- | --- |
| Consulta | Catálogos y módulos | Ninguna (acciones visibles, deshabilitadas) |
| Operador de inventario | Catálogos | Ubicaciones, activos, asignaciones, traslados, mantenimientos, inventario físico |
| Administrador de empresa | Catálogos de su empresa | Lo anterior + sedes, áreas, categorías, proveedores, bajas; editar/inactivar empresa |
| Administrador general | Todo | Lo anterior + crear empresa + países |

### Empresa activa

No hay header ni query global de empresa. El selector del topbar es **solo UI**: Admin general filtra filas en el cliente y guarda `slcdm_empresa_activa` en `localStorage`. El resto ve su empresa del token (combo deshabilitado).

### Huecos del backend (no se parchean en FE)

- `ProveedorDto.Corre` (typo) → JSON `corre`. El servicio mapea `corre` ↔ `correo`; la UI sigue diciendo correo.
- Create de ubicación exige `latitud`/`longitud` no nulos. El form puede mandar `null` y la API responde 400. No se inventan `0,0`.
- No hay contrato de “empresa activa” para Admin general.
- Al implementar FE-05, `dotnet run` en `src/SLCDM.Api` falló por `DetalleActivoMappingConfig.cs` (`Commands` no encontrado). Confirmar Swagger en `http://localhost:5139/swagger` cuando compile.

## Rutas

Definidas en `src/app/routes.jsx` con `createBrowserRouter` + lazy. `App.jsx` monta `AuthProvider` y `RouterProvider`. `/app` pasa por `RutaProtegida`; `nueva` / `:id/editar` por `RutaEscritura`; `/app/bitacora` por `RutaAdministrador` (rol ≥ Administrador de empresa).

| Ruta | Página | Estado |
| --- | --- | --- |
| `/` | Landing pública | Activa |
| `/login` | Inicio de sesión (JWT real o mock) | Activa |
| `/app` | Dashboard de reportes (`DashboardPage`) | Activa |
| `/app/catalogos/empresas` | Empresas + overlays `nueva` / `:id` / `:id/editar` | Activa |
| `/app/catalogos/sedes` | Sedes + overlays `nueva` / `:id` / `:id/editar` | Activa |
| `/app/catalogos/:slug` | Áreas, categorías, proveedores, ubicaciones, países | Activa |
| `/app/catalogos/:slug/nueva` \| `:id` \| `:id/editar` | Ficha y formulario sobre la lista | Activa |
| `/app/activos` | Parque + pestañas Asignaciones / Traslados / Mantenimientos / Bajas (`?vista=`) | Activa |
| `/app/activos?vista=asignaciones` | Entrega y devolución (tipo `Asignacion`) | Activa |
| `/app/activos?vista=traslados` | Traslados (vista de `Asignacion` tipo Traslado) | Activa |
| `/app/activos?vista=mantenimientos` | Mantenimientos (vista de `Asignacion` tipo Mantenimiento) | Activa |
| `/app/activos?vista=bajas` | Bajas (vista de `Asignacion` tipo Baja) | Activa |
| `/app/asignaciones` `/traslados` `/mantenimientos` `/bajas` | Redirigen a la pestaña de Activos | Redirect |
| `/app/inventario-fisico` | Jornadas de inventario físico | Activa |
| `/app/inventario-fisico/:id` | Hoja de conteo, hallazgos y diferencias | Activa |
| `/app/bitacora` | Bitácora de auditoría, solo lectura | Activa |
| `/app/reportes` | Catálogo de los 8 informes operativos | Activa |
| `/app/reportes/activos` | Listado paginado `GET /api/Reportes/activos` | Activa |
| `*` | 404 | Activa |

Empresa y sede viven en `features/organizacion/`; el resto de maestros en `features/catalogos/` (`maestros.js` + `CatalogoPage`). Las URLs quedan bajo `/app/catalogos/...`. Deep link de ficha: `/app/catalogos/areas/7`. Países es grilla con banderas; ubicaciones es tabla + mapa. Detalle de la configuración: `src/features/catalogos/README.md`.

El sidebar muestra Activos, inventario físico, reportes y bitácora. Asignaciones, traslados, mantenimientos y bajas viven como pestañas de filtro en Activos. La bitácora no se muestra a Consulta ni a Operador.

## Activos y asignaciones (FE-06)

`ActivoDto` no tiene `idEmpresa` ni `idSede`. Empresa y sede se derivan: `Activo.idUbicacion` → `Ubicacion.idSede` → `Sede.idEmpresa`. El código de tabla es `numeroSerie`. Alta y edición mandan `CreateActivoCommand` / `UpdateActivoCommand`.

El estado del activo no viene en el DTO. Se lee de `Activo.idEstado` si el mock o un command lo escribió; si no, de la asignación activa. Nombres del seed: `Disponible`, `Asignado`, `En mantenimiento`, `Dado de baja`. Drill-down: `?estado=<nombre>`. Deep link: `?id=<id>`.

Asignaciones de esta pantalla son **solo entrega**. Se listan filas con tipo `Asignacion` resuelto por nombre. No hay select de Traslado / Mantenimiento / Baja. Crear llama `POST /api/Asignaciones` (`CreateAsignacionCommand` exige `idUbicacion`; se toma del activo). Cerrar llama `POST /api/Asignaciones/{id}/devolver`. No se edita `activa` a mano.

Desde la ficha, **Asignar** abre la pestaña `?vista=asignaciones` con `state: { idActivo }`. Trasladar, mantenimiento y dar de baja abren overlays locales. **Dar de baja** exige `canWrite('bajas')` (Administrador de empresa o superior). El operador ve la acción deshabilitada, no oculta.

Perfil Consulta: ve listas y fichas; no registra, no edita, no entrega ni devuelve. Operador de inventario o superior escribe en `activos` y `asignaciones`.

## Traslados y mantenimientos (FE-07)

No son entidades propias ni tienen `/api/traslados` o `/api/mantenimientos`. Son **vistas sobre `Asignacion`** filtradas por `Tipo_Asignacion`. Los ids de tipo y estado **nunca se hardcodean**: se resuelven por nombre en runtime (`shared/api/tipoAsignacion.js`) contra `GET /api/TiposAsignacion` y `GET /api/Estados`.

Nombres del seed (`Scripts/SeedCatalogosAddendum.sql`):

| Catálogo | Valores |
| --- | --- |
| Tipo_Asignacion | `Asignacion`, `Traslado`, `Mantenimiento`, `Baja` |
| Estado | `Disponible`, `Asignado`, `En mantenimiento`, `Dado de baja` |

Si un nombre no aparece, la UI muestra «catálogo incompleto» y no manda `undefined` al backend.

El origen de un traslado es la ubicación actual del activo (dato, no input). El destino es un select de ubicaciones de la empresa activa. La ruta `Origen → Destino` se guarda en `observaciones` porque `AsignacionDto` no tiene origen/destino; el texto libre va en `motivo` (`CreateTrasladoCommand`).

La sede del mantenimiento es `Activo → Ubicacion → Sede`. El tipo Preventivo/Correctivo y la descripción del problema van en `CreateMantenimientoCommand` (`idTipoMantenimiento`, `descripcionProblema`).

Escritura real (BE-16 / BE-17 ya publicados):

| Acción | Endpoint |
| --- | --- |
| Listar | `GET /api/Asignaciones` + filtro por nombre de tipo |
| Registrar traslado | `POST /api/Asignaciones/traslado` (`CreateTrasladoCommand`) |
| Abrir mantenimiento | `POST /api/Asignaciones/mantenimiento` (`CreateMantenimientoCommand`) |
| Finalizar mantenimiento | `POST /api/Asignaciones/{id}/finalizar-mantenimiento` (`FinalizarMantenimientoCommand`) |

En mock (`VITE_USE_API_MOCK=true`) esos POST se simulan con `asignacionService.create` / `devolver` y se actualiza el activo. El listado sigue siendo una vista sobre `Asignacion`.

Query params de mantenimientos (drill-down de FE-10): `/app/activos?vista=mantenimientos&abiertos=1` y `?estado=<nombre>`. Deep link de ficha: `?id=<id>`.

Perfil Consulta: sin botones de registrar ni finalizar. Un activo dado de baja muestra traslado y mantenimiento deshabilitados, con el motivo en el tooltip.

## Bajas y bitácora (FE-08)

Las bajas **no son entidad propia**. Se listan asignaciones de tipo `Baja` (nombre resuelto en runtime, igual que traslados). Alta: `POST /api/Asignaciones/baja` (`CreateBajaCommand`). Roles: Administrador de empresa o superior.

`AsignacionDto` no trae motivo, autorizado por ni documento. Esos datos se leen del historial del activo (`informacionNueva` con `id_motivo_baja=…; documento_pdf_url=…; id_autorizado_por=…; id_responsable=…`) en `detalleBajaParser.js`. Si el formato no coincide, la ficha muestra "—".

`documentoPdfUrl` es obligatorio (máx. 300). No hay uploader: el formulario pide una URL. `documentoReferencia` y `observaciones` son opcionales (máx. 300). El estado del activo pasa a `Dado de baja` (nombre, no id hardcodeado).

409 del backend: *"El activo ya esta dado de baja."* y *"El activo tiene una asignacion o un mantenimiento activo. Cierren el proceso antes de dar de baja."*

La bitácora es **solo lectura**. La escribe el interceptor del backend. `GET /api/Bitacoras` acepta `idUsuario` y `entidadAfectada`; no pagina ni filtra por fecha/tipo (eso va en cliente). Expandir una fila muestra `informacionAnterior` / `informacionNueva`. No hay alta ni edición desde la UI.

Pendiente de Angel (`// [API]` en código):

| Hueco | Qué hace el frontend mientras tanto |
| --- | --- |
| `GET /api/MotivosBaja` | Mock con los 7 nombres del seed (sin tilde): Venta, Desecho, Donacion, Perdida, Robo, Dano irreparable, Otro |
| `GET` de DetalleBaja | Parser del historial |
| `GET /api/TiposMantenimiento` | Mock Preventivo / Correctivo |
| Bitácora: paginación y filtro por fecha | Filtro de fechas en cliente |

## Inventario físico (FE-09)

Jornadas de conteo por **sede**. La ubicación solo agrupa la hoja de trabajo; no viaja en el command de apertura.

Flujo: abrir jornada → contar (hallazgos por activo, agrupados por ubicación) → cerrar → reporte de diferencias.

| Acción | Contrato |
| --- | --- |
| Listar | `GET /api/HistoricosInventario` (`idSede`, `idEmpresa`, `soloAbiertos`) |
| Abrir | `POST /api/HistoricosInventario` (`IdSede`, `Responsable` texto máx. 150, `FechaInicio`, `Observaciones` máx. 300) |
| Cerrar | `POST /api/HistoricosInventario/{id}/cerrar?fechaCierre=` (query, no body) |
| Diferencias | `GET /api/HistoricosInventario/{id}/diferencias` — `tipoDiferencia` exacto: `Faltante`, `NoEncontrado`, `MalEstado` |
| Hallazgos | `POST/PUT/DELETE /api/DetallesActivo`. El PUT lleva `id` en ruta y en body. Update no cambia la fecha. |

No hay `GET .../esperados`. El cliente replica `InventarioJornadaRules` en `activosEsperados.js`: ubicaciones de la sede → activos con esa `idUbicacion` → excluir dados de baja (`isActivoDeBaja`). Marcado `// [API]`.

Una sola jornada abierta por sede. Duplicado: 400/409 *"Ya existe una jornada de inventario abierta para esta sede."* → error de campo en `idSede`. El cierre es irreversible; 409 *"La jornada de inventario ya esta cerrada."*

Jornada cerrada: no se registran hallazgos (400), ni se editan (409) ni se eliminan (409). Las acciones de escritura se muestran deshabilitadas con el motivo, también para el perfil Consulta.

Eliminar un hallazgo **sí borra** en el servidor el movimiento de verificación de ese detalle en `Historial_Activo`. La confirmación lo dice.

Abierta = reporte de diferencias parcial. Cerrada = definitivo. Etiquetas y tonos salen de `tipoDiferencia.js`.

Admin general debe mandar `idEmpresa` de la empresa activa: el filtro EF del JWT no aplica a ese rol.

Operador de inventario o superior escribe. `Responsable` es texto libre, no el catálogo de responsables.

Pendiente de Angel (`// [API]` en código):

| Hueco | Qué hace el frontend mientras tanto |
| --- | --- |
| `GET /api/HistoricosInventario/{id}/esperados` | Replica las reglas de jornada en `activosEsperados.js` |

## Dashboard y reportes (FE-10)

El archivo del controller es `ReportesOperativosController.cs`, pero la clase es `ReportesController` y hereda `[Route("api/[controller]")]`. La ruta real es **`/api/Reportes`**, no `/api/ReportesOperativos`.

Los 8 endpoints aceptan `idEmpresa` opcional. Admin general sin ese query ve todas las empresas: el selector del topbar se manda en las 8 llamadas. El resto usa el `EmpresaId` del token.

`ActivoReporteDto` y `GarantiaPorVencerDto` anidan el `ActivoDto` en `activo` (`row.activo.nombre`). Los otros seis DTOs son planos.

`estadoOperativo` sale en minúsculas: `disponible`, `asignado`, `mantenimiento`, `baja`. Las etiquetas (`Disponible`, `Asignado`, `En mantenimiento`, `Dado de baja`) viven en `ESTADO_OPERATIVO_LABEL`. El query `estado` acepta singular/plural y se normaliza.

`GET /api/Reportes/activos` es el único endpoint paginado (`skip` / `take`, default 100, máx. 500). **No hay total.** El paginador es anterior/siguiente; se acaba cuando llegan menos de `take` filas.

`GET /api/Reportes/diferencias-inventario` solo trae jornadas **cerradas**. El parcial de una jornada abierta sigue en `GET /api/HistoricosInventario/{id}/diferencias`.

Las gráficas son SVG propio (`ActivityCharts.jsx`). No hay recharts, chart.js ni d3.

## Pendientes de API (FE-12)

BE-24 / BE-25 no publicaron estos cuatro endpoints. El frontend sigue con workaround. Matriz de roles: `docs/permisos-por-perfil.md`.

| Hueco | Endpoint que lo desbloquea | Workaround |
| --- | --- | --- |
| Motivos de baja | `GET /api/MotivosBaja` | `features/bajas/motivoBajaService.js` (mock + seed) |
| Tipos de mantenimiento | `GET /api/TiposMantenimiento` | `features/mantenimientos/tipoMantenimientoService.js` |
| Detalle de baja en el DTO | `DetalleBaja` en `AsignacionDto` o endpoint propio | `features/bajas/detalleBajaParser.js` lee `informacionNueva` del historial |
| Activos esperados de una jornada | `GET /api/HistoricosInventario/{id}/esperados` | `features/inventario/activosEsperados.js` replica las reglas de jornada |

**Hallazgo, no olvido:** `DispositivosController` (rastreo, auto-registro, ping, fuera de rango) no tiene interfaz. No está en las tareas FE. No se construye en este sprint. En `origin/main` el constructor todavía puede fallar el build (`CS1003`: falta una coma tras `_ping` en `DispositivosController.cs`). Eso es backend (BE-25), no un parche de UI.

## Estructura de carpetas

```
frontend/src/
  app/
    App.jsx
    routes.jsx
    RouteFallback.jsx
    pages/HomePage.jsx
    pages/NotFoundPage.jsx
  features/
    landing/           LandingPage, sections, data estáticos, landing.css
    auth/              LoginPage, authService, useAuth, RutaProtegida, decodeJwt
    organizacion/      empresas, sedes, areas, usuarios, bitacoras
    catalogos/         maestros.js, CatalogoPage, categorias, proveedores, ubicaciones, paises
    activos/           ActivosPage, ficha, form, activoAcciones, historialActivoService
    asignaciones/      AsignacionesPage, form, asignacionService (entrega y devolver)
    inventario/        TrasladosPage, JornadasPage, hoja de conteo, historicoInventarioService, detalleActivoService
    mantenimientos/    MantenimientosPage, apertura, cierre, tipoMantenimientoService
    bajas/             BajasPage, BajaFormOverlay, bajaService, motivosBaja
    reportes/          DashboardPage, ReportesPage, ActivosReportePage, reporteService, gráficas SVG
  shared/
    api/               paths.js, contracts.js, errors.js
    components/        DataTable, PageHeader, FeedbackState, overlays, forms…
    geo/               parseCoordinates, geocodeAddress, useResolvedPositions
    hooks/             useForm, useCatalogCollection, useResource, useApiHealth, useCrudOverlay
    layout/            AppLayout, Sidebar, Topbar, navigation.js
    styles/            app-ui.css, data-table.css, tooltip.css
    theme/             theme.js, ThemeToggle.jsx
    vendor/react-bits/ efectos de la landing
    services/          httpClient.js, tokenStorage.js, healthService.js, createMockCrudService.js
    utils/             format.js, search.js, getErrorMessage.js
    config/env.js
```

Los componentes no llaman a Axios directo: pasan por servicios.

Los campos de cada catálogo coinciden con los DTOs de Application (camelCase): `id`, `habilitado` y los propios de la entidad. Proveedor en UI usa `correo`; el JSON real trae `corre` (typo de backend). País no tiene `habilitado`. **Ubicación** lleva `idSede`.

## Capa de servicios (FE-04)

| Servicio                          | API                                   | Notas                                                                              |
| --------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| Catálogos ya con pantalla         | `getAll/getById/create/update/remove` | Soft delete con `habilitado`                                                       |
| `authService`                     | `login`, `getMe`, `logout`            | Real: `{ emailOrUsername, password }` → `token` + `userDetails`. Mock: `Practica2026` |
| `useAuth`                         | JWT (`role`, `id_empresa`) + sesión   | Expone `rol`, `idEmpresa`, `canWrite`                                              |
| Bitácora                          | `getAll({ idUsuario, entidadAfectada })` | Solo lectura. Admins. Sin `incluirInhabilitados`. |
| Activos, asignaciones, inventario | CRUD mock / API                       | Activos: alta y edición. Asignaciones: `entregar` + `devolver` |
| Traslados / mantenimientos        | Vista + POST dedicados                | `/traslado`, `/mantenimiento`, `/finalizar-mantenimiento` |
| Bajas                             | Vista + `POST /baja`                  | Motivo desde historial. MotivosBaja mock. |
| Inventario físico                 | `historicoInventarioService`, `detalleActivoService` | Jornadas por sede, hallazgos, `POST {id}/cerrar`, `GET {id}/diferencias` |
| Reportes                          | `reporteService` (solo lectura)                      | `/api/Reportes/*`. `activos` pagina con skip/take y sin total |

Hook `useResource(loadFn)` → `{ data, isLoading, errorMessage, reload }`.

## Componentes compartidos

**Sistema de diseño:** `PageHeader` (`kicker`, `title`, `description`, `actions`), `StatCard`, `FeedbackState`, `DataTable` (`loading`, `emptyTitle`/`emptyDescription`, `getRowActions`, columnas `type: 'status'`), `DetailOverlay`, `RecordForm` / `SchemaForm`, `RecordFormOverlay`, `StatusBadge`, `RecordActions` (`RegisterButton`), `RowIconActions`, `RecordCard`, `Reveal`, `Tooltip`, `OverlayOutlet`.

Los catálogos usan `SchemaForm` y `app-feedback`. Ya no existen `Button`, `Badge`, `TextField`, `SelectField`, `TextareaField`, `CheckboxField`, `FormActions`, `AlertBanner`, `Modal`, `ConfirmDialog`, `HabilitadoFilter` ni `CatalogRowActions`.

`DataTable.columns[]`: `{ key, header, getValue, render, sortValue, primary, numeric, mono, truncate, sticky, type: 'status' | 'badge', … }`. Acciones de fila: `view`, `create`, `edit`, `remove` (`enabled` + `disabledReason`).

`SchemaForm.fields[]`: `{ name, label, type, required, maxLength, wide, hint, placeholder, options, rows, step, min, autoComplete }`.

Hook `useForm({ initialValues, validate })` → `values`, `errors`, `touched`, `handleChange`, `handleBlur`, `handleSubmit`, `reset`.

Fábrica `createMockCrudService({ endpoint, seed })` → CRUD con soft delete.

## Convención de ramas y commits

Ramas desde `main`:

- `chore/FE-01-descripcion`
- `feat/FE-xx-descripcion`
- `fix/FE-xx-descripcion`
- `refactor/FE-xx-descripcion`

Commits (Conventional Commits): `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
