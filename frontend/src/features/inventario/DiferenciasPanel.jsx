import { useEffect, useMemo, useState } from 'react';
import * as historicoInventarioService from '@/features/inventario/historicoInventarioService';
import { TIPO_DIFERENCIA_LABEL, TIPO_DIFERENCIA_TONE } from '@/features/inventario/tipoDiferencia';
import { DataTable } from '@/shared/components/DataTable';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

export function DiferenciasPanel({ jornadaId, cerrado, refreshKey }) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (jornadaId == null) return;
      setIsLoading(true);
      try {
        const next = await historicoInventarioService.diferencias(jornadaId);
        if (cancelled) return;
        setRows(
          (next ?? []).map((item) => ({
            ...item,
            id: `${item.idActivo}-${item.tipoDiferencia}`,
            tipoLabel: TIPO_DIFERENCIA_LABEL[item.tipoDiferencia] ?? item.tipoDiferencia,
          })),
        );
        setErrorMessage(null);
      } catch (error) {
        if (!cancelled) setErrorMessage(getErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jornadaId, refreshKey]);

  const columns = useMemo(
    () => [
      { key: 'nombreActivo', header: 'Activo', primary: true },
      {
        key: 'tipoLabel',
        header: 'Tipo',
        type: 'badge',
        tone: (row) => TIPO_DIFERENCIA_TONE[row.tipoDiferencia] ?? 'muted',
      },
      { key: 'observaciones', header: 'Observaciones' },
    ],
    [],
  );

  if (errorMessage) {
    return (
      <div className="app-feedback app-feedback--error mt-6" role="alert">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <DataTable
        title="Diferencias"
        description={
          cerrado
            ? 'Reporte definitivo de la jornada cerrada.'
            : 'Vista parcial. El reporte queda definitivo al cerrar la jornada.'
        }
        columns={columns}
        rows={rows}
        loading={isLoading}
        searchPlaceholder="Buscar por activo o tipo"
        emptyTitle="Sin diferencias"
        emptyDescription={
          cerrado
            ? 'El conteo coincidió con los activos esperados de la sede.'
            : 'Todavía no hay faltantes, no encontrados ni mal estado.'
        }
      />
    </div>
  );
}
