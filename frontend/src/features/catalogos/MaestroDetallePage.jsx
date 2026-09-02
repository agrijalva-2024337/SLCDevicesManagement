import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { getMaestro } from '@/features/catalogos/maestros';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { EditRecordButton } from '@/shared/components/RecordActions';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

export function MaestroDetallePage() {
  const { slug, id } = useParams();
  const { canWrite } = useAuth();
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const maestro = getMaestro(slug);
  const close = () => navigate(`/app/catalogos/${slug}`);

  const [item, setItem] = useState(() => outlet.rows?.find((row) => String(row.id) === String(id)) ?? null);
  const [loadError, setLoadError] = useState(null);
  const [ready, setReady] = useState(Boolean(item));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!maestro) {
        return;
      }

      const fromRows = outlet.rows?.find((row) => String(row.id) === String(id));
      if (fromRows) {
        setItem(fromRows);
        setLoadError(null);
        setReady(true);
        return;
      }

      try {
        const found = await maestro.service.getById(id);
        if (!cancelled) {
          setItem(found);
          setLoadError(null);
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setItem(null);
          setLoadError(getErrorMessage(error));
          setReady(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, maestro, outlet.rows]);

  if (!maestro || (ready && !item)) {
    return (
      <DetailOverlay open title="Registro no encontrado" kicker="Ficha" onClose={close}>
        <p className="text-base text-navy">
          {loadError ?? 'El registro no existe o fue retirado del catálogo.'}
        </p>
      </DetailOverlay>
    );
  }

  if (!ready) {
    return (
      <DetailOverlay open title={maestro.title} kicker={maestro.kicker} onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  return (
    <DetailOverlay
      open
      title={maestro.titleOf(item)}
      kicker={maestro.kicker}
      badge={maestro.hasHabilitado === false ? null : <StatusBadge active={item.habilitado} />}
      onClose={close}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {maestro.detail(item, outlet.lookups ?? {}).map((field) => (
          <DetailField key={field.label} label={field.label} value={field.value} />
        ))}
        {item.fechaCreacion ? (
          <DetailField label="Alta en el sistema" value={formatDate(item.fechaCreacion)} />
        ) : null}
        {item.fechaModificacion ? (
          <DetailField label="Última modificación" value={formatDate(item.fechaModificacion)} />
        ) : null}
      </div>
      {canWrite(slug) ? (
        <div className="flex flex-wrap gap-3">
          <EditRecordButton to={`/app/catalogos/${slug}/${item.id}/editar`} />
        </div>
      ) : null}
    </DetailOverlay>
  );
}
