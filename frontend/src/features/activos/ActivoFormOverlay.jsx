import { useMemo } from 'react';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import {
  asOptions,
  compactErrors,
  optionalText,
  requireSelect,
  requireText,
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
    observaciones: item.observaciones ?? '',
  };
}

function activoToPayload(values) {
  return {
    idCategoriaActivo: Number(values.idCategoriaActivo),
    idProveedor: Number(values.idProveedor),
    idUbicacion: Number(values.idUbicacion),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || null,
    marca: values.marca.trim() || null,
    modelo: values.modelo.trim() || null,
    numeroSerie: values.numeroSerie.trim() || null,
    fechaCompra: values.fechaCompra,
    costoAdquisicion: Number(values.costoAdquisicion || 0),
    moneda: values.moneda.trim() || 'GTQ',
    numeroFactura: values.numeroFactura.trim() || null,
    fechaVencimientoGarantia: values.fechaVencimientoGarantia,
    observaciones: values.observaciones.trim() || null,
  };
}

export function ActivoFormOverlay({
  open,
  editing,
  record,
  categorias,
  proveedores,
  ubicaciones,
  sedes,
  idEmpresaActiva,
  onSave,
  onClose,
}) {
  const destinos = useMemo(
    () => ubicacionesDeEmpresa(ubicaciones, sedes, idEmpresaActiva),
    [idEmpresaActiva, sedes, ubicaciones],
  );

  const fields = useMemo(
    () => [
      { name: 'nombre', label: 'Nombre', required: true, maxLength: 150, wide: true },
      {
        name: 'idCategoriaActivo',
        label: 'Categoría',
        type: 'select',
        required: true,
        options: asOptions((categorias ?? []).filter((item) => item.habilitado !== false)),
      },
      {
        name: 'idProveedor',
        label: 'Proveedor',
        type: 'select',
        required: true,
        options: asOptions(
          (proveedores ?? []).filter((item) => {
            if (item.habilitado === false) return false;
            if (idEmpresaActiva == null || idEmpresaActiva === '') return true;
            return Number(item.idEmpresa) === Number(idEmpresaActiva);
          }),
        ),
      },
      {
        name: 'idUbicacion',
        label: 'Ubicación',
        type: 'select',
        required: true,
        options: asOptions(destinos),
        hint: 'Empresa y sede se derivan de la ubicación. ActivoDto no tiene esos ids.',
      },
      { name: 'marca', label: 'Marca', maxLength: 100 },
      { name: 'modelo', label: 'Modelo', maxLength: 100 },
      { name: 'numeroSerie', label: 'Número de serie', maxLength: 100 },
      { name: 'fechaCompra', label: 'Fecha de compra', type: 'date', required: true },
      { name: 'costoAdquisicion', label: 'Costo de adquisición', type: 'number', min: 0, step: '0.01' },
      { name: 'moneda', label: 'Moneda', maxLength: 10 },
      { name: 'numeroFactura', label: 'Número de factura', maxLength: 50 },
      { name: 'fechaVencimientoGarantia', label: 'Vencimiento de garantía', type: 'date', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 300, wide: true },
      { name: 'observaciones', label: 'Observaciones', type: 'textarea', maxLength: 500, wide: true },
    ],
    [categorias, destinos, idEmpresaActiva, proveedores],
  );

  return (
    <RecordFormOverlay
      key={record?.id ?? 'nuevo-activo'}
      open={open}
      title={editing ? record?.nombre : 'Nuevo activo'}
      kicker={editing ? 'Editar registro' : 'Registrar activo'}
      hint="Nombre, categoría, proveedor, ubicación, compra y garantía son obligatorios. No hay idEmpresa ni idSede en el DTO."
      fields={fields}
      initialValues={editing && record ? activoToForm(record) : emptyActivo()}
      submitLabel={editing ? 'Guardar cambios' : 'Registrar activo'}
      validate={(values) =>
        compactErrors({
          nombre: requireText(values.nombre, 'nombre', 150),
          idCategoriaActivo: requireSelect(values.idCategoriaActivo, 'una categoría'),
          idProveedor: requireSelect(values.idProveedor, 'un proveedor'),
          idUbicacion: requireSelect(values.idUbicacion, 'una ubicación'),
          fechaCompra: requireSelect(values.fechaCompra, 'una fecha de compra'),
          fechaVencimientoGarantia: requireSelect(values.fechaVencimientoGarantia, 'una fecha de garantía'),
          marca: optionalText(values.marca, 'marca', 100),
          modelo: optionalText(values.modelo, 'modelo', 100),
          numeroSerie: optionalText(values.numeroSerie, 'número de serie', 100),
          descripcion: optionalText(values.descripcion, 'descripción', 300),
          observaciones: optionalText(values.observaciones, 'observaciones', 500),
        })
      }
      onSave={(values) => onSave(activoToPayload(values))}
      onClose={onClose}
    />
  );
}
