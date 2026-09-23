import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { RouteFallback } from '@/app/RouteFallback';
import { useAuth } from '@/features/auth/useAuth';
import {
  asignacionActivaDe,
  estadoNombreDeActivo,
  getAccionesDisponibles,
  indexAsignacionesActivas,
  indexTipos,
} from '@/features/activos/activoAcciones';
import * as activoService from '@/features/activos/activoService';
import { activosVistaPath } from '@/features/activos/activosVistas';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as categoriaService from '@/features/catalogos/categorias/categoriaService';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as proveedorService from '@/features/catalogos/proveedores/proveedorService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import * as bajaService from '@/features/bajas/bajaService';
import * as motivoBajaService from '@/features/bajas/motivoBajaService';
import {
  empresaIdDeActivo,
  nombreUbicacion,
  sedeIdDeActivo,
} from '@/features/inventario/trasladoRuta';
import * as trasladoService from '@/features/inventario/trasladoService';
import * as mantenimientoService from '@/features/mantenimientos/mantenimientoService';
import * as tipoMantenimientoService from '@/features/mantenimientos/tipoMantenimientoService';
import * as areaService from '@/features/organizacion/areas/areaService';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import * as usuarioService from '@/features/organizacion/usuarios/usuarioService';
import { RolUsuario } from '@/shared/api/contracts';
import { DataTable } from '@/shared/components/DataTable';
import { EscanearQrButton, RegisterButton } from '@/shared/components/RecordActions';
import { RowIconActions } from '@/shared/components/RowIconActions';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { listQueryKey } from '@/shared/data/queryKeys';
import { useResource } from '@/shared/hooks/useResource';
import { byId } from '@/shared/utils/format';
import { saveSuccessResult } from '@/shared/components/SaveSuccessPanel';

const ActivoFormOverlay = lazy(() =>
  import('@/features/activos/ActivoFormOverlay').then((module) => ({
    default: module.ActivoFormOverlay,
  })),
);
const BajaFormOverlay = lazy(() =>
  import('@/features/bajas/BajaFormOverlay').then((module) => ({
    default: module.BajaFormOverlay,
  })),
);
const TrasladoFormOverlay = lazy(() =>
  import('@/features/inventario/TrasladoFormOverlay').then((module) => ({
    default: module.TrasladoFormOverlay,
  })),
);
const MantenimientoFormOverlay = lazy(() =>
  import('@/features/mantenimientos/MantenimientoFormOverlay').then((module) => ({
    default: module.MantenimientoFormOverlay,
  })),
);

function estadoTone(nombre) {
  const key = String(nombre ?? '').toLowerCase();
  if (key.includes('baja')) return 'danger';
  if (key.includes('mantenimiento')) return 'warning';
  if (key.includes('asignado')) return 'info';
  if (key.includes('disponible')) return 'success';
  return 'muted';
}

const ACTIVO_COLUMNS = [
  {
    key: 'nombre',
    header: 'Nombre del Activo',
    primary: true,
    getValue: (row) => [row.nombre, row.marca, row.modelo].filter(Boolean).join(' '),
    render: (row) => (
      <div>
        <div>{row.nombre}</div>
        {row.marca || row.modelo ? (
          <div className="text-xs text-text-muted">
            {[row.marca, row.modelo].filter(Boolean).join(' ')}
          </div>
        ) : null}
      </div>
    ),
  },
  { key: 'numeroSerie', header: 'Número de serie' },
  { key: 'empresaNombre', header: 'Empresa' },
  { key: 'categoriaNombre', header: 'Categoría' },
  { key: 'ubicacionNombre', header: 'Ubicación' },
  { key: 'sedeNombre', header: 'Sede' },
  { key: 'paisNombre', header: 'País' },
  { key: 'responsableNombre', header: 'Responsable' },
  {
    key: 'estadoNombre',
    header: 'Estado',
    type: 'badge',
    tone: (row) => estadoTone(row.estadoNombre),
  },
];

export function ActivosPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { canWrite, rol, usuario } = useAuth();
  const allowWrite = canWrite('activos');
  const canRetire = canWrite('bajas');
  const canReadUsuarios = rol >= RolUsuario.AdministradorEmpresa;
  const { idActiva } = useEmpresaActiva();
  const { rows, isLoading, errorMessage, banner, setBanner, reload } = useCatalogCollection(
    activoService.getAll,
  );
  const crud = useCrudOverlay();
  const [movimiento, setMovimiento] = useState(null);
  const overlayForm = crud.isForm;
  const overlayBaja = movimiento?.tipo === 'baja';
  const overlayMant = movimiento?.tipo === 'mantenimiento';
  const overlayTraslado = movimiento?.tipo === 'traslado';
  const categorias = useResource(categoriaService.getAll);
  const proveedores = useResource(proveedorService.getAll, { enabled: overlayForm });
  const paises = useResource(paisService.getAll);
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);
  const areas = useResource(areaService.getAll, {
    enabled: overlayBaja || overlayMant || overlayTraslado,
  });
  const empresas = useResource(empresaService.getAll);
  const estados = useResource(estadoService.getAll);
  const responsables = useResource(responsableService.getAll);
  const tipos = useResource(tipoAsignacionService.getAll);
  const asignaciones = useResource(asignacionService.getAll);
  const loadUsuarios = useCallback(
    () => usuarioService.getAllIfAllowed(canReadUsuarios, { idEmpresa: idActiva || undefined }),
    [canReadUsuarios, idActiva],
  );
  const usuarios = useResource(loadUsuarios, {
    key: listQueryKey('usuarios', { idEmpresa: idActiva || undefined }),
    enabled: canReadUsuarios && overlayBaja,
  });
  const motivos = useResource(motivoBajaService.getAll, { enabled: overlayBaja });
  const tiposMantenimiento = useResource(tipoMantenimientoService.getAll, { enabled: overlayMant });

  const tipoIds = useMemo(() => indexTipos(tipos.data), [tipos.data]);
  const asignacionesPorActivo = useMemo(
    () => indexAsignacionesActivas(asignaciones.data),
    [asignaciones.data],
  );
  const ctx = useMemo(
    () => ({
      asignaciones: asignaciones.data,
      tipos: tipos.data,
      estados: estados.data,
      canRetire,
      tipoIds,
      asignacionesPorActivo,
    }),
    [asignaciones.data, asignacionesPorActivo, canRetire, estados.data, tipoIds, tipos.data],
  );

  const scopedRows = useMemo(() => {
    if (idActiva == null || idActiva === '') return rows;
    return rows.filter(
      (row) => empresaIdDeActivo(row, ubicaciones.data, sedes.data) === Number(idActiva),
    );
  }, [idActiva, rows, sedes.data, ubicaciones.data]);

  const tableRows = useMemo(
    () =>
      scopedRows.map((row) => {
        const vigente = asignacionActivaDe(row, asignacionesPorActivo);
        const idEmpresa = empresaIdDeActivo(row, ubicaciones.data, sedes.data);
        const idSede = sedeIdDeActivo(row, ubicaciones.data, sedes.data);
        const sede = byId(sedes.data, idSede);
        return {
          ...row,
          idSede,
          sedeNombre: sede?.nombre ?? '—',
          paisNombre: byId(paises.data, sede?.idPais)?.nombre ?? '—',
          categoriaNombre: byId(categorias.data, row.idCategoriaActivo)?.nombre ?? '—',
          empresaNombre: byId(empresas.data, idEmpresa)?.nombre ?? '—',
          ubicacionNombre: nombreUbicacion(byId(ubicaciones.data, row.idUbicacion)),
          responsableNombre: vigente
            ? (byId(responsables.data, vigente.idResponsable)?.nombreCompleto ?? '—')
            : '—',
          estadoNombre: estadoNombreDeActivo(row, ctx) ?? 'Disponible',
        };
      }),
    [
      asignacionesPorActivo,
      categorias.data,
      ctx,
      empresas.data,
      paises.data,
      responsables.data,
      scopedRows,
      sedes.data,
      ubicaciones.data,
    ],
  );

  const estadoInicial = params.get('estado');
  const estadoOptions = useMemo(() => {
    const names = [...new Set(tableRows.map((row) => row.estadoNombre).filter(Boolean))];
    return [
      { value: 'all', label: 'Todos' },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [tableRows]);

  const categoriaOptions = useMemo(() => {
    const names = [
      ...new Set(
        tableRows.map((row) => row.categoriaNombre).filter((name) => name && name !== '—'),
      ),
    ];
    return [
      { value: 'all', label: 'Todas' },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [tableRows]);

  const sedeOptions = useMemo(() => {
    const names = [
      ...new Set(tableRows.map((row) => row.sedeNombre).filter((name) => name && name !== '—')),
    ];
    return [
      { value: 'all', label: 'Todas' },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [tableRows]);

  async function refreshAll() {
    await Promise.all([reload(), asignaciones.reload()]);
  }

  function handleAccion(action, activo) {
    // La ficha y el QR viven en /app/activos/:id, ya no en una tarjeta flotante.
    if (action.key === 'view' || action.key === 'qr') {
      navigate(`/app/activos/${activo.id}`);
      return;
    }
    if (action.key === 'edit') {
      crud.openEdit(activo);
      return;
    }
    if (action.key === 'assign') {
      navigate(activosVistaPath('asignaciones'), { state: { idActivo: activo.id } });
      return;
    }
    if (action.key === 'transfer') {
      setMovimiento({ tipo: 'traslado', idActivo: activo.id });
      return;
    }
    if (action.key === 'maintenance') {
      setMovimiento({ tipo: 'mantenimiento', idActivo: activo.id });
      return;
    }
    if (action.key === 'retire') {
      setMovimiento({ tipo: 'baja', idActivo: activo.id });
    }
  }

  if (errorMessage) {
    return (
      <section>
        <div className="app-feedback app-feedback--error" role="alert">
          {errorMessage}
        </div>
      </section>
    );
  }

  return (
    <section>
      {banner ? (
        <div className="app-feedback app-feedback--empty" role="status">
          {banner.message}
        </div>
      ) : null}
      <DataTable
        title="Activos"
        primaryAction={
          <>
            <EscanearQrButton />
            {allowWrite ? (
              <RegisterButton label="Registrar activo" onClick={() => crud.openCreate()} />
            ) : null}
          </>
        }
        columns={ACTIVO_COLUMNS}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por nombre, marca, modelo, número de serie, empresa, categoría, sede, país o responsable"
        statusFilter={{
          key: 'estadoNombre',
          label: 'Estado',
          options: estadoOptions,
        }}
        filters={[
          { key: 'categoriaNombre', label: 'Categoría', options: categoriaOptions },
          { key: 'sedeNombre', label: 'Sede', options: sedeOptions },
        ]}
        initialFilters={estadoInicial ? { estadoNombre: estadoInicial } : undefined}
        emptyTitle="No hay activos"
        emptyDescription="Registre el primer activo."
        renderRowActions={(row) => (
          <RowIconActions
            actions={
              (allowWrite
                ? getAccionesDisponibles(row, ctx)
                : getAccionesDisponibles(row, ctx).filter(
                    (item) => item.key === 'view' || item.key === 'qr',
                  )
              ).filter((item) => item.key !== 'view')
            }
            onAction={(action) => handleAccion(action, row)}
          />
        )}
        onRowDoubleClick={(row) => navigate(`/app/activos/${row.id}`)}
      />

      {crud.isForm ? (
        <Suspense fallback={<RouteFallback />}>
          <ActivoFormOverlay
            open
            editing={crud.isEdit}
            record={crud.record}
            records={rows}
            categorias={categorias.data}
            proveedores={proveedores.data}
            paises={paises.data}
            ubicaciones={ubicaciones.data}
            sedes={sedes.data}
            idEmpresaActiva={idActiva}
            onClose={crud.close}
            onSave={async (payload) => {
              if (crud.isEdit) {
                await activoService.update(crud.record.id, payload);
              } else {
                await activoService.create(payload);
              }
              await refreshAll();
              return saveSuccessResult({ created: !crud.isEdit, entityLabel: 'activo' });
            }}
          />
        </Suspense>
      ) : null}

      {movimiento?.tipo === 'traslado' ? (
        <Suspense fallback={<RouteFallback />}>
          <TrasladoFormOverlay
            open
            prefill={movimiento?.tipo === 'traslado' ? { idActivo: movimiento.idActivo } : null}
            activos={rows}
            ubicaciones={ubicaciones.data}
            sedes={sedes.data}
            usuarioActual={usuario}
            asignaciones={asignaciones.data}
            tipos={tipos.data}
            idEmpresaActiva={idActiva}
            onClose={() => setMovimiento(null)}
            onSave={async (values) => {
              await trasladoService.registrar({
                idActivo: Number(values.idActivo),
                idUbicacionDestino: Number(values.idUbicacionDestino),
                idUsuario: usuario?.id,
                fecha: values.fecha,
                motivo: values.motivo,
              });
              await refreshAll();
              return saveSuccessResult({ created: true, entityLabel: 'traslado' });
            }}
          />
        </Suspense>
      ) : null}

      {movimiento?.tipo === 'mantenimiento' ? (
        <Suspense fallback={<RouteFallback />}>
          <MantenimientoFormOverlay
            open
            prefill={
              movimiento?.tipo === 'mantenimiento' ? { idActivo: movimiento.idActivo } : null
            }
            activos={rows}
            ubicaciones={ubicaciones.data}
            sedes={sedes.data}
            responsables={responsables.data}
            areas={areas.data}
            tiposMantenimiento={tiposMantenimiento.data}
            asignaciones={asignaciones.data}
            tipos={tipos.data}
            idEmpresaActiva={idActiva}
            onClose={() => setMovimiento(null)}
            onSave={async (values) => {
              await mantenimientoService.registrar({
                idActivo: Number(values.idActivo),
                idUsuario: usuario?.id,
                idResponsable: Number(values.idResponsable),
                fecha: values.fecha,
                observaciones: values.observaciones,
                idTipoMantenimiento: Number(values.idTipoMantenimiento),
                descripcionProblema: values.descripcionProblema,
              });
              await refreshAll();
              return saveSuccessResult({ created: true, entityLabel: 'mantenimiento' });
            }}
          />
        </Suspense>
      ) : null}

      {movimiento?.tipo === 'baja' ? (
        <Suspense fallback={<RouteFallback />}>
          <BajaFormOverlay
            open
            prefill={movimiento?.tipo === 'baja' ? { idActivo: movimiento.idActivo } : null}
            activos={rows}
            motivos={motivos.data}
            usuarios={usuarios.data}
            usuariosUnavailableReason={canReadUsuarios ? null : usuarioService.USUARIOS_SIN_LECTURA}
            permiteElegirAutorizador={canReadUsuarios}
            usuarioActual={usuario}
            asignaciones={asignaciones.data}
            tipos={tipos.data}
            idEmpresaActiva={idActiva}
            ubicaciones={ubicaciones.data}
            sedes={sedes.data}
            onClose={() => setMovimiento(null)}
            onSave={async (values) => {
              try {
                await bajaService.registrar({
                  idActivo: Number(values.idActivo),
                  idUsuario: usuario?.id,
                  idMotivoBaja: Number(values.idMotivoBaja),
                  idAutorizadoPor: Number(values.idAutorizadoPor),
                  fecha: values.fecha,
                  observaciones: values.observaciones,
                  firmaEntrega: values.firmaEntrega,
                  firmaRecibe: values.firmaRecibe,
                });
                await refreshAll();
                return saveSuccessResult({ created: true, entityLabel: 'baja' });
              } catch (error) {
                if (error.response?.status === 409 || error.status === 409) {
                  setBanner({ message: error.message, variant: 'error' });
                }
                throw error;
              }
            }}
          />
        </Suspense>
      ) : null}
    </section>
  );
}
