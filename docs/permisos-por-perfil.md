# Matriz de permisos por perfil

Referencia cruzada entre `[Authorize]` de `src/SLCDM.Api/Controllers` (`Roles.cs`) y `canWriteCatalog` en `frontend/src/features/auth/useAuth.js`.

Perfiles (`RolUsuario`): Consulta (0), OperadorInventario (1), AdministradorEmpresa (2), AdministradorGeneral (3).

| Grupo backend | Quién |
| --- | --- |
| Lectura | los 4 |
| EscrituraOperativa | OperadorInventario, AdministradorEmpresa, AdministradorGeneral |
| EscrituraEmpresa | AdministradorEmpresa, AdministradorGeneral |
| AdministradorGeneral | solo ese |

En el frontend, `Consulta` o rol nulo **nunca** escribe. `RutaProtegida` pide sesión. `RutaEscritura` resuelve el recurso desde `/catalogos/:slug/(nueva|:id/editar)` (`empresas/nueva` → `empresas-create`). `RutaAdministrador` cubre `/app/bitacora` (`>= AdministradorEmpresa`).

## Tabla

| Recurso | Método | Backend | Frontend (`canWrite` / guarda) | ¿Alineado? |
| --- | --- | --- | --- | --- |
| Auth `/login` | POST | anónimo | anónimo | Sí |
| Auth `/me` | GET | Lectura | sesión | Sí |
| Health | GET | anónimo | anónimo | Sí |
| Paises | GET | Lectura | no se oculta la lista | Sí |
| Paises | POST/PUT/DELETE | AdministradorGeneral | `paises` → solo AdministradorGeneral | Sí |
| Estados | GET | Lectura | lookups; sin pantalla de escritura | Sí |
| Estados | POST/PUT/disable | AdministradorGeneral | `estados` → solo AdministradorGeneral | Sí (preventivo; no hay UI) |
| TiposAsignacion | GET | Lectura | lookups; sin pantalla de escritura | Sí |
| TiposAsignacion | POST/PUT/disable | AdministradorGeneral | `tipos-asignacion` → solo AdministradorGeneral | Sí (preventivo; no hay UI) |
| Empresas | GET | Lectura | no se oculta la lista | Sí |
| Empresas | POST | AdministradorGeneral | `empresas-create` | Sí |
| Empresas | PUT/disable | EscrituraEmpresa | `empresas` → `>= AdministradorEmpresa` | Sí |
| Sedes | GET | Lectura | no se oculta la lista | Sí |
| Sedes | POST/PUT/disable | EscrituraEmpresa | `sedes` → else (`>= AdministradorEmpresa`) | Sí |
| Areas | GET | Lectura | slug `areas` | Sí |
| Areas | POST/PUT/disable | EscrituraEmpresa | else | Sí |
| CategoriasActivo | GET | Lectura | slug `categorias` | Sí |
| CategoriasActivo | POST/PUT/disable | EscrituraEmpresa | else | Sí |
| Proveedores | GET | Lectura | slug `proveedores` | Sí |
| Proveedores | POST/PUT/disable | EscrituraEmpresa | else | Sí |
| Usuarios | GET | **EscrituraEmpresa** (único GET de catálogo que no es Lectura) | no se llama `getAll` si `!canWrite('usuarios')`; el select se deshabilita con motivo | Sí |
| Usuarios | POST/PUT/disable | EscrituraEmpresa | else (no hay CRUD de usuarios en UI) | Sí |
| Responsables | GET | Lectura | lookups en formularios operativos | Sí |
| Responsables | POST/PUT/disable | EscrituraOperativa | `responsables` → `>= OperadorInventario` | Sí (no hay catálogo propio; `RutaEscritura` y `CatalogoPage` ya resuelven el slug) |
| Ubicaciones | GET | Lectura | slug `ubicaciones` | Sí |
| Ubicaciones | POST/PUT/disable | EscrituraOperativa | `ubicaciones` → `>= OperadorInventario` | Sí |
| Redes conocidas | GET | Lectura (por analogía; **sin controller**) | slug `redes-conocidas`; lista visible a los 4 | Por confirmar |
| Redes conocidas | POST/PUT/DELETE | EscrituraOperativa esperada; **sin controller** | `redes-conocidas` → `>= OperadorInventario` (igual que Ubicaciones) | Por confirmar |
| Activos | GET | Lectura | lista visible a los 4 | Sí |
| Activos | POST/PUT/disable | EscrituraOperativa | `activos` | Sí |
| Asignaciones | GET | Lectura | lista visible a los 4 | Sí |
| Asignaciones entrega/PUT/devolver | POST/PUT | EscrituraOperativa | `asignaciones` | Sí |
| Asignaciones `/{id}/pdf/verificar` | POST | EscrituraOperativa esperada; **sin endpoint** | botón solo si `canWrite('asignaciones')` | Por confirmar |
| Consulta pública `/consulta/:codigo` | GET | anónimo esperado; **sin endpoint** | ruta pública, sin login | Por confirmar |
| Activos `/{id}/qr` | GET | Lectura esperada; **sin endpoint** | botón en ficha autenticada | Por confirmar |
| Asignaciones `/traslado` | POST | EscrituraOperativa | `traslados` | Sí |
| Asignaciones `/mantenimiento` y finalizar | POST | EscrituraOperativa | `mantenimientos` | Sí |
| Asignaciones `/baja` | POST | EscrituraEmpresa | `bajas` → else | Sí |
| HistoricosInventario | GET (incl. `/diferencias`) | Lectura | lista visible a los 4 | Sí |
| HistoricosInventario | POST y `/cerrar` | EscrituraOperativa | `inventario-fisico` | Sí |
| DetallesActivos | GET | Lectura | hoja de conteo | Sí |
| DetallesActivos | POST/PUT/DELETE | EscrituraOperativa | `inventario-fisico` | Sí |
| HistorialActivos | GET | Lectura | timeline / parser de baja | Sí |
| HistorialActivos | POST | EscrituraOperativa | no hay alta directa en UI | Sí |
| Bitacoras | GET/POST | EscrituraEmpresa | `RutaAdministrador` + `adminOnly` | Sí |
| Reportes (8) | GET | Lectura | sin escritura | Sí |
| Dispositivos | GET `rastreo` y `fuera-de-rango` | Lectura | `/app/rastreo` (misma visibilidad que reportes) | Sí |
| Dispositivos | POST / revocar | EscrituraOperativa | **sin interfaz** | N/A |
| Dispositivos | POST auto-registro | anónimo | **sin interfaz** | N/A |
| Dispositivos | POST ping | token de dispositivo | **sin interfaz** | N/A |

## Diferencias explicadas

Ninguna desalineación queda abierta entre la matriz de controllers y `canWriteCatalog` después de FE-12.

1. **GET Usuarios ≠ Lectura.** El frontend no trata ese GET como catálogo público: `usuarioService.getAllIfAllowed` solo dispara si `canWrite('usuarios')` (mismo umbral que EscrituraEmpresa). Consulta y OperadorInventario no reciben el 403.
2. **Estados y tipos de asignación** no tienen pantalla de escritura. La rama explícita existe para que un maestro futuro no le dé el `else` (AdministradorEmpresa) a un recurso que la API reserva a AdministradorGeneral.
3. **Responsables** no tiene `CatalogoPage`. El permiso ya coincide con EscrituraOperativa por si la ruta `/app/catalogos/responsables` se agrega.
4. **Dispositivos** es API publicada sin tarea FE. No hay recurso en `canWriteCatalog`. Ver `frontend/README.md`.
5. **Redes conocidas** no tiene controller. El frontend ya pide escritura desde OperadorInventario (igual que Ubicaciones). El `[Authorize]` real queda por confirmar.

Si BE-24 cambia un `[Authorize]`, actualizar esta tabla y `canWriteCatalog` en el mismo cambio.
