import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import * as historicoInventarioService from '@/features/inventario/historicoInventarioService';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DataTable } from '@/shared/components/DataTable';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDate } from '@/shared/utils/format';

function hydrate(row, sedes) {
  const sede = byId(sedes, row.idSede);
  return {
    ...row,
    sedeNombre: sede?.nombre ?? `Sede #${row.idSede}`,
    abierta: !row.cerrado,
  };
}

export function JornadasPage() {
  const navigate = useNavigate();
  const { idActiva } = useEmpresaActiva();
  const load = useCallback(
    () => historicoInventarioService.listar({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );
  const { rows, isLoading, errorMessage } = useCatalogCollection(load);
  const sedes = useResource(sedeService.getAll);

  const tableRows = useMemo(() => rows.map((row) => hydrate(row, sedes.data)), [rows, sedes.data]);

  const columns = useMemo(
    () => [
      { key: 'sedeNombre', header: 'Sede', primary: true },
      { key: 'responsable', header: 'Responsable' },
      {
        key: 'fechaInicio',
        header: 'Inicio',
        numeric: true,
        getValue: (row) => formatDate(row.fechaInicio),
        sortValue: (row) => row.fechaInicio,
      },
      {
        key: 'fechaCierre',
        header: 'Cierre',
        numeric: true,
        getValue: (row) => formatDate(row.fechaCierre),
        sortValue: (row) => row.fechaCierre,
      },
      {
        key: 'abierta',
        header: 'Estado',
        type: 'status',
        activeLabel: 'Abierta',
        inactiveLabel: 'Cerrada',
      },
    ],
    [],
  );

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
      <DataTable
        title="Inventario físico"
        description="Jornadas de conteo por sede. La ubicación es agrupación de la hoja de trabajo, no un filtro del servidor."
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por sede o responsable"
        statusFilter={{
          key: 'abierta',
          label: 'Estado',
          options: [
            { value: 'all', label: 'Todas' },
            { value: 'true', label: 'Abiertas' },
            { value: 'false', label: 'Cerradas' },
          ],
        }}
        emptyTitle="No hay jornadas"
        emptyDescription="Abra la primera jornada de inventario físico."
        getRowActions={(row) => ({
          view: { onClick: () => navigate(`/app/inventario-fisico/${row.id}`) },
        })}
      />
    </section>
  );
}
