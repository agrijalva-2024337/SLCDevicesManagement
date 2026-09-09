# Validaciones vs datos existentes (FE-19)

Script: `node --import ./scripts/register-alias.mjs ./scripts/check-validaciones-datos.mjs`

Fecha: 2026-09-09. Fuente principal: mocks en `frontend/src/features/*/mocks/`.

## Resultado (mocks)

| Entidad | Registros revisados (aprox.) | Violaciones |
| --- | ---: | ---: |
| Empresa | 10 | 0 |
| Sede | (mocks) | 0 |
| Área | (mocks) | 0 |
| Categoría | (mocks) | 0 |
| Estado | (mocks) | 0 |
| Tipo de asignación | (mocks) | 0 |
| Proveedor | 10 | 0 |
| Ubicación | 10 | 0 (tras aflojar patrón) |
| País | 10 | 0 |
| Activo | 5 | 0 |
| Usuario | sesión demo | 0 |
| Responsable | 4 | 0 |
| Histórico inventario | 2 | 0 |

**Total final: 0 violaciones** en mocks.

## API real

El backend en `http://localhost:5139` no estaba disponible al correr el script (sin JWT de auditoría). Con `VITE_USE_API_MOCK=false` y API arriba, conviene re-ejecutar el script o ampliarlo con un token de lectura para cada catálogo.

## Patrón aflojado por datos legítimos

| Patrón | Motivo | Antes rechazaba | Decisión |
| --- | --- | --- | --- |
| `NOMBRE_ENTIDAD` | Las ubicaciones mock usan raya tipográfica como separador (`CD Zona 12 — andén 1`). Es texto legítimo de negocio, no basura. | Em dash `—` y en dash `–` | Se agregaron `—` y `–` al alfabeto del patrón. |

No se aflojó ningún otro patrón. No hubo casos de “basura” listados para limpieza.

## Notas

- Teléfonos mock (`2294-1500`) se interpretan como número nacional guatemalteco (8 dígitos).
- NIT mock con verificador numérico (`1234567-8`) pasa `NIT_GT`.
- `DEMO_PASSWORD` de login (`Practica2026`) **no** se valida con `PASSWORD_COMPOSICION`: es clave de demo de sesión, no un valor de formulario de usuario.
