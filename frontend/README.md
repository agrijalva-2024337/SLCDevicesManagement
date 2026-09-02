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
| Consulta | Catálogos | Ninguna |
| Operador de inventario | Catálogos | Ubicaciones |
| Administrador de empresa | Catálogos de su empresa | Sedes, áreas, categorías, proveedores; editar/inactivar empresa |
| Administrador general | Todo | Lo anterior + crear empresa + países |

### Empresa activa

No hay header ni query global de empresa. El selector del topbar es **solo UI**: Admin general filtra filas en el cliente y guarda `slcdm_empresa_activa` en `localStorage`. El resto ve su empresa del token (combo deshabilitado).

### Huecos del backend (no se parchean en FE)

- `ProveedorDto.Corre` (typo) → JSON `corre`. El servicio mapea `corre` ↔ `correo`; la UI sigue diciendo correo.
- Create de ubicación exige `latitud`/`longitud` no nulos. El form puede mandar `null` y la API responde 400. No se inventan `0,0`.
- No hay contrato de “empresa activa” para Admin general.
- Al implementar FE-05, `dotnet run` en `src/SLCDM.Api` falló por `DetalleActivoMappingConfig.cs` (`Commands` no encontrado). Confirmar Swagger en `http://localhost:5139/swagger` cuando compile.

## Rutas

Definidas en `src/app/routes.jsx` con `createBrowserRouter` + lazy. `App.jsx` monta `AuthProvider` y `RouterProvider`. `/app` pasa por `RutaProtegida`; `nueva` / `:id/editar` por `RutaEscritura`.

| Ruta | Página | Estado |
| --- | --- | --- |
| `/` | Landing pública | Activa |
| `/login` | Inicio de sesión (JWT real o mock) | Activa |
| `/app` | Dashboard (`HomePage`), envuelto en `RutaProtegida` | Activa |
| `/app/catalogos/empresas` | Empresas + overlays `nueva` / `:id` / `:id/editar` | Activa |
| `/app/catalogos/sedes` | Sedes + overlays `nueva` / `:id` / `:id/editar` | Activa |
| `/app/catalogos/:slug` | Áreas, categorías, proveedores, ubicaciones, países | Activa |
| `/app/catalogos/:slug/nueva` \| `:id` \| `:id/editar` | Ficha y formulario sobre la lista | Activa |
| `*` | 404 | Activa |

Empresa y sede viven en `features/organizacion/`; el resto de maestros en `features/catalogos/` (`maestros.js` + `CatalogoPage`). Las URLs quedan bajo `/app/catalogos/...`. Deep link de ficha: `/app/catalogos/areas/7`. Países es grilla con banderas; ubicaciones es tabla + mapa. Detalle de la configuración: `src/features/catalogos/README.md`.

Los módulos (activos, asignaciones, etc.) aparecen en el sidebar **deshabilitados**.

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
    organizacion/      empresas, sedes, areas (servicios + detalle/form de empresa y sede)
    catalogos/         maestros.js, CatalogoPage, categorias, proveedores, ubicaciones, paises
    activos/ asignaciones/ inventario/
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
| Bitácora / historial de activo    | `getAll`, `getById`                   | Solo lectura                                                                       |
| Activos, asignaciones, inventario | CRUD mock                             | Sin pantallas en este sprint                                                       |

Hook `useResource(loadFn)` → `{ data, isLoading, errorMessage, reload }`.

## Componentes compartidos

**Sistema de diseño:** `PageHeader` (`kicker`, `title`, `description`, `actions`), `StatCard`, `FeedbackState`, `DataTable` (`loading`, `emptyTitle`/`emptyDescription`, `getRowActions`, columnas `type: 'status'`), `DetailOverlay`, `RecordForm` / `SchemaForm`, `RecordFormOverlay`, `StatusBadge`, `RecordActions` (`RegisterButton`), `RowIconActions`, `RecordCard`, `Reveal`, `Tooltip`, `OverlayOutlet`.

Los catálogos usan `SchemaForm` y `app-feedback`. Ya no existen `Button`, `Badge`, `TextField`, `SelectField`, `TextareaField`, `CheckboxField`, `FormActions`, `AlertBanner`, `Modal`, `ConfirmDialog`, `HabilitadoFilter` ni `CatalogRowActions`.

`DataTable.columns[]`: `{ key, header, getValue, render, sortValue, primary, numeric, mono, truncate, sticky, type: 'status' | 'badge', … }`.

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
