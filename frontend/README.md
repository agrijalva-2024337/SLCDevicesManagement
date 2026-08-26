# SLCDevicesManagement — Frontend

Frontend de **SLCDevicesManagement**, sistema de inventario de activos multiempresa de Sistemas Logísticos y Corporativos, S.A.

Stack: React 19 + Vite + TypeScript + Tailwind CSS 4. Consume la API REST `SLCDM.Api`.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Cómo levantarlo

```bash
cd frontend
cp .env.example .env   # en Windows: copy .env.example .env
npm install
npm run dev
```

La app queda en [http://localhost:5173](http://localhost:5173).

Variables en `.env`:

| Variable        | Descripción                                                                |
| --------------- | -------------------------------------------------------------------------- |
| `VITE_API_URL`  | URL de `SLCDM.Api` (en local: `http://localhost:5139`)                     |
| `VITE_USE_MOCK` | `true` en Sprint 1 (API no expuesta). `false` cuando exista `/health` real |

Scripts:

```bash
npm run dev           # entorno de desarrollo
npm run build         # typecheck + bundle de producción
npm run lint          # ESLint
npm run format        # Prettier
```

## Estructura

```
src/
  app/                 # composición de la aplicación
  core/                # infraestructura (env, Axios, auth token, mocks)
    http/              # única instancia Axios + interceptor JWT
  features/            # un módulo de negocio = una carpeta
    health/            # verificación FE-01 (no es pantalla de negocio)
    organizaciones/
    catalogos/         # País será el primer catálogo (plantilla del backend)
    activos/
    asignaciones/
    traslados/
    mantenimientos/
    inventario-fisico/
    reportes/
  shared/
    components/        # UI reutilizable (loading / error)
    hooks/
    layout/
    utils/
```

Convención por feature (cuando exista lógica):

```
features/<modulo>/
  api/           # llamadas HTTP del módulo (usa httpClient)
  components/
  hooks/
  types.ts
  index.ts       # API pública del feature
```

Los componentes de UI no importan Axios. Solo las carpetas `api/`.

## Ramas y commits

Ramas desde `main`:

```
<tipo>/FE-XX-descripcion-corta
```

Ejemplos: `chore/FE-01-setup-proyecto`, `feat/FE-02-listado-paises`.

Commits (Conventional Commits):

| Prefijo     | Uso                                       |
| ----------- | ----------------------------------------- |
| `feat:`     | funcionalidad nueva                       |
| `fix:`      | corrección de bug                         |
| `docs:`     | documentación                             |
| `refactor:` | cambio interno sin alterar comportamiento |
| `chore:`    | tooling, setup, dependencias              |

Ejemplo: `feat: listar países en el catálogo`.
