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

La app queda en [http://localhost:5173](http://localhost:5173). `/` es la landing pública, `/login` la pantalla de sesión (solo UI) y `/app` el panel con sidebar, topbar y dashboard.

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
| `VITE_USE_API_MOCK` | `true` (catálogos y health en memoria). `false` para pegarle a la API real |

### Mocks vs API real

Los siete catálogos (empresas, sedes, áreas, categorías, proveedores, ubicaciones, países) corren contra datos de prueba **en memoria** mientras `VITE_USE_API_MOCK=true`. Las rutas viven en `src/shared/api/paths.js`. Cada `*Service.js` ya tiene la rama HTTP escrita.

Cuando se integre la API real (Prompt 3 / FE-05):

1. Poné `VITE_USE_API_MOCK=false` en `.env`.
2. Ajustá `src/shared/api/paths.js` si las rutas reales difieren.
3. Ajustá `src/shared/api/contracts.js` cuando salgan los DTOs.
4. No hace falta reescribir las pantallas: el componente no sabe si la respuesta vino del mock o de Axios.

Los cambios de crear/editar/inactivar **no se persisten al recargar** en modo mock.

`healthService` con mock en `false` sigue llamando a `GET /weatherforecast` hasta que exista un health real.

## Rutas

Definidas en `src/app/routes.jsx` con `createBrowserRouter` + lazy. `App.jsx` solo monta `RouterProvider`.

| Ruta | Página | Estado |
| --- | --- | --- |
| `/` | Landing pública | Activa |
| `/login` | Inicio de sesión (solo UI; auth real es FE-05) | Activa |
| `/app` | Dashboard (`HomePage`) | Activa |
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
    auth/              LoginPage (UI), authService.js, useAuth.js
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

Los campos de cada catálogo coinciden con `SLCDM.Domain` (camelCase): `id`, `habilitado` y los propios de la entidad. Proveedor usa `correo`, no `email`. País no tiene `habilitado`. **Ubicación** lleva `idSede`.

## Capa de servicios (FE-04)

| Servicio                          | API                                   | Notas                                                                              |
| --------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| Catálogos ya con pantalla         | `getAll/getById/create/update/remove` | Soft delete con `habilitado`                                                       |
| `authService`                     | `login`, `getMe`, `logout`            | Mock: clave `Practica2026`. `LoginPage` todavía no los llama                       |
| `useAuth`                         | sesión en memoria + `tokenStorage`    | Listo para FE-05                                                                   |
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
