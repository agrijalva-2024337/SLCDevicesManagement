# SLCDevicesManagement — Frontend

Interfaz web del inventario de activos multiempresa (Sistemas Logísticos y Corporativos, S.A.). Producto interno: **SLCDM** (DERCAS).

Stack: React 19 + Vite 8 (JavaScript) + Tailwind CSS 4 + PrimeReact 10 + React Router 7 + Axios + motion.

Esta etapa construye la **plantilla de UI**. No hay backend conectado. Los puntos de futura integración llevan el comentario `// [API]`.

## Cómo levantar el proyecto

Requisito: Node.js 20.19 o superior.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

La app queda en [http://localhost:5173](http://localhost:5173). La ruta `/` es la pantalla de inicio pública.

Otros comandos:

| Script                 | Qué hace                  |
| ---------------------- | ------------------------- |
| `npm run dev`          | Servidor de desarrollo    |
| `npm run build`        | Build de producción       |
| `npm run preview`      | Sirve el build localmente |
| `npm run lint`         | ESLint                    |
| `npm run format`       | Prettier                  |
| `npm run format:check` | Verifica formato          |

## Estructura de rutas

| Ruta                                                                                                                                                   | Qué es                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `/`                                                                                                                                                    | Landing pública                                                                  |
| `/login`                                                                                                                                               | Inicio de sesión (solo UI)                                                       |
| `/app`                                                                                                                                                 | Panel interno (dashboard)                                                        |
| `/app/catalogos/:slug`                                                                                                                                 | Catálogos (Empresas, Sedes, Áreas, Categorías, Proveedores, Ubicaciones, Países) |
| `/app/activos`, `/app/asignaciones`, `/app/traslados`, `/app/mantenimientos`, `/app/bajas`, `/app/inventario-fisico`, `/app/bitacora`, `/app/reportes` | Módulos reservados (`PlaceholderPage`)                                           |
| `*`                                                                                                                                                    | 404                                                                              |

La zona `/app` irá detrás de `<RutaProtegida>` cuando exista autenticación real.

## Sistema de diseño

Tokens en `src/index.css` (`@theme` y `:root`). Los componentes consumen variables CSS, no hex sueltos.

### Paleta de marca

| Token                               | Hex       | Uso                                      |
| ----------------------------------- | --------- | ---------------------------------------- |
| `--color-navy`                      | `#0C1440` | Hero, sidebar, footer, texto sobre claro |
| `--color-navy-mid`                  | `#143259` | Degradados, hover sobre navy             |
| `--color-lavender`                  | `#DADDFA` | Secciones claras, fondos sutiles         |
| `--color-white` / `--color-surface` | `#FDFDFF` | Superficies y tarjetas                   |
| `--color-accent`                    | `#26A621` | Único acento: CTA, ítem activo, éxito    |

`--color-accent-text` (`#166534`) es la versión oscurecida para texto o links verdes sobre fondo claro. El botón verde usa texto blanco en negrita y tamaño ≥ 16px. Nunca usar `#26A621` en párrafos sobre blanco o lavanda.

### Semánticos (no son marca)

- Error: `#B91C1C`
- Advertencia: `#A16207`
- Éxito: el verde de paleta

### Tipografía

- Titulares: **Plus Jakarta Sans** 700/800 (`--font-display`), tracking `-0.02em`
- Cuerpo e interfaz: **Inter** 400/500/600 (`--font-sans`)

Radios: 8px controles, 12–16px tarjetas. Sombras suaves; el diseño se apoya en bordes finos.

## Estructura de carpetas

```
frontend/src/
  app/                 rutas, dashboard, placeholders, 404
  features/
    auth/              LoginPage
    landing/           pantalla de inicio, secciones, datos
  shared/
    components/        FeedbackState, PageHeader, StatCard, Reveal
    layout/            AppLayout, Sidebar, Topbar, navigation.js
    vendor/react-bits/ CountUp (copiado a mano)
    services/          Axios, token JWT, health check
    hooks/
    config/
    utils/
```

Los componentes no llaman a Axios directo: pasan por `shared/services`.

## Convención de ramas y commits

Ramas desde `main`:

- `chore/FE-01-descripcion`
- `feat/FE-xx-descripcion`
- `fix/FE-xx-descripcion`

Commits (Conventional Commits):

- `feat:` funcionalidad nueva
- `fix:` corrección de bug
- `docs:` documentación
- `refactor:` cambio interno sin alterar comportamiento
- `chore:` tooling, dependencias, setup
