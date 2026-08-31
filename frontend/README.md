# SLCDevicesManagement — Frontend

Interfaz web del inventario de activos multiempresa (Sistemas Logísticos y Corporativos, S.A.). Producto: **DERCAS**.

Stack: React 19 + Vite 8 (JavaScript) + Tailwind CSS 4 + Axios + React Router 7.

## Cómo levantar el proyecto

Requisito: Node.js 20.19 o superior.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

La app queda en [http://localhost:5173](http://localhost:5173). Debes ver el shell (sidebar + topbar) y el dashboard con el estado del cliente HTTP (por defecto en modo mock).

Otros comandos:

| Script                 | Qué hace                  |
| ---------------------- | ------------------------- |
| `npm run dev`          | Servidor de desarrollo    |
| `npm run build`        | Build de producción       |
| `npm run preview`      | Sirve el build localmente |
| `npm run lint`         | ESLint                    |
| `npm run format`       | Prettier (escribe)        |
| `npm run format:check` | Prettier (solo verifica)  |

## Variables de entorno

Copiar `.env.example` a `.env`. Nunca hardcodear la URL de la API.

| Variable            | Descripción                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `VITE_API_URL`      | Base URL de la API .NET (`http://localhost:5139` en el perfil HTTP)        |
| `VITE_USE_API_MOCK` | `true` (catálogos y health en memoria). `false` para pegarle a la API real |

### Mocks vs API real

Los seis catálogos (y País, usado como lookup) corren contra datos de prueba **en memoria** mientras `VITE_USE_API_MOCK=true`. Cada servicio ya tiene la rama HTTP escrita (`GET/POST/PUT/DELETE` a `/api/empresas`, `/api/sedes`, `/api/areas`, `/api/categorias`, `/api/proveedores`, `/api/ubicaciones`, `/api/paises`).

Cuando el backend publique esos controllers (FE-05):

1. Poné `VITE_USE_API_MOCK=false` en `.env`.
2. Confirmá que las rutas coincidan con los controllers.
3. No hace falta reescribir las pantallas: el componente no sabe si la respuesta vino del mock o de Axios.

Los cambios de crear/editar/inactivar **no se persisten al recargar** en modo mock: viven en un array a nivel de módulo durante la sesión.

`healthService` con mock en `false` sigue llamando a `GET /weatherforecast` (plantilla del backend) hasta que exista un health real.

## Rutas

Definidas en `src/app/App.jsx`. `BrowserRouter` se monta en `src/main.jsx`. El shell `AppLayout` envuelve todas las rutas con `<Outlet />`.

| Ruta                     | Página               | Estado    |
| ------------------------ | -------------------- | --------- |
| `/`                      | Dashboard (HomePage) | Activa    |
| `/catalogos/empresas`    | Empresas             | Activa    |
| `/catalogos/sedes`       | Sedes                | Activa    |
| `/catalogos/areas`       | Áreas                | Activa    |
| `/catalogos/categorias`  | Categorías           | Activa    |
| `/catalogos/proveedores` | Proveedores          | Activa    |
| `/catalogos/ubicaciones` | Ubicaciones          | Activa    |
| `*`                      | 404                  | Activa    |
| `/activos`               | —                    | Comentada |
| `/asignaciones`          | —                    | Comentada |
| `/traslados`             | —                    | Comentada |
| `/mantenimientos`        | —                    | Comentada |
| `/bajas`                 | —                    | Comentada |
| `/inventario`            | —                    | Comentada |
| `/reportes`              | —                    | Comentada |

Empresa, Sede y Área viven en `features/organizacion/` pero las URLs quedan bajo `/catalogos/...` para un único menú de catálogos.

## Estructura de carpetas

```
frontend/src/
  app/
    App.jsx
    pages/HomePage.jsx
    pages/NotFoundPage.jsx
  features/
    organizacion/
      mocks/{empresas,sedes,areas}.js
      empresas/{EmpresasPage,EmpresaForm,empresaService}.js(x)
      sedes/{SedesPage,SedeForm,sedeService}.js(x)
      areas/{AreasPage,AreaForm,areaService}.js(x)
    catalogos/
      mocks/{paises,categorias,proveedores,ubicaciones}.js
      paises/paisService.js          lookup; sin pantalla CRUD
      categorias/{CategoriasPage,CategoriaForm,categoriaService}.js(x)
      proveedores/{ProveedoresPage,ProveedorForm,proveedorService}.js(x)
      ubicaciones/{UbicacionesPage,UbicacionForm,ubicacionService}.js(x)
    auth/ activos/ asignaciones/ inventario/ mantenimientos/ bajas/ reportes/
  shared/
    components/
    hooks/
    layout/AppLayout.jsx + navConfig.js
    services/httpClient.js, tokenStorage.js, healthService.js, createMockCrudService.js
    utils/
    config/env.js
```

Los componentes no llaman a Axios directo: pasan por servicios (`shared/services` o `*Service.js` del feature, que a su vez usan `httpClient` o el mock).

Los campos de cada catálogo coinciden con `SLCDM.Domain` (camelCase): `id`, `habilitado` y los propios de la entidad. No hay `fechaCreacion` / `fechaModificacion` en estos catálogos. Proveedor usa `correo`, no `email`. País no tiene `habilitado`.

## Componentes compartidos

Todos exportan `export function Nombre` (un componente por archivo).

| Componente                                                      | API principal                                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FeedbackState`                                                 | `status` (`idle` \| `loading` \| `error` \| `empty` \| `success`), mensajes, `children` en éxito                                                                                                                                                  |
| `Button`                                                        | `variant`: `primary` \| `secondary` \| `danger` \| `ghost`                                                                                                                                                                                        |
| `Badge`                                                         | mismas variantes + `success` (estado Activo)                                                                                                                                                                                                      |
| `PageHeader`                                                    | `title`, `description?`, `actions?`                                                                                                                                                                                                               |
| `AlertBanner`                                                   | `variant` (`success` \| `error` \| `info`), `message`, `onDismiss?`                                                                                                                                                                               |
| `Modal`                                                         | `isOpen`, `onClose`, `title`, `footer?`, `children`. Portal, Escape, backdrop, lock de scroll, focus trap                                                                                                                                         |
| `ConfirmDialog`                                                 | sobre `Modal`: `onConfirm`, `message`, `confirmLabel`, `variant`, `isConfirming`                                                                                                                                                                  |
| `DataTable`                                                     | `columns` (`{ key, header, render?, align?, sortable? }`), `rows`, `keyField`, `isLoading`, `errorMessage`, `emptyMessage`, `onRowClick?`, `rowClassName?`, búsqueda / sort / paginación en cliente. Delegá loading/error/empty a `FeedbackState` |
| `TextField` / `SelectField` / `TextareaField` / `CheckboxField` | `label`, `name`, `value`, `onChange`, `error`, `required`, `disabled`, `<label htmlFor>`                                                                                                                                                          |
| `FormActions`                                                   | `onCancel`, `submitLabel`, `isSubmitting`                                                                                                                                                                                                         |
| `HabilitadoFilter`                                              | `value` (`activos` \| `inactivos` \| `todos`), `onChange`                                                                                                                                                                                         |

Hook `useForm({ initialValues, validate })` → `values`, `errors`, `touched`, `handleChange`, `handleBlur`, `handleSubmit`, `reset`, `setValues`, `setFieldValue`. `validate(values)` devuelve un objeto de errores por campo (mismos textos que `[Required]` / `[MaxLength]` del backend).

Fábrica `createMockCrudService({ endpoint, seed })` → `getAll`, `getById`, `create`, `update`, `remove` (soft delete vía `habilitado: false`).

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
