import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { ActivoFichaOverlay } from '@/features/activos/ActivoFichaOverlay';
import { ActivoFormOverlay } from '@/features/activos/ActivoFormOverlay';
import {
  asignacionActivaDe,
  estadoNombreDeActivo,
  getAccionesDisponibles,
} from '@/features/activos/activoAcciones';
import * as activoService from '@/features/activos/activoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as categoriaService from '@/features/catalogos/categorias/categoriaService';
import * as proveedorService from '@/features/catalogos/proveedores/proveedorService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { TrasladoFormOverlay } from '@/features/inventario/TrasladoFormOverlay';
import { empresaIdDeActivo, nombreUbicacion } from '@/features/inventario/trasladoRuta';
import * as trasladoService from '@/features/inventario/trasladoService';
import { MantenimientoFormOverlay } from '@/features/mantenimientos/MantenimientoFormOverlay';
import * as mantenimientoService from '@/features/mantenimientos/mantenimientoService';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import { DataTable } from '@/shared/components/DataTable';
import { RegisterButton } from '@/shared/components/RecordActions';
import { RowIconActions } from '@/shared/components/RowIconActions';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { useRecordDeepLink } from '@/shared/hooks/useRecordDeepLink';
import { useResource } from '@/shared/hooks/useResource';
import { byId } from '@/shared/utils/format';

function estadoTone(nombre) {
  const key = String(nombre ?? '').toLowerCase();
  if (key.includes('baja')) return 'danger';
  if (key.includes('mantenimiento')) return 'warning';
  if (key.includes('asignado')) return 'info';
  if (key.includes('disponible')) return 'success';
  return 'muted';
}

export function ActivosPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { canWrite, usuario } = useAuth();
  const allowWrite = canWrite('activos');
  const { idActiva, empresas } = useEmpresaActiva();
  const load = useCallback(() => activoService.getAll(), []);
  const { rows, isLoading, errorMessage, banner, setBanner, reload } = useCatalogCollection(load);
  const crud = useCrudOverlay();
  const [movimiento, setMovimiento] = useState(null);
  const categorias = useResource(categoriaService.getAll);
  const proveedores = useResource(proveedorService.getAll);
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);
  const estados = useResource(estadoService.getAll);
  const responsables = useResource(responsableService.getAll);
  const tipos = useResource(tipoAsignacionService.getAll);
  const asignaciones = useResource(asignacionService.getAll);

  const ctx = useMemo(
    () => ({ asignaciones: asignaciones.data, tipos: tipos.data, estados: estados.data }),
    [asignaciones.data, estados.data, tipos.data],
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
        const vigente = asignacionActivaDe(row, asignaciones.data);
        return {
          ...row,
          codigo: row.numeroSerie || String(row.id),
          categoriaNombre: byId(categorias.data, row.idCategoriaActivo)?.nombre ?? '—',
          ubicacionNombre: nombreUbicacion(byId(ubicaciones.data, row.idUbicacion)),
          responsableNombre: vigente
            ? (byId(responsables.data, vigente.idResponsable)?.nombreCompleto ?? '—')
            : '—',
          estadoNombre: estadoNombreDeActivo(row, ctx) ?? 'Disponible',
        };
      }),
    [asignaciones.data, categorias.data, ctx, responsables.data, scopedRows, ubicaciones.data],
  );

  useRecordDeepLink(tableRows, crud.openView);

  const estadoInicial = params.get('estado');
  const estadoOptions = useMemo(() => {
    const names = [...new Set(tableRows.map((row) => row.estadoNombre).filter(Boolean))];
    return [{ value: 'all', label: 'Todos' }, ...names.map((name) => ({ value: name, label: name }))];
  }, [tableRows]);

  async function refreshAll() {
    await Promise.all([reload(), asignaciones.reload(), ubicaciones.reload()]);
  }

  function handleAccion(action, activo) {
    if (action.key === 'view') {
      crud.openView(activo);
      return;
    }
    if (action.key === 'edit') {
      crud.openEdit(activo);
      return;
    }
    if (action.key === 'assign') {
      navigate('/app/asignaciones', { state: { idActivo: activo.id } });
      return;
    }
    if (action.key === 'transfer') {
      setMovimiento({ tipo: 'traslado', idActivo: activo.id });
      return;
    }
    if (action.key === 'maintenance') {
      setMovimiento({ tipo: 'mantenimiento', idActivo: activo.id });
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
        description="Parque tecnológico. Empresa y sede se leen de la ubicación. Use ?estado= para el drill-down."
        primaryAction={
          allowWrite ? <RegisterButton label="Registrar activo" onClick={() => crud.openCreate()} /> : null
        }
        columns={[
          { key: 'codigo', header: 'Código', primary: true },
          { key: 'nombre', header: 'Descripción' },
          { key: 'categoriaNombre', header: 'Categoría' },
          { key: 'ubicacionNombre', header: 'Ubicación' },
          { key: 'responsableNombre', header: 'Responsable' },
          {
            key: 'estadoNombre',
            header: 'Estado',
            type: 'badge',
            tone: (row) => estadoTone(row.estadoNombre),
          },
        ]}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por código, descripción, categoría o responsable"
        statusFilter={{
          key: 'estadoNombre',
          label: 'Estado',
          options: estadoOptions,
        }}
        initialFilters={estadoInicial ? { estadoNombre: estadoInicial } : undefined}
        emptyTitle="No hay activos"
        emptyDescription="Registre el primer activo para armar el parque."
        expandable
        renderRowActions={(row) => (
          <RowIconActions
            actions={
              allowWrite
                ? getAccionesDisponibles(row, ctx)
                : getAccionesDisponibles(row, ctx).filter((item) => item.key === 'view')
            }
            onAction={(action) => handleAccion(action, row)}
          />
        )}
      />

      <ActivoFichaOverlay
        open={crud.isView}
        activo={crud.record}
        categorias={categorias.data}
        proveedores={proveedores.data}
        ubicaciones={ubicaciones.data}
        sedes={sedes.data}
        empresas={empresas}
        asignaciones={asignaciones.data}
        tipos={tipos.data}
        estados={estados.data}
        canWrite={allowWrite}
        onClose={crud.close}
        onEditar={(activo) => crud.openEdit(activo)}
        onAsignar={(activo) => navigate('/app/asignaciones', { state: { idActivo: activo.id } })}
        onTrasladar={(activo) => setMovimiento({ tipo: 'traslado', idActivo: activo.id })}
        onMantenimiento={(activo) => setMovimiento({ tipo: 'mantenimiento', idActivo: activo.id })}
      />

      {crud.isForm ? (
        <ActivoFormOverlay
          open
          editing={crud.isEdit}
          record={crud.record}
          categorias={categorias.data}
          proveedores={proveedores.data}
          ubicaciones={ubicaciones.data}
          sedes={sedes.data}
          idEmpresaActiva={idActiva}
          onClose={crud.close}
          onSave={async (payload) => {
            const saved = crud.isEdit
              ? await activoService.update(crud.record.id, payload)
              : await activoService.create(payload);
            setBanner({
              message: crud.isEdit ? 'Activo actualizado.' : 'Activo registrado.',
            });
            await refreshAll();
            crud.openView(await activoService.getById(saved.id ?? crud.record.id));
          }}
        />
      ) : null}

      <TrasladoFormOverlay
        open={movimiento?.tipo === 'traslado'}
        prefill={movimiento?.tipo === 'traslado' ? { idActivo: movimiento.idActivo } : null}
        activos={rows}
        ubicaciones={ubicaciones.data}
        sedes={sedes.data}
        responsables={responsables.data}
        asignaciones={asignaciones.data}
        tipos={tipos.data}
        idEmpresaActiva={idActiva}
        onClose={() => setMovimiento(null)}
        onSave={async (values) => {
          await trasladoService.registrar({
            idActivo: Number(values.idActivo),
            idUbicacionDestino: Number(values.idUbicacionDestino),
            idUsuario: usuario?.id,
            idResponsable: Number(values.idResponsable),
            fecha: values.fecha,
            observaciones: values.observaciones,
          });
          setBanner({ message: 'Traslado registrado desde la ficha.' });
          setMovimiento(null);
          await refreshAll();
          crud.openView(await activoService.getById(values.idActivo));
        }}
      />

      <MantenimientoFormOverlay
        open={movimiento?.tipo === 'mantenimiento'}
        prefill={movimiento?.tipo === 'mantenimiento' ? { idActivo: movimiento.idActivo } : null}
        activos={rows}
        ubicaciones={ubicaciones.data}
        sedes={sedes.data}
        responsables={responsables.data}
        asignaciones={asignaciones.data}
        tipos={tipos.data}
        onClose={() => setMovimiento(null)}
        onSave={async (values) => {
          await mantenimientoService.registrar({
            idActivo: Number(values.idActivo),
            idUsuario: usuario?.id,
            idResponsable: Number(values.idResponsable),
            fecha: values.fecha,
            observaciones: values.observaciones,
          });
          setBanner({ message: 'Mantenimiento abierto desde la ficha.' });
          setMovimiento(null);
          await refreshAll();
          crud.openView(await activoService.getById(values.idActivo));
        }}
      />
    </section>
  );
}
