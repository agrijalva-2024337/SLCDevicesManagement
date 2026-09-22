import { useMemo } from 'react';
import {
  indexAsignacionesActivas,
  indexTipos,
  isActivoAsignado,
  isActivoDeBaja,
  isActivoEnMantenimiento,
} from '@/features/activos/activoAcciones';
import {
  activosDeEmpresa,
  nombreUbicacion,
  responsablesDeEmpresa,
  responsablesDeSede,
  sedeIdDeResponsable,
  todayIsoDate,
} from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { asOptions, compactErrors, optionalText, requireSelect } from '@/shared/components/recordFormUtils';
import { TIPO_ASIGNACION, nombresCatalogoIguales } from '@/shared/api/tipoAsignacion';
import { byId } from '@/shared/utils/format';

function initialValues(prefill, { activos, ubicaciones } = {}) {
  const idActivo = prefill?.idActivo ? String(prefill.idActivo) : '';
  const activo = (activos ?? []).find((item) => Number(item.id) === Number(idActivo));
  const ubicacion = (ubicaciones ?? []).find((item) => Number(item.id) === Number(activo?.idUbicacion));
  return {
    idSedeFiltro: '',
    idCategoriaFiltro: '',
    idActivo,
    ubicacion: idActivo ? nombreUbicacion(ubicacion) : '',
    idResponsable: prefill?.idResponsable ? String(prefill.idResponsable) : '',
    fecha: todayIsoDate(),
    observaciones: '',
    firmaEntrega: '',
    firmaRecibe: '',
  };
}

function activosDisponibles({ activos, ubicaciones, sedes, asignaciones, tipos, idEmpresaActiva }) {
  const lookup = {
    asignaciones,
    tipos,
    tipoIds: indexTipos(tipos),
    asignacionesPorActivo: indexAsignacionesActivas(asignaciones),
  };
  const deEmpresa = activosDeEmpresa(activos, ubicaciones, sedes, idEmpresaActiva);
  return deEmpresa.filter((item) => {
    if (isActivoDeBaja(item, lookup) || isActivoEnMantenimiento(item, lookup) || isActivoAsignado(item, lookup)) {
      return false;
    }
    if (item.habilitado === false) {
      return false;
    }
    const ubicacion = byId(ubicaciones, item.idUbicacion);
    if (!ubicacion || ubicacion.habilitado === false) {
      return false;
    }
    return true;
  });
}

function filtrarActivosPorSedeCategoria(activos, ubicaciones, idSedeFiltro, idCategoriaFiltro) {
  return (activos ?? []).filter((item) => {
    if (idSedeFiltro != null && idSedeFiltro !== '') {
      const ubicacion = byId(ubicaciones, item.idUbicacion);
      if (!ubicacion || Number(ubicacion.idSede) !== Number(idSedeFiltro)) {
        return false;
      }
    }
    if (
      idCategoriaFiltro != null &&
      idCategoriaFiltro !== '' &&
      Number(item.idCategoriaActivo) !== Number(idCategoriaFiltro)
    ) {
      return false;
    }
    return true;
  });
}

export function AsignacionFormOverlay({
  open,
  prefill,
  activos,
  ubicaciones,
  sedes = [],
  categorias = [],
  responsables,
  areas = [],
  asignaciones = [],
  tipos = [],
  idEmpresaActiva,
  onSave,
  onClose,
}) {
  const lockActivo = Boolean(prefill?.idActivo);
  const ctx = { asignaciones, tipos };

  const sedesDeEmpresa = useMemo(
    () =>
      (sedes ?? []).filter((item) => {
        if (item.habilitado === false) return false;
        if (idEmpresaActiva == null || idEmpresaActiva === '') return true;
        return Number(item.idEmpresa) === Number(idEmpresaActiva);
      }),
    [idEmpresaActiva, sedes],
  );
  const categoriasDeEmpresa = useMemo(
    () =>
      (categorias ?? []).filter((item) => {
        if (item.habilitado === false) return false;
        if (idEmpresaActiva == null || idEmpresaActiva === '') return true;
        return Number(item.idEmpresa) === Number(idEmpresaActiva);
      }),
    [categorias, idEmpresaActiva],
  );

  const sedeOptions = useMemo(() => asOptions(sedesDeEmpresa, 'nombre'), [sedesDeEmpresa]);
  const categoriaOptions = useMemo(() => asOptions(categoriasDeEmpresa, 'nombre'), [categoriasDeEmpresa]);
  const responsablesFiltrados = useMemo(
    () => responsablesDeEmpresa(responsables, areas, sedes, idEmpresaActiva),
    [areas, idEmpresaActiva, responsables, sedes],
  );
  const activosElegibles = useMemo(
    () => activosDisponibles({ activos, ubicaciones, sedes, asignaciones, tipos, idEmpresaActiva }),
    [activos, asignaciones, idEmpresaActiva, sedes, tipos, ubicaciones],
  );
  const activoOptionsLocked = useMemo(() => asOptions(activos ?? [], 'nombre'), [activos]);

  return (
    <RecordFormOverlay
      key={`entrega-${prefill?.idActivo ?? 'nueva'}`}
      open={open}
      title="Registrar asignación"
      kicker="Entrega"
      hint="El responsable debe ser de la misma sede que el activo. Solo un activo asignado por categoría."
      fields={(values) => {
        const elegibles = filtrarActivosPorSedeCategoria(
          activosElegibles,
          ubicaciones,
          values.idSedeFiltro,
          values.idCategoriaFiltro,
        );
        const filtrosActivos =
          (values.idSedeFiltro != null && values.idSedeFiltro !== '') ||
          (values.idCategoriaFiltro != null && values.idCategoriaFiltro !== '');
        const activoHint =
          !lockActivo && filtrosActivos && elegibles.length === 0
            ? 'No hay unidades disponibles de esta categoría en la sede seleccionada.'
            : undefined;
        const activo = byId(activos, values.idActivo);
        const ubicacionActivo = byId(ubicaciones, activo?.idUbicacion);
        const idSedeActivo = ubicacionActivo?.idSede;
        const responsablesMismaSede = responsablesDeSede(responsablesFiltrados, areas, idSedeActivo);
        const responsableHint = activo
          ? idSedeActivo == null
            ? 'El activo no tiene ubicación/sede; no se puede asignar.'
            : responsablesMismaSede.length === 0
              ? 'No hay responsables habilitados en la sede del activo.'
              : 'Solo responsables de la misma sede que la ubicación del activo.'
          : 'Seleccione un activo para listar responsables de su sede.';

        return [
          ...(lockActivo
            ? []
            : [
                {
                  name: 'idSedeFiltro',
                  label: 'Sede',
                  type: 'select',
                  options: sedeOptions,
                },
                {
                  name: 'idCategoriaFiltro',
                  label: 'Categoría',
                  type: 'select',
                  options: categoriaOptions,
                },
              ]),
          {
            name: 'idActivo',
            label: 'Activo',
            type: 'select',
            required: true,
            readOnly: lockActivo,
            options: lockActivo ? activoOptionsLocked : asOptions(elegibles, 'nombre'),
            hint: activoHint,
          },
          {
            name: 'ubicacion',
            label: 'Ubicación de uso',
            type: 'text',
            readOnly: true,
            hint: 'Ubicación actual del activo.',
          },
          {
            name: 'idResponsable',
            label: 'Responsable que recibe',
            type: 'select',
            required: true,
            options: asOptions(responsablesMismaSede, 'nombreCompleto'),
            hint: responsableHint,
          },
          { name: 'fecha', label: 'Fecha de entrega', type: 'date', required: true },
          {
            name: 'observaciones',
            label: 'Observaciones',
            type: 'textarea',
            maxLength: 300,
            wide: true,
          },
          {
            name: 'firmaEntrega',
            label: 'Firma de quien entrega',
            type: 'signature',
            hint: 'Opcional. Se puede guardar sin firmar.',
          },
          {
            name: 'firmaRecibe',
            label: 'Firma de quien recibe',
            type: 'signature',
            hint: 'Opcional. Se puede guardar sin firmar.',
          },
        ];
      }}
      initialValues={initialValues(prefill, { activos, ubicaciones })}
      deriveValues={(next, prev) => {
        const elegibles = filtrarActivosPorSedeCategoria(
          activosElegibles,
          ubicaciones,
          next.idSedeFiltro,
          next.idCategoriaFiltro,
        );
        let idActivo = next.idActivo;
        if (
          !lockActivo &&
          idActivo &&
          (next.idSedeFiltro !== prev?.idSedeFiltro || next.idCategoriaFiltro !== prev?.idCategoriaFiltro) &&
          !elegibles.some((item) => Number(item.id) === Number(idActivo))
        ) {
          idActivo = '';
        }
        const activo = byId(activos, idActivo);
        const ubicacion = byId(ubicaciones, activo?.idUbicacion);
        let idResponsable = next.idResponsable;
        if (idResponsable) {
          const responsable = byId(responsablesFiltrados, idResponsable);
          const sedeResponsable = sedeIdDeResponsable(responsable, areas);
          const sedeActivo = ubicacion?.idSede != null ? Number(ubicacion.idSede) : null;
          if (!activo || sedeActivo == null || sedeResponsable !== sedeActivo) {
            idResponsable = '';
          }
        }
        return {
          ...next,
          idActivo,
          idResponsable,
          ubicacion: activo ? nombreUbicacion(ubicacion) : '',
        };
      }}
      validate={(values) => {
        const activo = byId(activos, values.idActivo);
        const errors = {
          idActivo: requireSelect(values.idActivo, 'un activo'),
          idResponsable: requireSelect(values.idResponsable, 'un responsable'),
          fecha: requireSelect(values.fecha, 'una fecha de entrega'),
          observaciones: optionalText(values.observaciones, 'observaciones', 300),
        };
        if (activo && isActivoDeBaja(activo, ctx)) {
          errors.idActivo = 'El activo está dado de baja. No se puede asignar.';
        } else if (activo && isActivoEnMantenimiento(activo, ctx)) {
          errors.idActivo = 'El activo está en mantenimiento. Finalícelo antes de asignarlo.';
        } else if (activo && isActivoAsignado(activo, ctx)) {
          errors.idActivo = 'El activo ya tiene una asignación activa.';
        } else if (activo && values.idResponsable) {
          const ubicacion = byId(ubicaciones, activo.idUbicacion);
          const sedeActivo = ubicacion?.idSede != null ? Number(ubicacion.idSede) : null;
          const responsable = byId(responsables, values.idResponsable);
          const sedeResponsable = sedeIdDeResponsable(responsable, areas);
          if (sedeActivo == null || sedeResponsable == null || sedeActivo !== sedeResponsable) {
            errors.idResponsable =
              'El responsable debe pertenecer a la misma sede de la ubicación del activo.';
          } else {
            const idsTipoAsignacion = new Set(
              (tipos ?? [])
                .filter((t) => nombresCatalogoIguales(t.nombre, TIPO_ASIGNACION.Asignacion))
                .map((t) => Number(t.id)),
            );
            const conflicto = (asignaciones ?? []).find((row) => {
              if (!row.activa || Number(row.idResponsable) !== Number(values.idResponsable)) {
                return false;
              }
              if (idsTipoAsignacion.size > 0 && !idsTipoAsignacion.has(Number(row.idTipoAsignacion))) {
                return false;
              }
              const otro = byId(activos, row.idActivo);
              return (
                otro &&
                Number(otro.idCategoriaActivo) === Number(activo.idCategoriaActivo) &&
                Number(otro.id) !== Number(activo.id)
              );
            });
            if (conflicto) {
              const categoria = byId(categorias, activo.idCategoriaActivo);
              const otroActivo = byId(activos, conflicto.idActivo);
              const catNombre = categoria?.nombre ?? 'esta categoría';
              const otroNombre = otroActivo?.nombre ?? `activo #${conflicto.idActivo}`;
              errors.idResponsable = `Ya tiene un activo de «${catNombre}» asignado (${otroNombre}). Solo se permite uno por categoría.`;
            }
          }
        }
        return compactErrors(errors);
      }}
      onSave={onSave}
      onClose={onClose}
      submitLabel="Registrar entrega"
    />
  );
}
