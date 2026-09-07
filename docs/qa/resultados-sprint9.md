# Resultados e2e — Sprint 9

Fecha: 2026-09-07. Rama de código bajo prueba: `origin/main` @ `ed3ef79` (merge FE-10, PR #180).

## Entorno

| Dato | Valor |
| --- | --- |
| `VITE_USE_API_MOCK` | `false` (`frontend/.env`) |
| API | `http://localhost:5139` — **no responde** |
| Frontend | no se recorrió (sin API no hay sesión real) |
| Swagger | no levantó |

## Perfiles usados

Ninguno se autenticó contra la API real. Usernames previstos (sin contraseñas): `mbarrios`, `cmorales`, `ahernandez`, `jlopez`. No se pudo comprobar que existan en la base: no hay seed de usuarios en el repo y el API no arranca para crearlos.

## Bloqueo raíz

`dotnet build src/SLCDM.Api/SLCDM.Api.csproj` falló:

```
src/SLCDM.Api/Controllers/DispositivosController.cs(29,56): error CS1003: Error de sintaxis, se esperaba ','
```

El constructor de `DispositivosController` no tiene coma entre `_ping` y el handler de fuera de rango. Además no existen en Application `GetDispositivosRastreoQuery` ni `DispositivoRastreoDto` (solo hay `GetDispositivosFueraDeRangoQuery` y comandos de registro/revocación). Tras corregir la coma el build volvería a fallar por esos tipos.

`Invoke-WebRequest http://localhost:5139/swagger/index.html` → timeout. No se forzó ningún fix (FE-11 documenta, no corrige).

Todos los casos quedan **bloqueados** por ese hallazgo. No se inventan pases en mock.

## Resultados

### Autenticación

| Id | Resultado | Evidencia |
| --- | --- | --- |
| AUTH-01 | Bloqueado | API no compila; no hay `POST /api/auth/login` |
| AUTH-02 | Bloqueado | Idem |
| AUTH-03 | Bloqueado | Idem |
| AUTH-04 | Bloqueado | Idem (el guard del frontend no se ejerció con API viva) |
| AUTH-05 | Bloqueado | Idem |
| AUTH-06 | Bloqueado | Idem |
| AUTH-07 | Bloqueado | Rate limit 5/min en `RateLimitingExtensions`; no se disparó |
| AUTH-08 | Bloqueado | Idem |

### Catálogos

| Id | Resultado | Evidencia |
| --- | --- | --- |
| CAT-01 | Bloqueado | Sin login real |
| CAT-02 | Bloqueado | Sin login real |
| CAT-03 | Bloqueado | Sin login real |
| CAT-04 | Bloqueado | Sin login real |
| CAT-05 | Bloqueado | Sin login real |
| CAT-06 | Bloqueado | Sin login real |
| CAT-07 | Bloqueado | Sin login real |
| CAT-08 | Bloqueado | Sin login real |
| CAT-09 | Bloqueado | Sin login real |
| CAT-10 | Bloqueado | Sin login real |
| CAT-11 | Bloqueado | Sin login real |
| CAT-12 | Bloqueado | Sin login real |

### Activos

| Id | Resultado | Evidencia |
| --- | --- | --- |
| ACT-01 | Bloqueado | Sin API |
| ACT-02 | Bloqueado | Sin API |
| ACT-03 | Bloqueado | Sin API |
| ACT-04 | Bloqueado | Sin API |
| ACT-05 | Bloqueado | Sin API |
| ACT-06 | Bloqueado | Sin API |

### Asignaciones

| Id | Resultado | Evidencia |
| --- | --- | --- |
| ASG-01 | Bloqueado | Sin API |
| ASG-02 | Bloqueado | Sin API |
| ASG-03 | Bloqueado | Sin API |
| ASG-04 | Bloqueado | Sin API |

### Traslados

| Id | Resultado | Evidencia |
| --- | --- | --- |
| TRA-01 | Bloqueado | Sin API |
| TRA-02 | Bloqueado | Sin API |
| TRA-03 | Bloqueado | Sin API |
| TRA-04 | Bloqueado | Sin API |

### Mantenimientos

| Id | Resultado | Evidencia |
| --- | --- | --- |
| MAN-01 | Bloqueado | Sin API |
| MAN-02 | Bloqueado | Sin API |
| MAN-03 | Bloqueado | Sin API |
| MAN-04 | Bloqueado | Sin API |
| MAN-05 | Bloqueado | Sin API |

### Bajas

| Id | Resultado | Evidencia |
| --- | --- | --- |
| BAJ-01 | Bloqueado | Sin API |
| BAJ-02 | Bloqueado | Sin API |
| BAJ-03 | Bloqueado | Sin API |
| BAJ-04 | Bloqueado | Sin API |
| BAJ-05 | Bloqueado | Sin API |
| BAJ-06 | Bloqueado | Sin API |

### Inventario físico

| Id | Resultado | Evidencia |
| --- | --- | --- |
| INV-01 | Bloqueado | Sin API |
| INV-02 | Bloqueado | Sin API |
| INV-03 | Bloqueado | Sin API |
| INV-04 | Bloqueado | Sin API |
| INV-05 | Bloqueado | Sin API |
| INV-06 | Bloqueado | Sin API |
| INV-07 | Bloqueado | Sin API |
| INV-08 | Bloqueado | Sin API |
| INV-09 | Bloqueado | Sin API |
| INV-10 | Bloqueado | Sin API |
| INV-11 | Bloqueado | Sin API |

### Bitácora

| Id | Resultado | Evidencia |
| --- | --- | --- |
| BIT-01 | Bloqueado | Sin API |
| BIT-02 | Bloqueado | Sin API |
| BIT-03 | Bloqueado | Sin API |
| BIT-04 | Bloqueado | Sin API |
| BIT-05 | Bloqueado | Sin API |

### Dashboard

| Id | Resultado | Evidencia |
| --- | --- | --- |
| DAS-01 | Bloqueado | Sin API (`VITE_USE_API_MOCK=false`) |
| DAS-02 | Bloqueado | Sin API |
| DAS-03 | Bloqueado | Sin API |
| DAS-04 | Bloqueado | Sin API |
| DAS-05 | Bloqueado | Sin API |
| DAS-06 | Bloqueado | Sin API |
| DAS-07 | Bloqueado | Sin API |
| DAS-08 | Bloqueado | Sin API |
| DAS-09 | Bloqueado | Sin API |
| DAS-10 | Bloqueado | Sin API |

### Reportes

| Id | Resultado | Evidencia |
| --- | --- | --- |
| REP-01 | Bloqueado | Sin API |
| REP-02 | Bloqueado | Sin API |
| REP-03 | Bloqueado | Sin API |
| REP-04 | Bloqueado | Sin API |
| REP-05 | Bloqueado | Sin API |
| REP-06 | Bloqueado | Sin API |
| REP-07 | Bloqueado | Sin API |

### Permisos

| Id | Resultado | Evidencia |
| --- | --- | --- |
| PER-01 | Bloqueado | Sin API |
| PER-02 | Bloqueado | Sin API |
| PER-03 | Bloqueado | Sin API |
| PER-04 | Bloqueado | Sin API |

## Resumen

| Módulo | Casos | Pasó | Falló | Bloqueado |
| --- | --- | --- | --- | --- |
| Autenticación | 8 | 0 | 0 | 8 |
| Catálogos | 12 | 0 | 0 | 12 |
| Activos | 6 | 0 | 0 | 6 |
| Asignaciones | 4 | 0 | 0 | 4 |
| Traslados | 4 | 0 | 0 | 4 |
| Mantenimientos | 5 | 0 | 0 | 5 |
| Bajas | 6 | 0 | 0 | 6 |
| Inventario físico | 11 | 0 | 0 | 11 |
| Bitácora | 5 | 0 | 0 | 5 |
| Dashboard | 10 | 0 | 0 | 10 |
| Reportes | 7 | 0 | 0 | 7 |
| Permisos | 4 | 0 | 0 | 4 |
| **Total** | **82** | **0** | **0** | **82** |

## Los tres problemas más graves

1. **`SLCDM.Api` no compila** — coma faltante y tipos de rastreo ausentes en `DispositivosController`. Bloquea login, Swagger y todo el e2e real.
2. **No hay seed de usuarios de los 4 perfiles en el repo** — aunque compile, hay que confirmar o crear `mbarrios` / `cmorales` / `ahernandez` / `jlopez` en la base. No se crearon (el alta vive detrás del API).
3. **Huecos de contrato ya conocidos que no se pudieron revalidar** — `GET .../esperados` inexistente, `GET /api/MotivosBaja` y `TiposMantenimiento` mock, `ProveedorDto.Corre`, `GET /api/Reportes/activos` sin total.

## Issues

Pendiente de número de GitHub (se anota en el commit de enlace). Un issue por este bloqueo; no se abren 82 issues iguales.
