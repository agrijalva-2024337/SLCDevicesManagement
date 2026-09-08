import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import * as bitacoraService from '@/features/organizacion/bitacoras/bitacoraService';
import { filterRowsByEmpresa, useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as usuarioService from '@/features/organizacion/usuarios/usuarioService';
import { TipoOperacionBitacora } from '@/shared/api/contracts';
import { snapshotEntries } from '@/features/organizacion/bitacoras/bitacoraSnapshot';
import { DataTable } from '@/shared/components/DataTable';
import { DetailField } from '@/shared/components/DetailOverlay';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDateTime } from '@/shared/utils/format';
import '@/features/organizacion/bitacoras/bitacora.css';

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

function BitacoraSnapshot({ label, value }) {
  const entries = snapshotEntries(value);
  return (
    <article className="bitacora-snap">
      <p className="bitacora-snap-label">{label}</p>
      {entries.length === 0 ? (
        <p className="bitacora-snap-empty">Sin registro</p>
      ) : (
        <dl className="bitacora-snap-list">
          {entries.map(([key, item]) => (
            <div key={key} className="bitacora-snap-row">
              <dt>{key}</dt>
              <dd>{item}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

export function BitacoraPage() {
  const { canWrite } = useAuth();
  const canReadUsuarios = canWrite('usuarios');
  const { idActiva } = useEmpresaActiva();
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
  const loadUsuarios = useCallback(() => usuarioService.getAllIfAllowed(canReadUsuarios), [canReadUsuarios]);
  const usuarios = useResource(loadUsuarios);

  const usuariosDeEmpresa = useMemo(
    () => filterRowsByEmpresa(usuarios.data, idActiva),
    [idActiva, usuarios.data],
  );

  const tableRows = useMemo(() => {
    const mapped = rows.map((row) => ({
      ...row,
      usuarioNombre: usuarioNombre(byId(usuarios.data, row.idUsuario)),
      tipoLabel: TIPO_LABEL[row.tipoOperacion] ?? String(row.tipoOperacion),
      fechaDia: diaDe(row.fechaHora),
    }));

    const scoped =
      idActiva == null || idActiva === ''
        ? mapped
        : mapped.filter((row) => {
            const usuario = byId(usuarios.data, row.idUsuario);
            return usuario != null && Number(usuario.idEmpresa) === Number(idActiva);
          });

    return scoped.filter((row) => {
      if (fechaDesde && row.fechaDia && row.fechaDia < fechaDesde) return false;
      if (fechaHasta && row.fechaDia && row.fechaDia > fechaHasta) return false;
      return true;
    });
  }, [fechaDesde, fechaHasta, idActiva, rows, usuarios.data]);

  const usuarioOptions = useMemo(
    () => [
      { value: 'all', label: canReadUsuarios ? 'Todos los usuarios' : 'Listado de usuarios no disponible' },
      ...(usuariosDeEmpresa ?? []).map((item) => ({
        value: String(item.id),
        label: usuarioNombre(item),
      })),
    ],
    [canReadUsuarios, usuariosDeEmpresa],
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
            disabled={!canReadUsuarios}
            title={canReadUsuarios ? undefined : usuarioService.USUARIOS_SIN_LECTURA}
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
        expandable
        renderExpandedContent={(row) => (
          <div className="bitacora-diff">
            <BitacoraSnapshot label="Antes" value={row.informacionAnterior} />
            <BitacoraSnapshot label="Después" value={row.informacionNueva} />
            <div className="bitacora-diff-note">
              <DetailField label="Descripción" value={row.descripcion} />
            </div>
          </div>
        )}
      />
    </section>
  );
}
