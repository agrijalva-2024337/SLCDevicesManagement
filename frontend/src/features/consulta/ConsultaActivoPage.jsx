import { useCallback } from 'react';
import { Link, useParams } from 'react-router';
import { ConsultaShell } from '@/features/consulta/ConsultaShell';
import * as consultaPublicaService from '@/features/consulta/consultaPublicaService';
import { DetailField } from '@/shared/components/DetailOverlay';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { detailQueryKey } from '@/shared/data/queryKeys';
import { useResource } from '@/shared/hooks/useResource';
import { formatDate } from '@/shared/utils/format';

function estadoTone(nombre) {
  const key = String(nombre ?? '').toLowerCase();
  if (key.includes('baja')) return 'danger';
  if (key.includes('mantenimiento')) return 'warning';
  if (key.includes('asignado')) return 'info';
  if (key.includes('disponible')) return 'success';
  return 'muted';
}

export function ConsultaActivoPage() {
  const { codigo } = useParams();
  const load = useCallback(() => consultaPublicaService.getFichaPublica(codigo), [codigo]);
  const { data, isLoading, errorMessage } = useResource(load, {
    key: detailQueryKey('consulta', codigo),
    initialData: null,
  });
  const ficha = data?.nombre ? data : null;

  return (
    <ConsultaShell>
      {isLoading ? (
        <>
          <h1 className="consulta-title">Buscando activo…</h1>
          <p className="consulta-lead">Un momento.</p>
        </>
      ) : errorMessage ? (
        <>
          <h1 className="consulta-title">No encontrado</h1>
          <p className="consulta-lead">{errorMessage}</p>
        </>
      ) : ficha ? (
        <>
          <h1 className="consulta-title">{ficha.nombre}</h1>
          <p className="consulta-lead">Datos públicos del equipo. No se muestra costo, factura ni historial.</p>

          <div className="consulta-card">
            <div className="app-fields-plain consulta-grid">
              <DetailField label="Código interno" value={ficha.codigoInterno} />
              <DetailField label="Serie" value={ficha.numeroSerie} />
              <DetailField
                label="Estado"
                value={ficha.estado ? <ToneBadge tone={estadoTone(ficha.estado)}>{ficha.estado}</ToneBadge> : null}
              />
              <DetailField label="Categoría" value={ficha.categoria} />
              <DetailField
                label="Marca / modelo"
                value={[ficha.marca, ficha.modelo].filter(Boolean).join(' ')}
              />
              <DetailField label="Empresa" value={ficha.empresa} />
              <DetailField label="Sede" value={ficha.sede} />
              <DetailField label="Ubicación" value={ficha.ubicacion} />
              <DetailField label="Área" value={ficha.area} />
              <DetailField label="Responsable" value={ficha.responsable} />
              <DetailField label="Garantía hasta" value={formatDate(ficha.garantiaHasta)} />
              <div className="sm:col-span-2">
                <DetailField label="Descripción" value={ficha.descripcion} />
              </div>
            </div>
          </div>
        </>
      ) : null}

      <p className="consulta-links">
        <Link to="/escanear">Escanear otro QR</Link>
        <Link to="/app">Entrar al inventario</Link>
      </p>
    </ConsultaShell>
  );
}
