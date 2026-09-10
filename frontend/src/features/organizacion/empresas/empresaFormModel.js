import {
  phoneField,
  normalizeNombreEntidad,
  validarIdentificacionTributaria,
  validarNombreEntidad,
  validarTextoLibre,
} from '@/shared/components/recordFormUtils';
import { phoneFormFields, phonePayload, validatePhoneFields } from '@/shared/utils/phoneNumber';

const IDENTIFICACION_HINT = 'NIT, RUC, RFC o equivalente según el país (5 a 20 caracteres)';

export function emptyEmpresaForm(paises = []) {
  return {
    nombre: '',
    nitCodigo: '',
    direccion: '',
    ...phoneFormFields('', paises),
    habilitado: true,
  };
}

export function empresaToForm(empresa, paises = []) {
  return {
    nombre: empresa.nombre ?? '',
    nitCodigo: empresa.nitCodigo ?? '',
    direccion: empresa.direccion ?? '',
    ...phoneFormFields(empresa.telefono, paises),
    habilitado: Boolean(empresa.habilitado),
  };
}

export function empresaFields(paises = []) {
  return [
    { name: 'nombre', label: 'Nombre', required: true, maxLength: 100, wide: true },
    {
      name: 'nitCodigo',
      label: 'Identificación tributaria',
      required: true,
      maxLength: 20,
      hint: IDENTIFICACION_HINT,
    },
    { name: 'direccion', label: 'Dirección', maxLength: 150, wide: true },
    phoneField({ paises }),
    {
      name: 'habilitado',
      type: 'switch',
      label: 'Registro habilitado',
      hint: 'Si se desactiva, el registro queda fuera de operación sin borrarse.',
    },
  ];
}

export function validateEmpresaForm(values, empresas = [], currentId, { paises } = {}) {
  const errors = {
    nombre: validarNombreEntidad(values.nombre, 'nombre', 100, { required: true }),
    nitCodigo: validarIdentificacionTributaria(values.nitCodigo, 'identificación tributaria', 20, {
      required: true,
    }),
    direccion: validarTextoLibre(values.direccion, 'dirección', 150, { required: false }),
    telefono: validatePhoneFields(values, { paises }),
  };
  const nit = String(values.nitCodigo ?? '')
    .trim()
    .toUpperCase();
  if (
    nit &&
    !errors.nitCodigo &&
    empresas.some(
      (item) => String(item.nitCodigo).trim().toUpperCase() === nit && String(item.id) !== String(currentId),
    )
  ) {
    errors.nitCodigo = 'Ya existe una empresa registrada con esta identificación tributaria.';
  }
  return errors;
}

export function empresaToPayload(values) {
  return {
    nombre: normalizeNombreEntidad(values.nombre),
    nitCodigo: String(values.nitCodigo ?? '')
      .trim()
      .toUpperCase(),
    direccion: values.direccion.trim() || null,
    telefono: phonePayload(values),
    habilitado: Boolean(values.habilitado),
  };
}
