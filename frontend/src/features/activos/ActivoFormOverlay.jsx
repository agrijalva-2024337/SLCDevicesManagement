import { useMemo } from 'react';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import {
  asOptions,
  compactErrors,
  requireSelect,
  validarAlfanumerico,
  validarCosto,
  validarMarcaModelo,
  validarMoneda,
  validarNombreEntidad,
  validarTextoLibre,
} from '@/shared/components/recordFormUtils';
import { ubicacionesDeEmpresa } from '@/features/inventario/trasladoRuta';

function emptyActivo() {
  return {
    nombre: '',
    idCategoriaActivo: '',
    idProveedor: '',
    idUbicacion: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    fechaCompra: '',
    costoAdquisicion: '',
    moneda: 'GTQ',
    numeroFactura: '',
    fechaVencimientoGarantia: '',
    descripcion: '',
    especificacionesHardware: '',
    perifericosAdicionales: '',
    observaciones: '',
  };
}

function activoToForm(item) {
  return {
    nombre: item.nombre ?? '',
    idCategoriaActivo: String(item.idCategoriaActivo ?? ''),
    idProveedor: String(item.idProveedor ?? ''),
    idUbicacion: String(item.idUbicacion ?? ''),
    marca: item.marca ?? '',
    modelo: item.modelo ?? '',
    numeroSerie: item.numeroSerie ?? '',
    fechaCompra: item.fechaCompra ? String(item.fechaCompra).slice(0, 10) : '',
    costoAdquisicion: String(item.costoAdquisicion ?? ''),
    moneda: item.moneda ?? 'GTQ',
    numeroFactura: item.numeroFactura ?? '',
    fechaVencimientoGarantia: item.fechaVencimientoGarantia
      ? String(item.fechaVencimientoGarantia).slice(0, 10)
      : '',
    descripcion: item.descripcion ?? '',
    especificacionesHardware: item.especificacionesHardware ?? '',
    perifericosAdicionales: item.perifericosAdicionales ?? '',
    observaciones: item.observaciones ?? '',
  };
}

function activoToPayload(values, { codigoInterno = null } = {}) {
  return {
    idCategoriaActivo: Number(values.idCategoriaActivo),
    idProveedor: Number(values.idProveedor),
    idUbicacion: Number(values.idUbicacion),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || null,
    especificacionesHardware: values.especificacionesHardware.trim() || null,
    perifericosAdicionales: values.perifericosAdicionales.trim() || null,
    marca: values.marca.trim() || null,
    modelo: values.modelo.trim() || null,
    numeroSerie: values.numeroSerie.trim() || null,
    codigoInterno,
    fechaCompra: values.fechaCompra,
    costoAdquisicion: Number(values.costoAdquisicion || 0),
    moneda:
      String(values.moneda ?? '')
        .trim()
        .toUpperCase() || 'GTQ',
    numeroFactura: values.numeroFactura.trim() || null,
    fechaVencimientoGarantia: values.fechaVencimientoGarantia,
    observaciones: values.observaciones.trim() || null,
  };
}

function duplicateNumeroSerie(numerosSerie, numeroSerie) {
  const needle = String(numeroSerie ?? '')
    .trim()
    .toLowerCase();
  if (!needle) return false;
  return numerosSerie.has(needle);
}

function validateActivoForm(values, numerosSerie) {
  const errors = {
    nombre: validarNombreEntidad(values.nombre, 'nombre', 150, { required: true }),
    idCategoriaActivo: requireSelect(values.idCategoriaActivo, 'una categoría'),
    idProveedor: requireSelect(values.idProveedor, 'un proveedor'),
    idUbicacion: requireSelect(values.idUbicacion, 'una ubicación'),
    fechaCompra: requireSelect(values.fechaCompra, 'una fecha de compra'),
    fechaVencimientoGarantia: requireSelect(values.fechaVencimientoGarantia, 'una fecha de garantía'),
    marca: validarMarcaModelo(values.marca, 'marca', 100, { required: false }),
    modelo: validarMarcaModelo(values.modelo, 'modelo', 100, { required: false }),
    numeroSerie: validarAlfanumerico(values.numeroSerie, 'número de serie', 100, {
      required: false,
    }),
    costoAdquisicion: validarCosto(values.costoAdquisicion, 'costo', { required: false }),
    moneda: validarMoneda(values.moneda, 'moneda', { required: false }),
    numeroFactura: validarAlfanumerico(values.numeroFactura, 'número de factura', 50, {
      required: false,
    }),
    descripcion: validarTextoLibre(values.descripcion, 'descripción', 300, { required: false }),
    especificacionesHardware: validarTextoLibre(
      values.especificacionesHardware,
      'especificaciones de hardware',
      500,
      { required: false },
    ),
    perifericosAdicionales: validarTextoLibre(
      values.perifericosAdicionales,
      'periféricos adicionales',
      500,
      { required: false },
    ),
    observaciones: validarTextoLibre(values.observaciones, 'observaciones', 500, {
      required: false,
    }),
  };

  if (!errors.numeroSerie && duplicateNumeroSerie(numerosSerie, values.numeroSerie)) {
    errors.numeroSerie = 'Ya existe un activo registrado con este número de serie.';
  }

  return compactErrors(errors);
}

function monedasDesdePaises(paises, monedaExtra) {
  const codigos = new Set(
    (paises ?? [])
      .map((p) => String(p.codigoMoneda ?? '').trim().toUpperCase())
      .filter(Boolean),
  );
  const extra = String(monedaExtra ?? '')
    .trim()
    .toUpperCase();
  if (extra) codigos.add(extra);
  if (codigos.size === 0) {
    codigos.add('GTQ');
  }
  return Array.from(codigos)
    .sort()
    .map((codigo) => ({ id: codigo, nombre: codigo }));
}

export function ActivoFormOverlay({
  open,
  editing,
  record,
  records = [],
  categorias,
  proveedores,
  ubicaciones,
  sedes,
  paises = [],
  idEmpresaActiva,
  onSave,
  onClose,
}) {
  const destinos = useMemo(
    () => ubicacionesDeEmpresa(ubicaciones, sedes, idEmpresaActiva),
    [idEmpresaActiva, sedes, ubicaciones],
  );

  const proveedorActual = useMemo(
    () => (proveedores ?? []).find((p) => Number(p.id) === Number(record?.idProveedor)),
    [proveedores, record?.idProveedor],
  );
  const idEmpresaDelActivo = proveedorActual?.idEmpresa;

  const categoriaOptions = useMemo(
    () => asOptions((categorias ?? []).filter((item) => item.habilitado !== false)),
    [categorias],
  );

  const proveedorOptions = useMemo(() => {
    const idEmpresaFiltro = editing ? idEmpresaDelActivo : idEmpresaActiva;
    return asOptions(
      (proveedores ?? []).filter((item) => {
        if (item.habilitado === false) return false;
        if (idEmpresaFiltro == null || idEmpresaFiltro === '') return true;
        return Number(item.idEmpresa) === Number(idEmpresaFiltro);
      }),
    );
  }, [editing, idEmpresaActiva, idEmpresaDelActivo, proveedores]);

  const ubicacionOptions = useMemo(() => asOptions(destinos), [destinos]);

  const monedaOptions = useMemo(
    () => asOptions(monedasDesdePaises(paises, record?.moneda || 'GTQ')),
    [paises, record?.moneda],
  );

  const numerosSerieExistentes = useMemo(() => {
    const currentId = editing ? record?.id : undefined;
    const seen = new Set();
    for (const item of records ?? []) {
      if (currentId != null && String(item.id) === String(currentId)) continue;
      const key = String(item.numeroSerie ?? '')
        .trim()
        .toLowerCase();
      if (key) seen.add(key);
    }
    return seen;
  }, [editing, record?.id, records]);

  const fields = useMemo(
    () => [
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 150, wide: true },
      {
        name: 'idCategoriaActivo',
        label: 'Categoría',
        type: 'select',
        required: true,
        options: categoriaOptions,
      },
      {
        name: 'idProveedor',
        label: 'Proveedor',
        type: 'select',
        required: true,
        options: proveedorOptions,
        hint: editing
          ? 'Solo se puede corregir por un proveedor de la misma empresa. Para mover el activo a otra empresa, contacta a un Administrador general.'
          : undefined,
      },
      {
        name: 'idUbicacion',
        label: 'Ubicación',
        type: 'select',
        required: true,
        readOnly: Boolean(editing),
        options: ubicacionOptions,
        hint: editing
          ? 'Para cambiar la ubicación de un activo, usa Traslado.'
          : 'Empresa y sede se derivan de la ubicación.',
      },
      { name: 'marca', label: 'Marca', maxLength: 100 },
      { name: 'modelo', label: 'Modelo', maxLength: 100 },
      {
        name: 'numeroSerie',
        label: 'Número de serie',
        maxLength: 100,
        hint: 'Serie del fabricante (placa de fábrica).',
      },
      { name: 'fechaCompra', label: 'Fecha de compra', type: 'date', required: true },
      {
        name: 'costoAdquisicion',
        label: 'Costo de adquisición',
        type: 'number',
        min: 0,
        step: '0.01',
        hint: 'Hasta dos decimales, con punto. Ejemplo: 1250.50. Máximo 9999999999.99',
      },
      {
        name: 'moneda',
        label: 'Moneda',
        type: 'select',
        options: monedaOptions,
        hint: 'Se arma con las monedas de los países ya registrados en el catálogo de Países.',
      },
      { name: 'numeroFactura', label: 'Número de factura', maxLength: 50 },
      {
        name: 'fechaVencimientoGarantia',
        label: 'Vencimiento de garantía',
        type: 'date',
        required: true,
      },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 300, wide: true },
      {
        name: 'especificacionesHardware',
        label: 'Especificaciones de hardware',
        type: 'textarea',
        maxLength: 500,
        wide: true,
      },
      {
        name: 'perifericosAdicionales',
        label: 'Periféricos adicionales',
        type: 'textarea',
        maxLength: 500,
        wide: true,
      },
      { name: 'observaciones', label: 'Observaciones', type: 'textarea', maxLength: 500, wide: true },
    ],
    [categoriaOptions, editing, monedaOptions, proveedorOptions, ubicacionOptions],
  );

  return (
    <RecordFormOverlay
      key={record?.id ?? 'nuevo-activo'}
      open={open}
      title={editing ? record?.nombre : 'Nuevo activo'}
      kicker={editing ? 'Editar registro' : 'Registrar activo'}
      hint="Nombre, categoría, proveedor, ubicación, compra y garantía son obligatorios."
      fields={fields}
      initialValues={editing && record ? activoToForm(record) : emptyActivo()}
      submitLabel={editing ? 'Guardar cambios' : 'Registrar activo'}
      validate={(values) => validateActivoForm(values, numerosSerieExistentes)}
      onSave={(values) =>
        onSave(
          activoToPayload(values, {
            // Altas: siempre null. Ediciones: conservar el valor histórico (el form ya no lo captura).
            codigoInterno: editing ? (record?.codigoInterno ?? null) : null,
          }),
        )
      }
      onClose={onClose}
    />
  );
}
