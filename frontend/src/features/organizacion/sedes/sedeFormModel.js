import {
  asOptions,
  requireSelect,
  normalizeNombreEntidad,
  validarNombreEntidad,
  validarTextoLibre,
} from '@/shared/components/recordFormUtils';

export function emptySedeForm(idEmpresa = '') {
  return {
    idEmpresa: idEmpresa == null || idEmpresa === '' ? '' : String(idEmpresa),
    idPais: '',
    nombre: '',
    direccion: '',
    ciudad: '',
    habilitado: true,
  };
}

export function sedeToForm(sede) {
  return {
    idEmpresa: String(sede.idEmpresa ?? ''),
    idPais: String(sede.idPais ?? ''),
    nombre: sede.nombre ?? '',
    direccion: sede.direccion ?? '',
    ciudad: sede.ciudad ?? '',
    habilitado: Boolean(sede.habilitado),
  };
}

export function sedeFields({ empresas = [], paises = [], lockEmpresa = false } = {}) {
  return [
    {
      name: 'idEmpresa',
      label: 'Empresa',
      type: 'select',
      required: true,
      options: asOptions(empresas),
      readOnly: lockEmpresa,
      hint: lockEmpresa ? 'Se toma de la empresa de su sesión.' : undefined,
    },
    { name: 'idPais', label: 'País', type: 'select', required: true, options: asOptions(paises) },
    { name: 'nombre', label: 'Nombre', required: true, maxLength: 100, wide: true },
    { name: 'ciudad', label: 'Ciudad', maxLength: 100 },
    { name: 'direccion', label: 'Dirección', maxLength: 100 },
    {
      name: 'habilitado',
      type: 'switch',
      label: 'Registro habilitado',
      hint: 'Si se desactiva, la sede queda fuera de operación sin borrarse.',
    },
  ];
}

export function paisesDeEmpresa(paises, _idEmpresa) {
  // Pais es catálogo global: todas las sedes ven el mismo listado.
  return paises ?? [];
}

function duplicateNombre(records, nombre, currentId) {
  const needle = String(nombre ?? '')
    .trim()
    .toLowerCase();
  if (!needle) return false;
  return (records ?? []).some(
    (item) => String(item.nombre).trim().toLowerCase() === needle && String(item.id) !== String(currentId),
  );
}

export function validateSedeForm(values, paises = [], records = [], currentId) {
  const errors = {
    idEmpresa: requireSelect(values.idEmpresa, 'una empresa'),
    idPais: requireSelect(values.idPais, 'un país'),
    nombre: validarNombreEntidad(values.nombre, 'nombre', 100, { required: true }),
    direccion: validarTextoLibre(values.direccion, 'dirección', 100, { required: false }),
    ciudad: validarNombreEntidad(values.ciudad, 'ciudad', 100, { required: false }),
  };

  if (!errors.idPais) {
    const pais = (paises ?? []).find((item) => Number(item.id) === Number(values.idPais));
    if (!pais) {
      errors.idPais = 'El campo id pais no corresponde a un registro existente.';
    }
  }

  const mismaEmpresa = (records ?? []).filter(
    (item) => String(item.idEmpresa ?? '') === String(values.idEmpresa ?? ''),
  );
  if (!errors.nombre && duplicateNombre(mismaEmpresa, values.nombre, currentId)) {
    errors.nombre = 'Ya existe una sede con el mismo nombre en esta empresa.';
  }

  return errors;
}

export function sedeToPayload(values) {
  return {
    idEmpresa: Number(values.idEmpresa),
    idPais: Number(values.idPais),
    nombre: normalizeNombreEntidad(values.nombre),
    direccion: values.direccion.trim() || null,
    ciudad: normalizeNombreEntidad(values.ciudad) || null,
    habilitado: Boolean(values.habilitado),
  };
}
