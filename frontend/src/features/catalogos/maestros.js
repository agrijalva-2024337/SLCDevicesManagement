import * as categoriaService from '@/features/catalogos/categorias/categoriaService';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as proveedorService from '@/features/catalogos/proveedores/proveedorService';
import { bssidFormatError, normalizeBssid } from '@/features/catalogos/redesConocidas/bssid';
import * as redConocidaService from '@/features/catalogos/redesConocidas/redConocidaService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import * as areaService from '@/features/organizacion/areas/areaService';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import * as usuarioService from '@/features/organizacion/usuarios/usuarioService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import { RolUsuario, rolUsuarioLabel } from '@/shared/api/contracts';
import { asOptions, optionalText, phoneField, requireSelect, requireText } from '@/shared/components/recordFormUtils';
import { phoneFormFields, phonePayload, validatePhoneFields } from '@/shared/utils/phoneNumber';

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

function requireEmail(value) {
  const required = requireText(value, 'correo', 150);
  if (required) return required;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
    return 'El formato del correo no es válido.';
  }
  return null;
}

function optionalEmail(value) {
  if (!String(value ?? '').trim()) return null;
  return requireEmail(value);
}

function duplicateNombre(records, nombre, currentId) {
  const needle = String(nombre ?? '')
    .trim()
    .toLowerCase();
  if (!needle) return false;
  return records.some(
    (item) => String(item.nombre).trim().toLowerCase() === needle && String(item.id) !== String(currentId),
  );
}

function usuarioNombre(item) {
  return [item?.nombres, item?.apellidos].filter(Boolean).join(' ') || item?.username || '—';
}

function rolOptions(rolActual) {
  return Object.entries(rolUsuarioLabel)
    .filter(
      ([value]) =>
        Number(value) !== RolUsuario.AdministradorGeneral || rolActual === RolUsuario.AdministradorGeneral,
    )
    .map(([value, label]) => ({ value, label }));
}

function nombreDescripcionMaestro({
  service,
  title,
  singular,
  newTitle,
  kicker,
  registerLabel,
  hint,
  description,
  emptyTitle,
  emptyDescription,
  scope = 'empresa',
}) {
  return {
    service,
    hasHabilitado: false,
    title,
    singular,
    newTitle,
    kicker,
    registerLabel,
    hint,
    description,
    scope,
    titleOf: (item) => item.nombre,
    facts: (item) => [item.descripcion].filter(Boolean),
    listView: {
      emptyTitle,
      emptyDescription,
      columns: () => [
        { key: 'nombre', header: 'Nombre', primary: true },
        { key: 'descripcion', header: 'Descripción' },
      ],
    },
    empty: () => ({ nombre: '', descripcion: '' }),
    toForm: (item) => ({
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
    }),
    fields: () => [
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 50, wide: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 150 },
    ],
    validate(values, records = [], currentId) {
      const errors = {
        nombre: requireText(values.nombre, 'nombre', 50),
        descripcion: optionalText(values.descripcion, 'descripción', 150),
      };
      if (!errors.nombre && duplicateNombre(records, values.nombre, currentId)) {
        errors.nombre = `Ya existe un ${singular} con el mismo nombre.`;
      }
      return errors;
    },
    toPayload(values) {
      return {
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim() || null,
      };
    },
    detail: (item) => [{ label: 'Descripción', value: item.descripcion }],
  };
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
    hint: 'El nombre es obligatorio. La categoría queda ligada a la empresa.',
    description: 'Clasificación de activos de cada empresa. Solo el administrador de empresa puede registrarlas.',
    titleOf: (item) => item.nombre,
    facts: (item) => [item.descripcion].filter(Boolean),
    listView: {
      emptyTitle: 'No hay categorías',
      emptyDescription: 'Registre la primera categoría de esta empresa para clasificar activos.',
      columns: (lookups = {}) => [
        { key: 'nombre', header: 'Nombre', primary: true },
        {
          key: 'empresa',
          header: 'Empresa',
          getValue: (item) => lookups.empresaNombres?.[item.idEmpresa] ?? '—',
        },
        { key: 'descripcion', header: 'Descripción' },
        { key: 'habilitado', header: 'Estado', type: 'status' },
      ],
    },
    empty: ({ idEmpresa, idEmpresaActiva } = {}) => ({
      idEmpresa: idEmpresaActiva == null || idEmpresaActiva === '' ? String(idEmpresa ?? '') : String(idEmpresaActiva),
      nombre: '',
      descripcion: '',
      habilitado: true,
    }),
    toForm: (item) => ({
      idEmpresa: item.idEmpresa == null ? '' : String(item.idEmpresa),
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      habilitado: Boolean(item.habilitado),
    }),
    fields: ({ empresas = [], rol, editing } = {}) => [
      ...(rol === RolUsuario.AdministradorGeneral && !editing
        ? [{ name: 'idEmpresa', label: 'Empresa', type: 'select', required: true, options: asOptions(empresas) }]
        : []),
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 100, wide: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 200 },
      switchField(),
    ],
    validate(values, _records, _id, { rol } = {}) {
      return {
        idEmpresa:
          rol === RolUsuario.AdministradorGeneral ? requireSelect(values.idEmpresa, 'una empresa') : null,
        nombre: requireText(values.nombre, 'nombre', 100),
        descripcion: optionalText(values.descripcion, 'descripción', 200),
      };
    },
    toPayload(values, { idEmpresaActiva } = {}) {
      const idEmpresa =
        values.idEmpresa === '' || values.idEmpresa == null
          ? idEmpresaActiva == null || idEmpresaActiva === ''
            ? null
            : Number(idEmpresaActiva)
          : Number(values.idEmpresa);
      return {
        idEmpresa,
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim() || null,
        habilitado: Boolean(values.habilitado),
      };
    },
    detail: (item, lookups = {}) => [
      { label: 'Empresa', value: lookups.empresaNombres?.[item.idEmpresa] ?? '—' },
      { label: 'Descripción', value: item.descripcion },
    ],
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
    empty: ({ paises } = {}) => ({
      idEmpresa: '',
      nombre: '',
      nit: '',
      nombreContacto: '',
      ...phoneFormFields('', paises),
      correo: '',
      habilitado: true,
    }),
    toForm: (item, { paises } = {}) => ({
      idEmpresa: String(item.idEmpresa ?? ''),
      nombre: item.nombre ?? '',
      nit: item.nit ?? '',
      nombreContacto: item.nombreContacto ?? '',
      ...phoneFormFields(item.telefono, paises),
      correo: item.correo ?? '',
      habilitado: Boolean(item.habilitado),
    }),
    fields: ({ empresas, paises } = {}) => [
      { name: 'idEmpresa', label: 'Empresa', type: 'select', required: true, options: asOptions(empresas ?? []) },
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 150 },
      { name: 'nit', label: 'NIT', required: true, maxLength: 50 },
      { name: 'nombreContacto', label: 'Contacto', maxLength: 100 },
      phoneField({ paises }),
      { name: 'correo', label: 'Correo', maxLength: 150, autoComplete: 'email' },
      switchField(),
    ],
    validate(values, records = [], currentId) {
      const errors = {
        idEmpresa: requireSelect(values.idEmpresa, 'una empresa'),
        nombre: requireText(values.nombre, 'nombre', 150),
        nit: requireText(values.nit, 'NIT', 50),
        nombreContacto: optionalText(values.nombreContacto, 'contacto', 100),
        telefono: validatePhoneFields(values),
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
        telefono: phonePayload(values),
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
    hint: 'El nombre y la sede son obligatorios. Si deja latitud y longitud vacías, se geocodifican desde la dirección y la ciudad de la sede.',
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
        hint: 'Opcional. Si la deja vacía, se usa la dirección de la sede.',
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
    hasHabilitado: false,
    title: 'Países',
    singular: 'país',
    kicker: 'País',
    registerLabel: 'Registrar país',
    hint: 'Nombre e ISO son obligatorios. El país queda ligado a la empresa.',
    description: 'Catálogo geográfico de cada empresa. Solo el administrador de empresa puede registrarlos.',
    titleOf: (item) => item.nombre,
    facts: (item) => [`${item.codigoIso2} · ${item.codigoIso3}`, item.codigoTelefonico].filter(Boolean),
    empty: ({ idEmpresa, idEmpresaActiva } = {}) => ({
      idEmpresa: idEmpresaActiva == null || idEmpresaActiva === '' ? String(idEmpresa ?? '') : String(idEmpresaActiva),
      nombre: '',
      codigoIso2: '',
      codigoIso3: '',
      codigoTelefonico: '',
    }),
    toForm: (item) => ({
      idEmpresa: item.idEmpresa == null ? '' : String(item.idEmpresa),
      nombre: item.nombre ?? '',
      codigoIso2: item.codigoIso2 ?? '',
      codigoIso3: item.codigoIso3 ?? '',
      codigoTelefonico: item.codigoTelefonico ?? '',
    }),
    fields: ({ empresas = [], rol, editing } = {}) => [
      ...(rol === RolUsuario.AdministradorGeneral && !editing
        ? [{ name: 'idEmpresa', label: 'Empresa', type: 'select', required: true, options: asOptions(empresas) }]
        : []),
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 100, wide: true },
      { name: 'codigoIso2', label: 'ISO 2', required: true, maxLength: 2 },
      { name: 'codigoIso3', label: 'ISO 3', required: true, maxLength: 3 },
      { name: 'codigoTelefonico', label: 'Código telefónico', maxLength: 5 },
    ],
    validate(values, _records, _id, { rol } = {}) {
      const iso2 = requireText(values.codigoIso2, 'ISO 2', 2);
      const iso3 = requireText(values.codigoIso3, 'ISO 3', 3);
      return {
        idEmpresa:
          rol === RolUsuario.AdministradorGeneral ? requireSelect(values.idEmpresa, 'una empresa') : null,
        nombre: requireText(values.nombre, 'nombre', 100),
        codigoIso2: iso2 ?? (values.codigoIso2.trim().length !== 2 ? 'ISO 2 debe tener 2 caracteres.' : null),
        codigoIso3: iso3 ?? (values.codigoIso3.trim().length !== 3 ? 'ISO 3 debe tener 3 caracteres.' : null),
        codigoTelefonico: optionalText(values.codigoTelefonico, 'código telefónico', 5),
      };
    },
    toPayload(values, { idEmpresaActiva } = {}) {
      const idEmpresa =
        values.idEmpresa === '' || values.idEmpresa == null
          ? idEmpresaActiva == null || idEmpresaActiva === ''
            ? null
            : Number(idEmpresaActiva)
          : Number(values.idEmpresa);
      return {
        idEmpresa,
        nombre: values.nombre.trim(),
        codigoIso2: values.codigoIso2.trim().toUpperCase(),
        codigoIso3: values.codigoIso3.trim().toUpperCase(),
        codigoTelefonico: values.codigoTelefonico.trim() || null,
      };
    },
    detail: (item, lookups = {}) => [
      { label: 'Empresa', value: lookups.empresaNombres?.[item.idEmpresa] ?? '—' },
      { label: 'ISO 2', value: item.codigoIso2 },
      { label: 'ISO 3', value: item.codigoIso3 },
      { label: 'Código telefónico', value: item.codigoTelefonico },
    ],
  },
  'redes-conocidas': {
    service: redConocidaService,
    hasHabilitado: false,
    title: 'Redes Wi-Fi',
    singular: 'red conocida',
    kicker: 'Red conocida',
    registerLabel: 'Registrar red',
    hint: 'El BSSID va en formato aa:bb:cc:dd:ee:ff y debe ser único. Si se elimina la ubicación, se eliminan también sus redes.',
    description: 'Puntos de acceso Wi-Fi conocidos. El agente de rastreo los usa para inferir la ubicación de un equipo.',
    titleOf: (item) => item.bssid,
    facts: (item, lookups = {}) => [lookups.ubicacionNombres?.[item.idUbicacion]].filter(Boolean),
    listView: {
      emptyTitle: 'No hay redes conocidas',
      emptyDescription: 'Registre el primer BSSID para mapearlo a una ubicación.',
      filters: (lookups = {}) => [
        {
          key: 'idUbicacion',
          label: 'Ubicación',
          options: [
            { value: 'all', label: 'Todas' },
            ...asOptions(lookups.ubicaciones ?? []),
          ],
        },
      ],
      columns: (lookups = {}) => [
        { key: 'bssid', header: 'BSSID', primary: true, mono: true },
        {
          key: 'ubicacion',
          header: 'Ubicación',
          getValue: (item) => lookups.ubicacionNombres?.[item.idUbicacion] ?? '—',
        },
      ],
    },
    empty: () => ({ bssid: '', idUbicacion: '' }),
    toForm: (item) => ({
      bssid: item.bssid ?? '',
      idUbicacion: String(item.idUbicacion ?? ''),
    }),
    fields: ({ ubicaciones } = {}) => [
      { name: 'bssid', label: 'BSSID', required: true, maxLength: 17, wide: true },
      {
        name: 'idUbicacion',
        label: 'Ubicación',
        type: 'select',
        required: true,
        options: asOptions(ubicaciones ?? []),
      },
    ],
    validate(values) {
      return {
        bssid: bssidFormatError(values.bssid),
        idUbicacion: requireSelect(values.idUbicacion, 'una ubicación'),
      };
    },
    toPayload(values) {
      return {
        bssid: normalizeBssid(values.bssid),
        idUbicacion: Number(values.idUbicacion),
      };
    },
    detail: (item, lookups = {}) => [
      { label: 'BSSID', value: item.bssid },
      { label: 'Ubicación', value: lookups.ubicacionNombres?.[item.idUbicacion] ?? '—' },
    ],
  },
  usuarios: {
    service: usuarioService,
    requiresWriteToList: true,
    title: 'Usuarios',
    singular: 'usuario',
    newTitle: 'Nuevo usuario',
    kicker: 'Usuario',
    registerLabel: 'Registrar usuario',
    hint: 'Nombres, apellidos, correo, usuario y rol son obligatorios. La empresa es obligatoria salvo para el administrador general.',
    description: 'Cuentas con acceso al sistema. El listado exige perfil de administrador de empresa.',
    titleOf: usuarioNombre,
    facts: (item, lookups = {}) =>
      [item.username, rolUsuarioLabel[item.rol] ?? item.rol, lookups.empresaNombres?.[item.idEmpresa]].filter(Boolean),
    listView: {
      emptyTitle: 'No hay usuarios',
      emptyDescription: 'Registre la primera cuenta para dar acceso al sistema.',
      columns: (lookups = {}) => [
        { key: 'nombre', header: 'Nombre', primary: true, getValue: usuarioNombre },
        { key: 'username', header: 'Usuario' },
        { key: 'correo', header: 'Correo' },
        {
          key: 'rol',
          header: 'Rol',
          getValue: (item) => rolUsuarioLabel[item.rol] ?? String(item.rol ?? '—'),
        },
        {
          key: 'empresa',
          header: 'Empresa',
          getValue: (item) => lookups.empresaNombres?.[item.idEmpresa] ?? '—',
        },
        { key: 'habilitado', header: 'Estado', type: 'status' },
      ],
    },
    empty: ({ idEmpresa } = {}) => ({
      idEmpresa: idEmpresa == null || idEmpresa === '' ? '' : String(idEmpresa),
      nombres: '',
      apellidos: '',
      correo: '',
      username: '',
      password: '',
      rol: String(RolUsuario.Consulta),
      habilitado: true,
    }),
    toForm: (item) => ({
      idEmpresa: item.idEmpresa == null ? '' : String(item.idEmpresa),
      nombres: item.nombres ?? '',
      apellidos: item.apellidos ?? '',
      correo: item.correo ?? '',
      username: item.username ?? '',
      password: '',
      rol: String(item.rol ?? RolUsuario.Consulta),
      habilitado: Boolean(item.habilitado),
    }),
    fields: ({ empresas = [], rol, editing } = {}) => {
      const lockEmpresa = rol != null && rol < RolUsuario.AdministradorGeneral;
      return [
        {
          name: 'idEmpresa',
          label: 'Empresa',
          type: 'select',
          options: asOptions(empresas),
          readOnly: lockEmpresa,
          hint: lockEmpresa
            ? 'El usuario queda en su empresa.'
            : 'Obligatoria salvo que el rol sea administrador general.',
        },
        { name: 'nombres', label: 'Nombres', required: true, maxLength: 100 },
        { name: 'apellidos', label: 'Apellidos', required: true, maxLength: 100 },
        { name: 'correo', label: 'Correo', required: true, maxLength: 150, autoComplete: 'email', type: 'email' },
        { name: 'username', label: 'Usuario', required: true, maxLength: 50, autoComplete: 'username' },
        {
          name: 'password',
          label: editing ? 'Nueva contraseña' : 'Contraseña',
          type: 'password',
          generateAction: true,
          autoComplete: 'new-password',
          required: !editing,
          hint: editing
            ? 'Deje vacío para no cambiar la clave. Generar rellena el campo.'
            : 'Generar rellena el campo. Cópiala ahora: al guardar solo queda el hash.',
        },
        {
          name: 'rol',
          label: 'Rol',
          type: 'select',
          required: true,
          options: rolOptions(rol),
        },
        {
          ...switchField(),
          hiddenWhen: () => !editing,
        },
      ];
    },
    validate(values, records = [], currentId) {
      const editing = currentId != null && currentId !== '';
      const rol = Number(values.rol);
      const password = String(values.password ?? '');
      const errors = {
        nombres: requireText(values.nombres, 'nombres', 100),
        apellidos: requireText(values.apellidos, 'apellidos', 100),
        correo: requireEmail(values.correo),
        username: requireText(values.username, 'username', 50),
        rol: requireSelect(values.rol, 'un rol'),
      };

      if (rol !== RolUsuario.AdministradorGeneral) {
        errors.idEmpresa = requireSelect(values.idEmpresa, 'una empresa');
      }

      if (!editing) {
        errors.password = requireText(password, 'password', 128);
        if (!errors.password && password.trim().length < 8) {
          errors.password = 'El campo password debe tener al menos 8 caracteres.';
        }
      } else if (password.trim()) {
        if (password.trim().length < 8) {
          errors.password = 'El campo password debe tener al menos 8 caracteres.';
        } else if (password.trim().length > 128) {
          errors.password = 'El campo password no debe superar los 128 caracteres.';
        }
      }

      const correo = String(values.correo ?? '')
        .trim()
        .toLowerCase();
      if (
        correo &&
        records.some((item) => String(item.correo).trim().toLowerCase() === correo && String(item.id) !== String(currentId))
      ) {
        errors.correo = 'Ya existe un usuario con el mismo correo.';
      }

      const username = String(values.username ?? '').trim();
      if (
        username &&
        records.some((item) => String(item.username) === username && String(item.id) !== String(currentId))
      ) {
        errors.username = 'Ya existe un usuario con el mismo username.';
      }

      return errors;
    },
    toPayload(values, { editing } = {}) {
      const rol = Number(values.rol);
      const idEmpresa =
        values.idEmpresa === '' || values.idEmpresa == null ? null : Number(values.idEmpresa);
      const base = {
        idEmpresa,
        nombres: values.nombres.trim(),
        apellidos: values.apellidos.trim(),
        correo: values.correo.trim().toLowerCase(),
        username: values.username.trim(),
        rol,
      };

      if (editing) {
        return {
          ...base,
          password: String(values.password ?? '').trim() || null,
          habilitado: Boolean(values.habilitado),
        };
      }

      return {
        ...base,
        password: String(values.password ?? '').trim(),
        generarPassword: false,
      };
    },
    detail: (item, lookups = {}) => [
      { label: 'Usuario', value: item.username },
      { label: 'Correo', value: item.correo },
      { label: 'Rol', value: rolUsuarioLabel[item.rol] ?? String(item.rol ?? '—') },
      { label: 'Empresa', value: lookups.empresaNombres?.[item.idEmpresa] ?? '—' },
    ],
  },
  responsables: {
    service: responsableService,
    title: 'Responsables',
    singular: 'responsable',
    newTitle: 'Nuevo responsable',
    kicker: 'Responsable',
    registerLabel: 'Registrar responsable',
    hint: 'El nombre y el área son obligatorios. Correo y teléfono son opcionales.',
    description: 'Personas que reciben activos. El área determina sede y empresa.',
    titleOf: (item) => item.nombreCompleto,
    facts: (item, lookups = {}) =>
      [lookups.areaNombres?.[item.idArea], item.cargo, item.correo].filter(Boolean),
    listView: {
      emptyTitle: 'No hay responsables',
      emptyDescription: 'Registre el primer responsable para asignarle equipos.',
      columns: (lookups = {}) => [
        { key: 'nombreCompleto', header: 'Nombre', primary: true },
        {
          key: 'area',
          header: 'Área',
          getValue: (item) => lookups.areaNombres?.[item.idArea] ?? '—',
        },
        { key: 'cargo', header: 'Cargo' },
        { key: 'correo', header: 'Correo' },
        { key: 'telefono', header: 'Teléfono' },
        { key: 'habilitado', header: 'Estado', type: 'status' },
      ],
    },
    empty: ({ paises } = {}) => ({
      idArea: '',
      nombreCompleto: '',
      cargo: '',
      correo: '',
      ...phoneFormFields('', paises),
      habilitado: true,
    }),
    toForm: (item, { paises } = {}) => ({
      idArea: String(item.idArea ?? ''),
      nombreCompleto: item.nombreCompleto ?? '',
      cargo: item.cargo ?? '',
      correo: item.correo ?? '',
      ...phoneFormFields(item.telefono, paises),
      habilitado: Boolean(item.habilitado),
    }),
    fields: ({ areas, paises, editing } = {}) => [
      { name: 'idArea', label: 'Área', type: 'select', required: true, options: asOptions(areas ?? []) },
      { name: 'nombreCompleto', label: 'Nombre completo', required: true, maxLength: 150, wide: true },
      { name: 'cargo', label: 'Cargo', maxLength: 100 },
      { name: 'correo', label: 'Correo', maxLength: 150, type: 'email', autoComplete: 'email' },
      phoneField({ paises }),
      { ...switchField(), hiddenWhen: () => !editing },
    ],
    validate(values) {
      return {
        idArea: requireSelect(values.idArea, 'un área'),
        nombreCompleto: requireText(values.nombreCompleto, 'nombre completo', 150),
        cargo: optionalText(values.cargo, 'cargo', 100),
        correo: optionalEmail(values.correo),
        telefono: validatePhoneFields(values),
      };
    },
    toPayload(values, { editing } = {}) {
      const base = {
        idArea: Number(values.idArea),
        nombreCompleto: values.nombreCompleto.trim(),
        cargo: values.cargo.trim() || null,
        correo: values.correo.trim() || null,
        telefono: phonePayload(values),
      };
      if (editing) {
        return { ...base, habilitado: Boolean(values.habilitado) };
      }
      return base;
    },
    detail: (item, lookups = {}) => [
      { label: 'Área', value: lookups.areaNombres?.[item.idArea] ?? '—' },
      { label: 'Cargo', value: item.cargo },
      { label: 'Correo', value: item.correo },
      { label: 'Teléfono', value: item.telefono },
    ],
  },
  estados: nombreDescripcionMaestro({
    service: estadoService,
    title: 'Estados',
    singular: 'estado',
    newTitle: 'Nuevo estado',
    kicker: 'Estado',
    registerLabel: 'Registrar estado',
    hint: 'El nombre es obligatorio y no puede repetirse.',
    description: 'Estados operativos globales del activo: disponible, asignado, mantenimiento o baja. No se filtra por empresa.',
    scope: 'global',
    emptyTitle: 'No hay estados',
    emptyDescription: 'Registre el primer estado para usarlo en asignaciones.',
  }),
  'tipos-asignacion': nombreDescripcionMaestro({
    service: tipoAsignacionService,
    title: 'Tipos de asignación',
    singular: 'tipo de asignación',
    newTitle: 'Nuevo tipo de asignación',
    kicker: 'Tipo de asignación',
    registerLabel: 'Registrar tipo',
    hint: 'El nombre es obligatorio y no puede repetirse. Asignacion, Traslado, Mantenimiento y Baja alimentan los movimientos.',
    description: 'Tipos de movimiento globales: entrega, traslado, mantenimiento o baja. No se filtra por empresa.',
    scope: 'global',
    emptyTitle: 'No hay tipos de asignación',
    emptyDescription: 'Registre el primer tipo para clasificar movimientos.',
  }),
};

export function getMaestro(slug) {
  return maestros[slug] ?? null;
}
