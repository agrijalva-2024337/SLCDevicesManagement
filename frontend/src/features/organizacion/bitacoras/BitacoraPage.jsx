import { useCallback, useMemo, useState } from 'react';
import * as bitacoraService from '@/features/organizacion/bitacoras/bitacoraService';
import * as usuarioService from '@/features/organizacion/usuarios/usuarioService';
import { TipoOperacionBitacora } from '@/shared/api/contracts';
import { DataTable } from '@/shared/components/DataTable';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDateTime } from '@/shared/utils/format';

const TIPO_LABEL = {
  [TipoOperacionBitacora.Creacion]: 'Creación',
  [TipoOperacionBitacora.Modificacion]: 'Modificación',
  [TipoOperacionBitacora.Eliminacion]: 'Eliminación',
};

function tipoTone(tipo) {
  if (Number(tipo) === TipoOperacionBitacora.Eliminacion) return 'danger';
  if (Number(tipo) === TipoOperacionBitacora.Modificacion) return 'warning';
  return 'info';
}

function usuarioNombre(usuario) {
  if (!usuario) return '—';
  return [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ') || usuario.correo || '—';
}

function diaDe(fechaHora) {
  return String(fechaHora ?? '').slice(0, 10);
}

export function BitacoraPage() {
  const [idUsuario, setIdUsuario] = useState('all');
  const [entidadAfectada, setEntidadAfectada] = useState('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const load = useCallback(
    () =>
      bitacoraService.getAll({
        idUsuario: idUsuario === 'all' ? undefined : Number(idUsuario),
        entidadAfectada: entidadAfectada === 'all' ? undefined : entidadAfectada,
      }),
    [entidadAfectada, idUsuario],
  );
  const { rows, isLoading, errorMessage } = useCatalogCollection(load);
  const usuarios = useResource(usuarioService.getAll);

  const tableRows = useMemo(() => {
    const mapped = rows.map((row) => ({
      ...row,
      usuarioNombre: usuarioNombre(byId(usuarios.data, row.idUsuario)),
      tipoLabel: TIPO_LABEL[row.tipoOperacion] ?? String(row.tipoOperacion),
      fechaDia: diaDe(row.fechaHora),
    }));

    return mapped.filter((row) => {
      if (fechaDesde && row.fechaDia && row.fechaDia < fechaDesde) return false;
      if (fechaHasta && row.fechaDia && row.fechaDia > fechaHasta) return false;
      return true;
    });
  }, [fechaDesde, fechaHasta, rows, usuarios.data]);

  const usuarioOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos los usuarios' },
      ...(usuarios.data ?? []).map((item) => ({
        value: String(item.id),
        label: usuarioNombre(item),
      })),
    ],
    [usuarios.data],
  );

  const entidadOptions = useMemo(() => {
    const names = [...new Set((rows ?? []).map((row) => row.entidadAfectada).filter(Boolean))];
    if (entidadAfectada !== 'all' && !names.includes(entidadAfectada)) {
      names.unshift(entidadAfectada);
    }
    return [{ value: 'all', label: 'Todas las entidades' }, ...names.map((name) => ({ value: name, label: name }))];
  }, [entidadAfectada, rows]);

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
      <div className="data-table-toolbar mb-3">
        <div className="data-table-filter">
          <label className="data-table-sr" htmlFor="bitacora-usuario">
            Usuario
          </label>
          <select
            id="bitacora-usuario"
            className="app-input"
            value={idUsuario}
            onChange={(event) => setIdUsuario(event.target.value)}
          >
            {usuarioOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="data-table-filter">
          <label className="data-table-sr" htmlFor="bitacora-entidad">
            Entidad
          </label>
          <select
            id="bitacora-entidad"
            className="app-input"
            value={entidadAfectada}
            onChange={(event) => setEntidadAfectada(event.target.value)}
          >
            {entidadOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="data-table-filter">
          <label className="data-table-sr" htmlFor="bitacora-desde">
            Desde
          </label>
          <input
            id="bitacora-desde"
            type="date"
            className="app-input"
            value={fechaDesde}
            onChange={(event) => setFechaDesde(event.target.value)}
          />
        </div>
        <div className="data-table-filter">
          <label className="data-table-sr" htmlFor="bitacora-hasta">
            Hasta
          </label>
          <input
            id="bitacora-hasta"
            type="date"
            className="app-input"
            value={fechaHasta}
            onChange={(event) => setFechaHasta(event.target.value)}
          />
        </div>
      </div>
      <DataTable
        title="Bitácora"
        description="Solo lectura. Auditoría escrita por el interceptor del backend. Usuario y entidad van al GET; fecha y tipo se filtran en cliente."
        columns={[
          {
            key: 'fechaHora',
            header: 'Fecha',
            numeric: true,
            getValue: (row) => formatDateTime(row.fechaHora),
            sortValue: (row) => row.fechaHora,
          },
          { key: 'usuarioNombre', header: 'Usuario' },
          {
            key: 'tipoLabel',
            header: 'Tipo',
            type: 'badge',
            tone: (row) => tipoTone(row.tipoOperacion),
          },
          { key: 'entidadAfectada', header: 'Entidad' },
        ]}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por usuario, entidad o tipo"
        filters={[
          {
            key: 'tipoOperacion',
            label: 'Tipo',
            options: [
              { value: 'all', label: 'Todos los tipos' },
              { value: String(TipoOperacionBitacora.Creacion), label: 'Creación' },
              { value: String(TipoOperacionBitacora.Modificacion), label: 'Modificación' },
              { value: String(TipoOperacionBitacora.Eliminacion), label: 'Eliminación' },
            ],
          },
        ]}
        emptyTitle="No hay movimientos"
        emptyDescription="Cuando el backend registre escrituras, aparecerán aquí."
        defaultSortKey="fechaHora"
        defaultSortDirection="desc"
      />
    </section>
  );
}
