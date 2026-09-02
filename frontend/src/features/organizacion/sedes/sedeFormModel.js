import { asOptions, optionalText, requireSelect, requireText } from '@/shared/components/recordFormUtils';

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

export function validateSedeForm(values) {
  return {
    idEmpresa: requireSelect(values.idEmpresa, 'una empresa'),
    idPais: requireSelect(values.idPais, 'un país'),
    nombre: requireText(values.nombre, 'nombre', 100),
    direccion: optionalText(values.direccion, 'dirección', 100),
    ciudad: optionalText(values.ciudad, 'ciudad', 100),
  };
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
