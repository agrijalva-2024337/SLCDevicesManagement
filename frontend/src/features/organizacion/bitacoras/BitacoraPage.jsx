import { useCallback, useMemo } from 'react';
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

export function BitacoraPage() {
  const load = useCallback(() => bitacoraService.getAll(), []);
  const { rows, isLoading, errorMessage } = useCatalogCollection(load);
  const usuarios = useResource(usuarioService.getAll);

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        usuarioNombre: usuarioNombre(byId(usuarios.data, row.idUsuario)),
        tipoLabel: TIPO_LABEL[row.tipoOperacion] ?? String(row.tipoOperacion),
        fechaDia: String(row.fechaHora ?? '').slice(0, 10),
      })),
    [rows, usuarios.data],
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
        title="Bitácora"
        description="Solo lectura. Auditoría escrita por el interceptor del backend. No hay alta ni edición desde esta pantalla."
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
        emptyTitle="No hay movimientos"
        emptyDescription="Cuando el backend registre escrituras, aparecerán aquí."
        defaultSortKey="fechaHora"
        defaultSortDirection="desc"
      />
    </section>
  );
}
