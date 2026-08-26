# SLCDevicesManagement — Frontend

Interfaz web del inventario de activos multiempresa (Sistemas Logísticos y Corporativos, S.A.).

Stack: React 19 + Vite (JavaScript) + Tailwind CSS + Axios.

## Cómo levantar el proyecto

Requisito: Node.js 20.19 o superior.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

La app queda en [http://localhost:5173](http://localhost:5173). Debes ver **SLCDevicesManagement** y el estado del cliente HTTP (por defecto en modo mock).

Otros comandos:

| Script            | Qué hace                  |
| ----------------- | ------------------------- |
| `npm run dev`     | Servidor de desarrollo    |
| `npm run build`   | Build de producción       |
| `npm run preview` | Sirve el build localmente |
| `npm run lint`    | ESLint                    |
| `npm run format`  | Prettier                  |

## Variables de entorno

Copiar `.env.example` a `.env`. Nunca hardcodear la URL de la API.

| Variable            | Descripción                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| `VITE_API_URL`      | Base URL de la API .NET (`http://localhost:5139` en el perfil HTTP del backend)        |
| `VITE_USE_API_MOCK` | `true` en Sprint 1 (API aún no expuesta). `false` para llamar a `GET /weatherforecast` |

Cuando el backend tenga CORS y un health real, cambia el path en `src/shared/services/healthService.js`.

## Estructura de carpetas

Estructura provisional por feature, pensada para reorganizarse al conectar la API (Sprint 4+):

```
frontend/src/
  app/                 bootstrap y página de verificación
  features/            un módulo de negocio por carpeta
    auth/
    organizacion/      Empresa, Sede, Área
    catalogos/         País y demás catálogos
    activos/
    asignaciones/
    inventario/
    mantenimientos/
    bajas/
    reportes/
  shared/
    components/        UI reutilizable (p. ej. FeedbackState)
    hooks/
    layout/
    services/          Axios, token JWT, health check
    utils/
    config/            lectura de variables VITE_*
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
