/**
 * Verifica patrones FE-19 contra mocks (y API si está disponible).
 * Uso: node --import ./scripts/register-alias.mjs ./scripts/check-validaciones-datos.mjs
 */
import { empresas } from '@/features/organizacion/mocks/empresas.js';
import { sedes } from '@/features/organizacion/mocks/sedes.js';
import { areas } from '@/features/organizacion/mocks/areas.js';
import { estados } from '@/features/organizacion/mocks/estados.js';
import { tiposAsignacion } from '@/features/organizacion/mocks/tiposAsignacion.js';
import { responsables } from '@/features/organizacion/mocks/responsables.js';
import { usuariosSesion } from '@/features/auth/mocks/usuariosSesion.js';
import { paises } from '@/features/catalogos/mocks/paises.js';
import { categorias } from '@/features/catalogos/mocks/categorias.js';
import { proveedores } from '@/features/catalogos/mocks/proveedores.js';
import { ubicaciones } from '@/features/catalogos/mocks/ubicaciones.js';
import { activos } from '@/features/activos/mocks/activos.js';
import { historicosInventario } from '@/features/inventario/mocks/historicosInventario.js';
import { buscarPorCodigoTelefonico, buscarPorIso2 } from '@/shared/validation/paisesIso.js';
import {
  validarAlfanumerico,
  validarCodigoTelefonico,
  validarCorreo,
  validarCosto,
  validarIdentificacionTributaria,
  validarIso2,
  validarIso3,
  validarMarcaModelo,
  validarMoneda,
  validarNombreEntidad,
  validarNombrePersona,
  validarTelefono,
  validarTextoLibre,
  validarUsername,
} from '@/shared/validation/validators.js';

const report = [];

function check(entity, id, field, value, error) {
  if (!error) return;
  report.push({ entity, id, field, value, error });
}

function phoneNational(stored) {
  const raw = String(stored ?? '').trim();
  if (!raw) return { numero: '', pais: null };
  const fromDial = buscarPorCodigoTelefonico(raw.split(/\s+/)[0]);
  if (fromDial && raw.startsWith(fromDial.codigoTelefonico)) {
    return {
      numero: raw.slice(fromDial.codigoTelefonico.length).trim(),
      pais: fromDial,
    };
  }
  // Mocks locales suelen guardar solo el número nacional GT.
  return { numero: raw, pais: buscarPorIso2('gt') };
}

for (const row of empresas) {
  check('Empresa', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 150));
  check(
    'Empresa',
    row.id,
    'nitCodigo',
    row.nitCodigo,
    validarIdentificacionTributaria(row.nitCodigo, 'identificación tributaria', 50, { iso2: 'gt' }),
  );
  check('Empresa', row.id, 'direccion', row.direccion, validarTextoLibre(row.direccion, 'dirección', 150));
  const phone = phoneNational(row.telefono);
  check('Empresa', row.id, 'telefono', row.telefono, validarTelefono(phone.numero, { pais: phone.pais }));
}

for (const row of sedes) {
  check('Sede', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 100));
  check('Sede', row.id, 'direccion', row.direccion, validarTextoLibre(row.direccion, 'dirección', 100));
  check('Sede', row.id, 'ciudad', row.ciudad, validarNombreEntidad(row.ciudad, 'ciudad', 100, { required: false }));
}

for (const row of areas) {
  check('Area', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 100));
  check(
    'Area',
    row.id,
    'descripcion',
    row.descripcion,
    validarTextoLibre(row.descripcion, 'descripción', 200),
  );
}

for (const row of categorias) {
  check('Categoria', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 100));
  check(
    'Categoria',
    row.id,
    'descripcion',
    row.descripcion,
    validarTextoLibre(row.descripcion, 'descripción', 200),
  );
}

for (const row of estados) {
  check('Estado', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 50));
  check(
    'Estado',
    row.id,
    'descripcion',
    row.descripcion,
    validarTextoLibre(row.descripcion, 'descripción', 150),
  );
}

for (const row of tiposAsignacion) {
  check('TipoAsignacion', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 50));
  check(
    'TipoAsignacion',
    row.id,
    'descripcion',
    row.descripcion,
    validarTextoLibre(row.descripcion, 'descripción', 150),
  );
}

for (const row of proveedores) {
  check('Proveedor', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 150));
  check(
    'Proveedor',
    row.id,
    'nit',
    row.nit,
    validarIdentificacionTributaria(row.nit, 'identificación tributaria', 50, { iso2: 'gt' }),
  );
  check(
    'Proveedor',
    row.id,
    'nombreContacto',
    row.nombreContacto,
    validarNombrePersona(row.nombreContacto, 'contacto', 100, { required: false }),
  );
  check('Proveedor', row.id, 'correo', row.correo, validarCorreo(row.correo, 'correo', 150));
  const phone = phoneNational(row.telefono);
  check('Proveedor', row.id, 'telefono', row.telefono, validarTelefono(phone.numero, { pais: phone.pais }));
}

for (const row of ubicaciones) {
  check('Ubicacion', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 100));
  check(
    'Ubicacion',
    row.id,
    'descripcion',
    row.descripcion,
    validarTextoLibre(row.descripcion, 'descripción', 200),
  );
}

for (const row of paises) {
  check('Pais', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 100));
  check('Pais', row.id, 'codigoIso2', row.codigoIso2, validarIso2(row.codigoIso2));
  check('Pais', row.id, 'codigoIso3', row.codigoIso3, validarIso3(row.codigoIso3));
  check(
    'Pais',
    row.id,
    'codigoTelefonico',
    row.codigoTelefonico,
    validarCodigoTelefonico(row.codigoTelefonico),
  );
}

for (const row of activos) {
  check('Activo', row.id, 'nombre', row.nombre, validarNombreEntidad(row.nombre, 'nombre', 150));
  check('Activo', row.id, 'marca', row.marca, validarMarcaModelo(row.marca, 'marca', 100, { required: false }));
  check('Activo', row.id, 'modelo', row.modelo, validarMarcaModelo(row.modelo, 'modelo', 100, { required: false }));
  check(
    'Activo',
    row.id,
    'numeroSerie',
    row.numeroSerie,
    validarAlfanumerico(row.numeroSerie, 'número de serie', 100, { required: false }),
  );
  check(
    'Activo',
    row.id,
    'numeroFactura',
    row.numeroFactura,
    validarAlfanumerico(row.numeroFactura, 'número de factura', 50, { required: false }),
  );
  check('Activo', row.id, 'costoAdquisicion', row.costoAdquisicion, validarCosto(row.costoAdquisicion));
  check('Activo', row.id, 'moneda', row.moneda, validarMoneda(row.moneda));
  check('Activo', row.id, 'descripcion', row.descripcion, validarTextoLibre(row.descripcion, 'descripción', 300));
  check(
    'Activo',
    row.id,
    'observaciones',
    row.observaciones,
    validarTextoLibre(row.observaciones, 'observaciones', 500),
  );
}

for (const row of usuariosSesion) {
  check('Usuario', row.id, 'nombres', row.nombres, validarNombrePersona(row.nombres, 'nombres', 100));
  check('Usuario', row.id, 'apellidos', row.apellidos, validarNombrePersona(row.apellidos, 'apellidos', 100));
  check('Usuario', row.id, 'correo', row.correo, validarCorreo(row.correo, 'correo', 150, { required: true }));
  check('Usuario', row.id, 'username', row.username, validarUsername(row.username, 'usuario', 50));
}

for (const row of responsables) {
  check(
    'Responsable',
    row.id,
    'nombreCompleto',
    row.nombreCompleto,
    validarNombrePersona(row.nombreCompleto, 'nombre completo', 150),
  );
  check('Responsable', row.id, 'cargo', row.cargo, validarNombrePersona(row.cargo, 'cargo', 100, { required: false }));
  check('Responsable', row.id, 'correo', row.correo, validarCorreo(row.correo, 'correo', 150));
  const phone = phoneNational(row.telefono);
  check('Responsable', row.id, 'telefono', row.telefono, validarTelefono(phone.numero, { pais: phone.pais }));
}

for (const row of historicosInventario) {
  check(
    'HistoricoInventario',
    row.id,
    'responsable',
    row.responsable,
    validarNombrePersona(row.responsable, 'responsable', 150, { required: false }),
  );
  check(
    'HistoricoInventario',
    row.id,
    'observaciones',
    row.observaciones,
    validarTextoLibre(row.observaciones, 'observaciones', 300),
  );
}

const byEntity = new Map();
for (const row of report) {
  const list = byEntity.get(row.entity) ?? [];
  list.push(row);
  byEntity.set(row.entity, list);
}

console.log(JSON.stringify({ totalViolations: report.length, byEntity: Object.fromEntries(byEntity) }, null, 2));

const apiBase = process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:5139';
const useMock = process.env.VITE_USE_API_MOCK === 'true';

if (!useMock) {
  try {
    const health = await fetch(`${apiBase}/api/health`).catch(() => null);
    if (!health?.ok) {
      console.error(
        `\n[API] No se pudo consultar ${apiBase}. Solo se reportaron mocks. Arranque el backend con VITE_USE_API_MOCK=false para auditar datos reales.`,
      );
    } else {
      console.error(`\n[API] Backend responde en ${apiBase}, pero este script no autentica JWT; audite catálogos manualmente o extienda el script con un token.`);
    }
  } catch {
    console.error(`\n[API] Sin acceso a ${apiBase}.`);
  }
}

process.exitCode = 0;
