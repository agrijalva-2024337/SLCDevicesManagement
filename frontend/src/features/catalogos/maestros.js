import * as categoriaService from '@/features/catalogos/categorias/categoriaService';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as proveedorService from '@/features/catalogos/proveedores/proveedorService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import * as areaService from '@/features/organizacion/areas/areaService';
import { asOptions, optionalText, requireSelect, requireText } from '@/shared/components/recordFormUtils';

function switchField() {
  return {
    name: 'habilitado',
    type: 'switch',
    label: 'Registro habilitado',
    hint: 'Si se desactiva, el registro queda fuera de operación sin borrarse.',
  };
}

export function nameById(list) {
  return Object.fromEntries((list ?? []).map((item) => [item.id, item.nombre]));
}

export const maestros = {
  areas: {
    service: areaService,
    title: 'Áreas',
    singular: 'área',
    kicker: 'Área',
    registerLabel: 'Registrar área',
    hint: 'El área pertenece a una sede. El nombre es obligatorio.',
    description: 'Unidades internas de cada sede.',
    titleOf: (item) => item.nombre,
    facts: (item, lookups = {}) =>
      [lookups.sedeNombres?.[item.idSede], item.descripcion].filter(Boolean),
    listView: {
      emptyTitle: 'No hay áreas',
      emptyDescription: 'Registre la primera área para asignarla a una sede.',
      columns: (lookups = {}) => [
        { key: 'nombre', header: 'Nombre', primary: true },
        {
          key: 'sede',
          header: 'Sede',
          getValue: (item) => lookups.sedeNombres?.[item.idSede] ?? '—',
        },
        // [API] AreaDto no expone responsable; la columna se agrega cuando exista el campo.
        { key: 'habilitado', header: 'Estado', type: 'status' },
      ],
    },
    empty: () => ({ idSede: '', nombre: '', descripcion: '', habilitado: true }),
    toForm: (item) => ({
      idSede: String(item.idSede ?? ''),
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      habilitado: Boolean(item.habilitado),
    }),
    fields: ({ sedes } = {}) => [
      { name: 'idSede', label: 'Sede', type: 'select', required: true, options: asOptions(sedes ?? []) },
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 100, wide: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 200 },
      switchField(),
    ],
    validate(values) {
      return {
        idSede: requireSelect(values.idSede, 'una sede'),
        nombre: requireText(values.nombre, 'nombre', 100),
        descripcion: optionalText(values.descripcion, 'descripción', 200),
      };
    },
    toPayload(values) {
      return {
        idSede: Number(values.idSede),
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim() || null,
        habilitado: Boolean(values.habilitado),
      };
    },
    detail: (item, lookups = {}) => [
      { label: 'Sede', value: lookups.sedeNombres?.[item.idSede] ?? '—' },
      { label: 'Descripción', value: item.descripcion },
    ],
  },
  categorias: {
    service: categoriaService,
    title: 'Categorías',
    singular: 'categoría',
    kicker: 'Categoría',
    registerLabel: 'Registrar categoría',
    hint: 'El nombre es obligatorio.',
    description: 'Clasificación de activos para inventario y reportes.',
    titleOf: (item) => item.nombre,
    facts: (item) => [item.descripcion].filter(Boolean),
    listView: {
      emptyTitle: 'No hay categorías',
      emptyDescription: 'Registre la primera categoría para clasificar activos.',
      columns: () => [
        { key: 'nombre', header: 'Nombre', primary: true },
        { key: 'descripcion', header: 'Descripción' },
        { key: 'habilitado', header: 'Estado', type: 'status' },
      ],
    },
    empty: () => ({ nombre: '', descripcion: '', habilitado: true }),
    toForm: (item) => ({
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      habilitado: Boolean(item.habilitado),
    }),
    fields: () => [
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 100, wide: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 200 },
      switchField(),
    ],
    validate(values) {
      return {
        nombre: requireText(values.nombre, 'nombre', 100),
        descripcion: optionalText(values.descripcion, 'descripción', 200),
      };
    },
    toPayload(values) {
      return {
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim() || null,
        habilitado: Boolean(values.habilitado),
      };
    },
    detail: (item) => [{ label: 'Descripción', value: item.descripcion }],
  },
  proveedores: {
    service: proveedorService,
    title: 'Proveedores',
    singular: 'proveedor',
    kicker: 'Proveedor',
    registerLabel: 'Registrar proveedor',
    hint: 'Nombre y NIT son obligatorios. El proveedor queda ligado a una empresa.',
    description: 'Casas comerciales ligadas a cada empresa.',
    titleOf: (item) => item.nombre,
    facts: (item, lookups = {}) =>
      [`NIT ${item.nit}`, lookups.empresaNombres?.[item.idEmpresa], item.nombreContacto].filter(Boolean),
    listView: {
      emptyTitle: 'No hay proveedores',
      emptyDescription: 'Registre el primer proveedor para usarlo en compras y mantenimiento.',
      columns: (lookups = {}) => [
        { key: 'nombre', header: 'Nombre', primary: true },
        { key: 'nit', header: 'NIT', numeric: true },
        {
          key: 'empresa',
          header: 'Empresa',
          getValue: (item) => lookups.empresaNombres?.[item.idEmpresa] ?? '—',
        },
        { key: 'nombreContacto', header: 'Contacto' },
        { key: 'telefono', header: 'Teléfono' },
        { key: 'habilitado', header: 'Estado', type: 'status' },
      ],
    },
    empty: () => ({
      idEmpresa: '',
      nombre: '',
      nit: '',
      nombreContacto: '',
      telefono: '',
      correo: '',
      habilitado: true,
    }),
    toForm: (item) => ({
      idEmpresa: String(item.idEmpresa ?? ''),
      nombre: item.nombre ?? '',
      nit: item.nit ?? '',
      nombreContacto: item.nombreContacto ?? '',
      telefono: item.telefono ?? '',
      correo: item.correo ?? '',
      habilitado: Boolean(item.habilitado),
    }),
    fields: ({ empresas } = {}) => [
      { name: 'idEmpresa', label: 'Empresa', type: 'select', required: true, options: asOptions(empresas ?? []) },
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 150 },
      { name: 'nit', label: 'NIT', required: true, maxLength: 50 },
      { name: 'nombreContacto', label: 'Contacto', maxLength: 100 },
      { name: 'telefono', label: 'Teléfono', maxLength: 30, autoComplete: 'tel' },
      { name: 'correo', label: 'Correo', maxLength: 150, autoComplete: 'email' },
      switchField(),
    ],
    validate(values, records = [], currentId) {
      const errors = {
        idEmpresa: requireSelect(values.idEmpresa, 'una empresa'),
        nombre: requireText(values.nombre, 'nombre', 150),
        nit: requireText(values.nit, 'NIT', 50),
        nombreContacto: optionalText(values.nombreContacto, 'contacto', 100),
        telefono: optionalText(values.telefono, 'teléfono', 30),
        correo: optionalText(values.correo, 'correo', 150),
      };
      const nit = String(values.nit ?? '')
        .trim()
        .toLowerCase();
      if (
        nit &&
        records.some((item) => String(item.nit).toLowerCase() === nit && String(item.id) !== String(currentId))
      ) {
        errors.nit = 'Ya existe un proveedor registrado con este NIT.';
      }
      return errors;
    },
    toPayload(values) {
      return {
        idEmpresa: Number(values.idEmpresa),
        nombre: values.nombre.trim(),
        nit: values.nit.trim(),
        nombreContacto: values.nombreContacto.trim() || null,
        telefono: values.telefono.trim() || null,
        correo: values.correo.trim() || null,
        habilitado: Boolean(values.habilitado),
      };
    },
    detail: (item, lookups = {}) => [
      { label: 'Empresa', value: lookups.empresaNombres?.[item.idEmpresa] ?? '—' },
      { label: 'NIT', value: item.nit },
      { label: 'Contacto', value: item.nombreContacto },
      { label: 'Teléfono', value: item.telefono },
      { label: 'Correo', value: item.correo },
    ],
  },
  ubicaciones: {
    service: ubicacionService,
    title: 'Ubicaciones',
    singular: 'ubicación',
    kicker: 'Ubicación',
    registerLabel: 'Registrar ubicación',
    hint: 'El nombre y la sede son obligatorios. Latitud y longitud son opcionales; si las deja vacías, el mapa intenta ubicar por el nombre y la descripción.',
    description: 'Sitios físicos donde descansa un activo: rack, escritorio o bodega.',
    titleOf: (item) => item.nombre,
    facts: (item, lookups = {}) =>
      [
        lookups.sedeNombres?.[item.idSede],
        item.descripcion,
        item.latitud != null && item.longitud != null ? `${item.latitud}, ${item.longitud}` : null,
      ].filter(Boolean),
    empty: () => ({ idSede: '', nombre: '', descripcion: '', latitud: '', longitud: '', habilitado: true }),
    toForm: (item) => ({
      idSede: String(item.idSede ?? ''),
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      latitud: item.latitud == null || item.latitud === '' ? '' : String(item.latitud),
      longitud: item.longitud == null || item.longitud === '' ? '' : String(item.longitud),
      habilitado: Boolean(item.habilitado),
    }),
    fields: ({ sedes } = {}) => [
      { name: 'idSede', label: 'Sede', type: 'select', required: true, options: asOptions(sedes ?? []) },
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 100, wide: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 200 },
      {
        name: 'latitud',
        label: 'Latitud',
        type: 'number',
        step: 'any',
        hint: 'Opcional. Si la deja vacía, el mapa usa el nombre y la descripción.',
      },
      {
        name: 'longitud',
        label: 'Longitud',
        type: 'number',
        step: 'any',
        hint: 'Opcional. Si pone una coordenada, ponga las dos.',
      },
      switchField(),
    ],
    validate(values) {
      const errors = {
        idSede: requireSelect(values.idSede, 'una sede'),
        nombre: requireText(values.nombre, 'nombre', 100),
        descripcion: optionalText(values.descripcion, 'descripción', 200),
      };
      const latEmpty = String(values.latitud ?? '').trim() === '';
      const lngEmpty = String(values.longitud ?? '').trim() === '';
      if (!latEmpty || !lngEmpty) {
        if (latEmpty) {
          errors.latitud = 'Si pone longitud, también indique la latitud.';
        } else {
          const lat = Number(values.latitud);
          if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
            errors.latitud = 'La latitud debe estar entre -90 y 90.';
          }
        }
        if (lngEmpty) {
          errors.longitud = 'Si pone latitud, también indique la longitud.';
        } else {
          const lng = Number(values.longitud);
          if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
            errors.longitud = 'La longitud debe estar entre -180 y 180.';
          }
        }
      }
      return errors;
    },
    toPayload(values) {
      const latEmpty = String(values.latitud ?? '').trim() === '';
      const lngEmpty = String(values.longitud ?? '').trim() === '';
      return {
        idSede: Number(values.idSede),
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim() || null,
        latitud: latEmpty ? null : Number(values.latitud),
        longitud: lngEmpty ? null : Number(values.longitud),
        habilitado: Boolean(values.habilitado),
      };
    },
    detail: (item, lookups = {}) => [
      { label: 'Sede', value: lookups.sedeNombres?.[item.idSede] ?? '—' },
      { label: 'Descripción', value: item.descripcion },
      { label: 'Latitud', value: item.latitud == null ? '—' : String(item.latitud) },
      { label: 'Longitud', value: item.longitud == null ? '—' : String(item.longitud) },
    ],
  },
  paises: {
    service: paisService,
    // [API] PaisDto no tiene habilitado; no hay switch ni soft-delete en este catálogo.
    hasHabilitado: false,
    title: 'Países',
    singular: 'país',
    kicker: 'País',
    registerLabel: 'Registrar país',
    hint: 'Nombre e ISO son obligatorios.',
    description: 'Catálogo geográfico que alimenta el registro de sedes.',
    titleOf: (item) => item.nombre,
    facts: (item) => [`${item.codigoIso2} · ${item.codigoIso3}`, item.codigoTelefonico].filter(Boolean),
    empty: () => ({ nombre: '', codigoIso2: '', codigoIso3: '', codigoTelefonico: '' }),
    toForm: (item) => ({
      nombre: item.nombre ?? '',
      codigoIso2: item.codigoIso2 ?? '',
      codigoIso3: item.codigoIso3 ?? '',
      codigoTelefonico: item.codigoTelefonico ?? '',
    }),
    fields: () => [
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 100, wide: true },
      { name: 'codigoIso2', label: 'ISO 2', required: true, maxLength: 2 },
      { name: 'codigoIso3', label: 'ISO 3', required: true, maxLength: 3 },
      { name: 'codigoTelefonico', label: 'Código telefónico', maxLength: 5 },
    ],
    validate(values) {
      const iso2 = requireText(values.codigoIso2, 'ISO 2', 2);
      const iso3 = requireText(values.codigoIso3, 'ISO 3', 3);
      return {
        nombre: requireText(values.nombre, 'nombre', 100),
        codigoIso2: iso2 ?? (values.codigoIso2.trim().length !== 2 ? 'ISO 2 debe tener 2 caracteres.' : null),
        codigoIso3: iso3 ?? (values.codigoIso3.trim().length !== 3 ? 'ISO 3 debe tener 3 caracteres.' : null),
        codigoTelefonico: optionalText(values.codigoTelefonico, 'código telefónico', 5),
      };
    },
    toPayload(values) {
      return {
        nombre: values.nombre.trim(),
        codigoIso2: values.codigoIso2.trim().toUpperCase(),
        codigoIso3: values.codigoIso3.trim().toUpperCase(),
        codigoTelefonico: values.codigoTelefonico.trim() || null,
      };
    },
    detail: (item) => [
      { label: 'ISO 2', value: item.codigoIso2 },
      { label: 'ISO 3', value: item.codigoIso3 },
      { label: 'Código telefónico', value: item.codigoTelefonico },
    ],
  },
};

export function getMaestro(slug) {
  return maestros[slug] ?? null;
}
