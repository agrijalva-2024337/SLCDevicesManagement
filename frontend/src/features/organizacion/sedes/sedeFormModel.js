import {
  asOptions,
  requireSelect,
  validarNombreEntidad,
  validarTextoLibre,
} from '@/shared/components/recordFormUtils';

export function emptySedeForm() {
  return {
    idEmpresa: '',
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

export function sedeFields({ empresas = [], paises = [] } = {}) {
  return [
    { name: 'idEmpresa', label: 'Empresa', type: 'select', required: true, options: asOptions(empresas) },
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

export function paisesDeEmpresa(paises, idEmpresa) {
  if (idEmpresa == null || idEmpresa === '') {
    return [];
  }

  const wanted = Number(idEmpresa);
  return (paises ?? []).filter((pais) => Number(pais.idEmpresa) === wanted);
}

export function validateSedeForm(values, paises = []) {
  const errors = {
    idEmpresa: requireSelect(values.idEmpresa, 'una empresa'),
    idPais: requireSelect(values.idPais, 'un país'),
    nombre: validarNombreEntidad(values.nombre, 'nombre', 100, { required: true }),
    direccion: validarTextoLibre(values.direccion, 'dirección', 100, { required: false }),
    ciudad: validarNombreEntidad(values.ciudad, 'ciudad', 100, { required: false }),
  };

  if (!errors.idPais && values.idEmpresa) {
    const pais = (paises ?? []).find((item) => Number(item.id) === Number(values.idPais));
    if (!pais || Number(pais.idEmpresa) !== Number(values.idEmpresa)) {
      errors.idPais = 'El país debe pertenecer a la misma empresa de la sede.';
    }
  }

  return errors;
}

export function sedeToPayload(values) {
  return {
    idEmpresa: Number(values.idEmpresa),
    idPais: Number(values.idPais),
    nombre: values.nombre.trim(),
    direccion: values.direccion.trim() || null,
    ciudad: values.ciudad.trim() || null,
    habilitado: Boolean(values.habilitado),
  };
}
