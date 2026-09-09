import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import * as categoriaService from '@/features/catalogos/categorias/categoriaService';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as reporteService from '@/features/reportes/reporteService';
import { ESTADO_OPERATIVO, ESTADO_OPERATIVO_LABEL, ESTADO_OPERATIVO_TONE } from '@/shared/api/contracts';
import { DataTable } from '@/shared/components/DataTable';
import { PageHeader } from '@/shared/components/PageHeader';
import { reportQueryKey } from '@/shared/data/queryKeys';
import { useResource } from '@/shared/hooks/useResource';
import { formatMoney } from '@/shared/utils/format';

const TAKE = 100;

const ESTADO_FILTRO = [
  { value: '', label: 'Todos' },
  ...Object.values(ESTADO_OPERATIVO).map((value) => ({
    value,
    label: ESTADO_OPERATIVO_LABEL[value],
  })),
];

export function ActivosReportePage() {
  const [params] = useSearchParams();
  const { idActiva } = useEmpresaActiva();
  const [skip, setSkip] = useState(0);
  const [estado, setEstado] = useState(params.get('estado') ?? '');
  const [idSede, setIdSede] = useState(params.get('idSede') ?? '');
  const [idCategoriaActivo, setIdCategoriaActivo] = useState(params.get('idCategoriaActivo') ?? '');
  const [idResponsable, setIdResponsable] = useState(params.get('idResponsable') ?? '');

  const sedes = useResource(sedeService.getAll);
  const categorias = useResource(categoriaService.getAll);
  const responsables = useResource(responsableService.getAll);
  const sedesEmpresa = useMemo(() => {
    if (idActiva == null || idActiva === '') return sedes.data ?? [];
    return (sedes.data ?? []).filter((sede) => Number(sede.idEmpresa) === Number(idActiva));
  }, [idActiva, sedes.data]);
  const [empresaVista, setEmpresaVista] = useState(idActiva);
  if (empresaVista !== idActiva) {
    setEmpresaVista(idActiva);
    setSkip(0);
  }

  const reportParams = useMemo(
    () => ({
      estado: estado || undefined,
      idEmpresa: idActiva || undefined,
      idSede: idSede || undefined,
      idCategoriaActivo: idCategoriaActivo || undefined,
      idResponsable: idResponsable || undefined,
      skip,
      take: TAKE,
    }),
    [estado, idActiva, idCategoriaActivo, idResponsable, idSede, skip],
  );
  const load = useCallback(() => reporteService.activos(reportParams), [reportParams]);
  const { data, isLoading, errorMessage } = useResource(load, {
    key: reportQueryKey('activos', reportParams),
  });
  const tieneMas = (data?.length ?? 0) === TAKE;

  const rows = useMemo(
    () =>
      (data ?? []).map((row) => ({
        id: row.activo?.id,
        nombre: row.activo?.nombre,
        marca: row.activo?.marca,
        numeroSerie: row.activo?.numeroSerie,
        costoAdquisicion: row.activo?.costoAdquisicion,
        estadoOperativo: row.estadoOperativo,
        estadoLabel: ESTADO_OPERATIVO_LABEL[row.estadoOperativo] ?? row.estadoOperativo,
        estadoTone: ESTADO_OPERATIVO_TONE[row.estadoOperativo] ?? 'muted',
        nombreSede: row.nombreSede,
      })),
    [data],
  );

  function cambiarFiltro(setter) {
    return (event) => {
      setter(event.target.value);
      setSkip(0);
    };
  }

  return (
    <section>
      <PageHeader
        title="Activos detallados"
        description="Listado paginado de activos con filtros de estado, sede, categoría y responsable."
        actions={
          <Link to="/app/reportes" className="app-btn app-btn--ghost">
            Volver a reportes
          </Link>
        }
      />

      {errorMessage ? (
        <div className="app-feedback app-feedback--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="app-panel mb-4 flex flex-wrap gap-3">
        <label className="grid gap-1 text-sm">
          Estado
          <select className="app-input" value={estado} onChange={cambiarFiltro(setEstado)}>
            {ESTADO_FILTRO.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Sede
          <select className="app-input" value={idSede} onChange={cambiarFiltro(setIdSede)}>
            <option value="">Todas</option>
            {sedesEmpresa.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Categoría
          <select className="app-input" value={idCategoriaActivo} onChange={cambiarFiltro(setIdCategoriaActivo)}>
            <option value="">Todas</option>
            {(categorias.data ?? []).map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Responsable
          <select className="app-input" value={idResponsable} onChange={cambiarFiltro(setIdResponsable)}>
            <option value="">Todos</option>
            {(responsables.data ?? []).map((responsable) => (
              <option key={responsable.id} value={responsable.id}>
                {responsable.nombreCompleto}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataTable
        title="Resultado"
        description={`Filas ${skip + 1}–${skip + (rows.length || 0)}.`}
        columns={[
          { key: 'nombre', header: 'Activo', primary: true },
          { key: 'numeroSerie', header: 'Serie', mono: true },
          { key: 'nombreSede', header: 'Sede' },
          {
            key: 'estadoLabel',
            header: 'Estado',
            type: 'badge',
            tone: (row) => row.estadoTone,
          },
          {
            key: 'costoAdquisicion',
            header: 'Costo',
            numeric: true,
            getValue: (row) => formatMoney(row.costoAdquisicion, 'GTQ'),
          },
        ]}
        rows={rows}
        loading={isLoading}
        hideToolbar
        emptyTitle="Sin activos"
        emptyDescription="Pruebe otro filtro o página."
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="app-btn app-btn--ghost"
          disabled={skip === 0}
          onClick={() => setSkip((value) => Math.max(0, value - TAKE))}
        >
          Anterior
        </button>
        <button
          type="button"
          className="app-btn app-btn--primary"
          disabled={!tieneMas}
          onClick={() => setSkip((value) => value + TAKE)}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
