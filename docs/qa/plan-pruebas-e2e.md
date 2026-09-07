# Plan de pruebas end-to-end — Sprint 9 (FE-11)

Pruebas contra la **API real**. `frontend/.env` debe tener `VITE_USE_API_MOCK=false`. El mock no cuenta.

API: `http://localhost:5139` (Swagger `/swagger`). Frontend: `http://localhost:5173`.

Las contraseñas de los usuarios de prueba **no se anotan aquí**.

## Perfiles

| Id | Username (previsto) | Rol | Empresa |
| --- | --- | --- | --- |
| P-AG | `mbarrios` | Administrador general | — (selector de empresa activa) |
| P-AE | `cmorales` | Administrador de empresa | 1 |
| P-OP | `ahernandez` | Operador de inventario | 1 |
| P-CO | `jlopez` | Consulta | 1 |

Si falta alguno, crearlo desde `/app/catalogos/usuarios` con Administrador general y anotar el username en `resultados-sprint9.md`.

## Convención

- **Feliz:** camino principal del módulo.
- **Borde:** regla de servidor o de perfil documentada en sprints anteriores.
- Resultado: pasó / falló / bloqueado.

---

## 1. Autenticación y sesión

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| AUTH-01 | API arriba, usuario válido | `/login` con email o username y clave correcta | 200, JWT, redirección a `/app` | P-AE |
| AUTH-02 | API arriba | Login con clave incorrecta | 401, mensaje de error, sin token | P-AE |
| AUTH-03 | Sesión iniciada | Recargar `/app` | Sigue autenticado (token en storage) | P-AE |
| AUTH-04 | Sin token | Abrir `/app/activos` | Redirección a `/login` | — |
| AUTH-05 | Token basura en storage | Abrir `/app` | 401 o logout; vuelve a login | — |
| AUTH-06 | Token expirado | Cualquier `GET` autenticado | 401 | P-AE |
| AUTH-07 | 5 logins fallidos en 1 min desde la misma IP | Sexto `POST /api/auth/login` | 429 `Too Many Requests. Please try again later.` | — |
| AUTH-08 | Sesión P-AG | `GET /api/auth/profile` | Datos del usuario, `rol` AdministradorGeneral, `idEmpresa` nulo | P-AG |

---

## 2. Catálogos (7)

Cubrir empresas, sedes, áreas, categorías, proveedores, ubicaciones y países. Alta/edición/inactivar según el perfil.

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| CAT-01 | P-AE en empresa 1 | Listar `/app/catalogos/empresas` | Ve su empresa; no crea empresa | P-AE |
| CAT-02 | P-AG | Crear empresa válida | 201 `{ id }`, aparece en la lista | P-AG |
| CAT-03 | P-AG, empresa nueva | Inactivar empresa (`POST {id}/disable`) | 204, queda inhabilitada | P-AG |
| CAT-04 | P-AE | Crear sede de su empresa | 201, `idEmpresa` de su token | P-AE |
| CAT-05 | P-AE | Crear área, categoría, proveedor | 201 cada uno | P-AE |
| CAT-06 | P-AE | Crear ubicación con lat/long nulos | 400; no se inventan `0,0` | P-AE |
| CAT-07 | P-AE | Crear ubicación con coordenadas | 201 | P-AE |
| CAT-08 | P-AG | Crear y borrar país (`DELETE`) | País creado; delete quita el registro (no hay `habilitado`) | P-AG |
| CAT-09 | P-OP | Abrir sedes / empresas / crear | Sin escritura en sedes/empresas; sí en ubicaciones | P-OP |
| CAT-10 | P-CO | Abrir cualquier catálogo y pulsar Registrar | Acción deshabilitada u oculta; no hay POST | P-CO |
| CAT-11 | P-AE | Editar proveedor: UI pide correo | El JSON usa `corre`; la UI sigue diciendo correo | P-AE |
| CAT-12 | P-AG, empresa activa = 2 | Listar sedes | Solo sedes de la empresa 2 (filtro de token no aplica a P-AG; el selector sí) | P-AG |

---

## 3. Activos

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| ACT-01 | P-OP, catálogos vivos | Alta de activo válido | 201, aparece en `/app/activos` | P-OP |
| ACT-02 | Activo existente | Editar nombre y guardar | 204, ficha actualizada | P-OP |
| ACT-03 | Activo existente | Abrir ficha `?id=` | Deep link de ficha | P-OP |
| ACT-04 | Parque con varios estados | `/app/activos?estado=Disponible` | Solo disponibles (nombre de catálogo, no id) | P-OP |
| ACT-05 | P-CO | Intentar Registrar / Editar | Acciones de escritura no ejecutan POST/PUT | P-CO |
| ACT-06 | Activo dado de baja | Acciones trasladar / mantenimiento / asignar | Deshabilitadas con motivo | P-OP |

---

## 4. Asignaciones

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| ASG-01 | Activo disponible | Entregar a un responsable | `POST /api/Asignaciones`, tipo Asignacion, `activa` true | P-OP |
| ASG-02 | Asignación activa | Devolver | `POST /api/Asignaciones/{id}/devolver`, queda inactiva | P-OP |
| ASG-03 | Activo con asignación activa | Volver a asignar | Error de servidor (activo ya asignado); no segunda activa | P-OP |
| ASG-04 | P-CO | Botón registrar entrega | No hay POST | P-CO |

---

## 5. Traslados

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| TRA-01 | Activo no de baja | Trasladar a otra ubicación de la misma empresa | `POST /api/Asignaciones/traslado`, origen en observaciones | P-OP |
| TRA-02 | Activo dado de baja | Trasladar | UI deshabilitada; si se fuerza el POST, el servidor rechaza | P-OP |
| TRA-03 | Activo de empresa 1 | Destino de otra empresa | El select no ofrece esa ubicación; el servidor no cruza empresas | P-OP |
| TRA-04 | P-CO | Registrar traslado | Sin escritura | P-CO |

---

## 6. Mantenimientos

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| MAN-01 | Activo no de baja | Abrir mantenimiento preventivo o correctivo | `POST /api/Asignaciones/mantenimiento` | P-OP |
| MAN-02 | Orden abierta | Finalizar | `POST /api/Asignaciones/{id}/finalizar-mantenimiento` | P-OP |
| MAN-03 | Activo de baja | Abrir mantenimiento | UI deshabilitada; el servidor rechaza | P-OP |
| MAN-04 | Hay abiertos | `/app/activos?vista=mantenimientos&abiertos=1` | Solo órdenes abiertas | P-OP |
| MAN-05 | P-CO | Registrar / finalizar | Sin escritura | P-CO |

---

## 7. Bajas

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| BAJ-01 | Activo libre, P-AE | Dar de baja con motivo, URL de PDF y autorizado | `POST /api/Asignaciones/baja`, estado Dado de baja | P-AE |
| BAJ-02 | Activo ya de baja | Dar de baja otra vez | 409 *"El activo ya esta dado de baja."* | P-AE |
| BAJ-03 | Activo con asignación o mantenimiento activo | Dar de baja | 409 *"El activo tiene una asignacion o un mantenimiento activo. Cierren el proceso antes de dar de baja."* | P-AE |
| BAJ-04 | P-OP | Acción Dar de baja en la ficha | Deshabilitada; el endpoint pide EscrituraEmpresa | P-OP |
| BAJ-05 | P-CO | Dar de baja | Sin escritura | P-CO |
| BAJ-06 | Baja registrada | Abrir ficha: motivo, autorizado, documento | Leídos del historial (`detalleBajaParser`); si el formato no coincide, "—" | P-AE |

---

## 8. Inventario físico

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| INV-01 | Sede sin jornada abierta, P-OP | Abrir jornada (sede, responsable texto, fecha) | `POST /api/HistoricosInventario`, navega a la hoja | P-OP |
| INV-02 | Esa sede ya tiene jornada abierta | Abrir otra | 400/409 *"Ya existe una jornada de inventario abierta para esta sede."* en `idSede` | P-OP |
| INV-03 | Jornada abierta, activo esperado | Registrar hallazgo | `POST /api/DetallesActivo` | P-OP |
| INV-04 | Mismo activo, misma jornada | Registrar otra vez | 400, `fieldErrors.idActivo` | P-OP |
| INV-05 | Hallazgo existente, jornada abierta | Editar encontrado / estado / observaciones | PUT con `id` en ruta y body; la fecha no cambia | P-OP |
| INV-06 | Hallazgo existente, jornada abierta | Eliminar (confirmar) | DELETE; el historial de esa verificación **sí se borra** | P-OP |
| INV-07 | Jornada abierta | Cerrar (confirmar) | `POST .../cerrar?fechaCierre=`, irreversible | P-OP |
| INV-08 | Jornada ya cerrada | Cerrar otra vez | 409 *"La jornada de inventario ya esta cerrada."* | P-OP |
| INV-09 | Jornada cerrada | Registrar / editar / eliminar hallazgo | 400 registrar; 409 editar/eliminar | P-OP |
| INV-10 | Jornada cerrada | `GET /api/Reportes/diferencias-inventario` | Aparece; una jornada abierta no | P-OP |
| INV-11 | P-CO, jornada abierta | Registrar / editar / eliminar / cerrar / abrir | Acciones visibles y deshabilitadas con motivo | P-CO |

---

## 9. Bitácora

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| BIT-01 | P-AE, hubo altas | `/app/bitacora` | Lista; expandir muestra anterior/nuevo | P-AE |
| BIT-02 | P-AG | Filtrar por usuario y entidad | Query `idUsuario`, `entidadAfectada`; fechas/tipo en cliente | P-AG |
| BIT-03 | P-OP | Ir a `/app/bitacora` por URL | Sin permiso (`RutaAdministrador`) | P-OP |
| BIT-04 | P-CO | Ir a `/app/bitacora` por URL | Sin permiso | P-CO |
| BIT-05 | P-AE | Buscar alta o edición | No hay botones de escritura | P-AE |

---

## 10. Dashboard

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| DAS-01 | P-AE, hay activos | Abrir `/app` | Widgets: total, disponibles, asignados, mantenimiento, baja, costo GTQ | P-AE |
| DAS-02 | P-AG, sin empresa activa | `/app` | Consolidado de varias empresas + desglose | P-AG |
| DAS-03 | P-AG | Cambiar empresa activa | Todos los paneles recargan con `idEmpresa` | P-AG |
| DAS-04 | Hay categorías | Clic en una barra | Va a `/app/reportes/activos?idCategoriaActivo=` | P-AE |
| DAS-05 | Widget Disponibles | Clic | `/app/activos?estado=Disponible` | P-AE |
| DAS-06 | Widget mantenimiento | Clic | `/app/activos?vista=mantenimientos&abiertos=1` | P-AE |
| DAS-07 | Widget bajas | Clic | `/app/activos?vista=bajas` | P-AE |
| DAS-08 | Diferencia de jornada cerrada | Clic en el grupo | `/app/inventario-fisico/:id` | P-AE |
| DAS-09 | Garantías | Cambiar 30 / 60 / 90 | Nueva petición `dias`; tono ≤7 danger, ≤30 warning | P-AE |
| DAS-10 | P-CO | Abrir `/app` | Lectura; los widgets navegan | P-CO |

---

## 11. Reportes

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| REP-01 | P-AE | `/app/reportes` | 8 tarjetas | P-AE |
| REP-02 | P-AE | Abrir activos detallados | `GET /api/Reportes/activos`, `activo` anidado | P-AE |
| REP-03 | Listado | Filtrar estado `disponible` | Query normalizado; otros valores 400 | P-AE |
| REP-04 | Más de 100 activos o `take` chico | Siguiente / anterior | Fin cuando llegan menos de `take`; no hay "página X de Y" | P-AE |
| REP-05 | P-AG | Alternar empresa en el reporte | Recarga con `idEmpresa` | P-AG |
| REP-06 | P-CO | Abrir reportes | Lectura (Roles.Lectura en los 8) | P-CO |
| REP-07 | Jornada abierta con hallazgos | Diferencias del dashboard/reporte | No incluye esa jornada | P-AE |

---

## 12. Permisos y aislamiento

| Id | Precondición | Pasos | Resultado esperado | Perfil |
| --- | --- | --- | --- | --- |
| PER-01 | P-AE empresa 1 | Pedir activos o reportes de otra empresa (`idEmpresa` ajeno) | El servidor ignora el query y usa el token | P-AE |
| PER-02 | P-CO | Cualquier escritura (catálogo, activo, hallazgo, baja) | UI bloqueada; API 403 si se fuerza | P-CO |
| PER-03 | P-OP | `POST /api/Asignaciones/baja` | 403 (EscrituraEmpresa) | P-OP |
| PER-04 | P-AG | Ver datos de dos empresas con el selector | Cambia el recorte; sin selector ve todas | P-AG |

---

## Notas de contrato a verificar en evidencia

- Ruta de reportes: `/api/Reportes`, no `/api/ReportesOperativos`.
- `estadoOperativo` en minúsculas.
- `GET /api/Reportes/activos` sin total.
- Cerrar jornada: `fechaCierre` es query.
- No existe `GET /api/HistoricosInventario/{id}/esperados` (el cliente lo replica).
