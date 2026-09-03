import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { ActivoFichaOverlay } from '@/features/activos/ActivoFichaOverlay';
import * as activoService from '@/features/activos/activoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import { TrasladoFormOverlay } from '@/features/inventario/TrasladoFormOverlay';
import * as trasladoService from '@/features/inventario/trasladoService';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';
import { MantenimientoFormOverlay } from '@/features/mantenimientos/MantenimientoFormOverlay';
import * as mantenimientoService from '@/features/mantenimientos/mantenimientoService';
import { DataTable } from '@/shared/components/DataTable';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { useResource } from '@/shared/hooks/useResource';
import { byId } from '@/shared/utils/format';

export function ActivosPage() {
  const { canWrite, usuario } = useAuth();
  const allowWrite = canWrite('activos');
  const { idActiva } = useEmpresaActiva();
  const load = useCallback(() => activoService.getAll(), []);
  const { rows, isLoading, errorMessage, banner, setBanner, reload } = useCatalogCollection(load);
  const ficha = useCrudOverlay();
  const [movimiento, setMovimiento] = useState(null);
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);
  const estados = useResource(estadoService.getAll);
  const responsables = useResource(responsableService.getAll);
  const tipos = useResource(tipoAsignacionService.getAll);
  const asignaciones = useResource(asignacionService.getAll);

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        ubicacionNombre: nombreUbicacion(byId(ubicaciones.data, row.idUbicacion)),
      })),
    [rows, ubicaciones.data],
  );

  async function refreshAll() {
    await Promise.all([reload(), asignaciones.reload(), ubicaciones.reload()]);
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
        description="Ficha con ubicación, acciones de traslado y mantenimiento, y línea de tiempo."
        columns={[
          { key: 'nombre', header: 'Nombre', primary: true },
          { key: 'numeroSerie', header: 'Serie', mono: true },
          { key: 'marca', header: 'Marca' },
          { key: 'ubicacionNombre', header: 'Ubicación' },
        ]}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por nombre, serie o marca"
        emptyTitle="No hay activos"
        emptyDescription="Los activos aparecerán aquí cuando existan en inventario."
        getRowActions={(row) => ({
          view: { onClick: () => ficha.openView(row) },
        })}
      />

      <ActivoFichaOverlay
        open={ficha.isView}
        activo={ficha.record}
        ubicaciones={ubicaciones.data}
        asignaciones={asignaciones.data}
        tipos={tipos.data}
        estados={estados.data}
        canWrite={allowWrite}
        onClose={ficha.close}
        onTrasladar={(activo) => setMovimiento({ tipo: 'traslado', idActivo: activo.id })}
        onMantenimiento={(activo) => setMovimiento({ tipo: 'mantenimiento', idActivo: activo.id })}
      />

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
          ficha.openView(await activoService.getById(values.idActivo));
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
          ficha.openView(await activoService.getById(values.idActivo));
        }}
      />
    </section>
  );
}
