# Patrones de validación (FE-19) — referencia para FluentValidation

Fuente canónica en frontend: `frontend/src/shared/validation/patterns.js`.
Copiá los literales a `RuleFor(...).Matches(...)` en `SLCDM.Application`. Hoy la API solo aplica `NotEmpty` / `MaximumLength` (salvo BSSID).

## Tabla por campo

| Entidad | Campo | Máx | Patrón | Acepta | Rechaza | Válido | Inválido |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Empresa / Sede / Área / Ubicación / Proveedor / Categoría / Estado / TipoAsignación / Activo / País | `nombre` (y ciudad de sede) | según entidad | `NOMBRE_ENTIDAD` | Letras con acentos, números, espacios, `. , - — – & ' ( ) /` | `# $ % < >` y espacios extremos | `Sistemas Logísticos y Corporativos, S.A.` | `Bodega #2` |
| Usuario / Responsable / Proveedor.contacto / Jornada.responsable | nombres de persona / cargo | 100–150 | `NOMBRE_PERSONA` | Letras, espacios, guion, apóstrofo | Números y otros signos | `José Luis O'Neill-Pérez` | `Juan 3` |
| Varios | descripciones / direcciones / observaciones | 150–500 | `TEXTO_LIBRE` | Texto amplio con saltos de línea | `< > { } \ \| \` ~ ^` | `Equipo en buen estado.` | `texto <script>` |
| Activo | `numeroSerie`, `numeroFactura` | 100 / 50 | `ALFANUMERICO` | Letras, números, guion | Espacios | `SN-ABC123` | `SN ABC` |
| Usuario | `username` | 50 | `USERNAME` | Minúsculas, dígitos, `. _ -`; empieza con letra; 3–50 | Mayúsculas, acentos, espacios | `j.perez_01` | `José` |
| Usuario / Proveedor / Responsable | `correo` | 150 | `CORREO` | gTLD nuevos, ccTLD de dos niveles, subdominios, `+` local | Dominio sin TLD | `gerencia@empresa.com.gt` | `a@b` |
| Usuario | `password` | 8–128 | `PASSWORD_ALFABETO` + `PASSWORD_COMPOSICION` | Letras, dígitos, `!@#$%&*?`; exige mayúscula+minúscula+dígito+símbolo | Espacios, acentos, otros símbolos | `Abcd234!` | `Abcd 234!` |
| Empresa / Proveedor | `nitCodigo` / `nit` | 50 | `IDENTIFICACION_TRIBUTARIA` o `NIT_GT` si ISO-2=`gt` | Letras/dígitos/guiones; GT: dígitos + verificador 0-9/K | Espacios; GT con letra distinta de K | `1234567-K` | `1234567-A` (GT) |
| Activo | `moneda` | 10 (patrón 3) | `MONEDA_ISO` | Tres letras mayúsculas | Minúsculas / largo ≠ 3 | `GTQ` | `gtq` |
| Activo | `costoAdquisicion` | decimal(12,2) | `COSTO_DECIMAL` | Hasta 10 enteros y 2 decimales con punto | Tres decimales | `1250.50` | `1250.505` |
| Activo | `marca` / `modelo` | 100 | `MARCA_MODELO` | Letras, números, espacios, guion, punto | `@ #` | `ThinkPad T14 Gen 3` | `HP@2530` |
| País | `codigoTelefonico` | 5 | `CODIGO_TELEFONICO` | `+` opcional y dígitos | Letras | `+502` | `+50A` |
| País | `codigoIso2` / `codigoIso3` | 2 / 3 | `ISO2` / `ISO3` | Letras exactas; se guardan en minúsculas | Largo incorrecto | `gt` / `gtm` | `g` / `gt` |
| Teléfono (varios) | `telefono` | 30 | (sin regex de país; rango vía `paisesIso.digitos` o E.164 7–15) | Solo dígitos nacionales tras normalizar | Letras; largo fuera de rango | GT: 8 dígitos | GT: 7 dígitos |

### Literales (copiar)

```
NOMBRE_ENTIDAD = ^(?! )(?!.* $)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,\-&'()/—–]+$
NOMBRE_PERSONA = ^(?! )(?!.* $)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\- ]+$
TEXTO_LIBRE = ^[^<>{}\\|`~^]*$
ALFANUMERICO = ^[A-Za-z0-9-]+$
USERNAME = ^[a-z][a-z0-9._-]{2,49}$
CORREO = ^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$
PASSWORD_ALFABETO = ^[A-Za-z0-9!@#$%&*?]+$
PASSWORD_COMPOSICION = ^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%&*?])[A-Za-z0-9!@#$%&*?]+$
IDENTIFICACION_TRIBUTARIA = ^[A-Za-z0-9-]+$
NIT_GT = ^[0-9]+-?[0-9K]$ (IgnoreCase)
MONEDA_ISO = ^[A-Z]{3}$
COSTO_DECIMAL = ^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$
MARCA_MODELO = ^(?! )(?!.* $)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .-]+$
CODIGO_TELEFONICO = ^\+?[0-9]{1,5}$
ISO2 = ^[A-Za-z]{2}$
ISO3 = ^[A-Za-z]{3}$
```

## Decisiones del Paso 0

1. **Contraseña.** Alfabeto amplio `[A-Za-z0-9!@#$%&*?]` (generador **más** caracteres ambiguos) con composición obligatoria y largo 8–128. El alfabeto estricto del `PasswordGenerator` (sin 0/O/1/l/I) queda documentado en comentario de `patterns.js` por si se quiere volver a transcripción manual.
2. **Identificación tributaria.** Etiqueta global; payload sigue `nitCodigo` / `nit`. Patrón general letras/dígitos/guiones; `NIT_GT` cuando el país (o prefijo telefónico) es Guatemala.
3. **Teléfono de Empresa.** Sin `IdPais` en el DTO: se valida con el prefijo elegido (tabla local) o, si no hay país conocido, E.164 7–15 dígitos.
4. **Países.** Catálogo mundial en `paisesIso.data.js` (~230 países, nombres en español) para autorrelleno y rangos de teléfono. No bloquea países fuera de lista: basta formato válido.

## Relajaciones posteriores a datos existentes

- `NOMBRE_ENTIDAD` admite rayas `—` / `–` porque las ubicaciones mock ya las usan (`docs/qa/validaciones-datos-existentes.md`).
