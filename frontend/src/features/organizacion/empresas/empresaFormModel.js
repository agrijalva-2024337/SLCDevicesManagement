import { optionalText, requireText } from '@/shared/components/recordFormUtils';

export function emptyEmpresaForm() {
  return {
    nombre: '',
    nitCodigo: '',
    direccion: '',
    telefono: '',
    habilitado: true,
  };
}

export function empresaToForm(empresa) {
  return {
    nombre: empresa.nombre ?? '',
    nitCodigo: empresa.nitCodigo ?? '',
    direccion: empresa.direccion ?? '',
    telefono: empresa.telefono ?? '',
    habilitado: Boolean(empresa.habilitado),
  };
}

export function empresaFields() {
  return [
    { name: 'nombre', label: 'Nombre', required: true, maxLength: 150, wide: true },
    { name: 'nitCodigo', label: 'NIT / código', required: true, maxLength: 50 },
    { name: 'direccion', label: 'Dirección', maxLength: 150, wide: true },
    { name: 'telefono', label: 'Teléfono', maxLength: 30, autoComplete: 'tel' },
    {
      name: 'habilitado',
      type: 'switch',
      label: 'Registro habilitado',
      hint: 'Si se desactiva, el registro queda fuera de operación sin borrarse.',
    },
  ];
}

export function validateEmpresaForm(values, empresas = [], currentId) {
  const errors = {
    nombre: requireText(values.nombre, 'nombre', 150),
    nitCodigo: requireText(values.nitCodigo, 'NIT', 50),
    direccion: optionalText(values.direccion, 'dirección', 150),
    telefono: optionalText(values.telefono, 'teléfono', 30),
  };
  const nit = String(values.nitCodigo ?? '')
    .trim()
    .toLowerCase();
  if (
    nit &&
    empresas.some(
      (item) => String(item.nitCodigo).toLowerCase() === nit && String(item.id) !== String(currentId),
    )
  ) {
    errors.nitCodigo = 'Ya existe una empresa registrada con este NIT.';
  }
  return errors;
}

export function empresaToPayload(values) {
  return {
    nombre: values.nombre.trim(),
    nitCodigo: values.nitCodigo.trim(),
    direccion: values.direccion.trim() || null,
    telefono: values.telefono.trim() || null,
    habilitado: Boolean(values.habilitado),
  };
}
