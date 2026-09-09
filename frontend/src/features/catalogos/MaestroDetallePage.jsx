import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { getMaestro } from '@/features/catalogos/maestros';
import { DetailField, DetailOverlay, SaveFlash } from '@/shared/components/DetailOverlay';
import { EditRecordButton } from '@/shared/components/RecordActions';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

function GeneratedPasswordNotice({ password }) {
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="app-feedback app-feedback--success" role="status">
      <p className="font-semibold">Contraseña temporal generada</p>
      <p className="mt-1 text-sm">
        Cópiela ahora: no se podrá recuperar después. Al cerrar este detalle desaparece del estado.
      </p>
      <div className="app-input-password mt-3">
        <input
          className="app-input app-hash"
          type={visible ? 'text' : 'password'}
          value={password}
          readOnly
          aria-label="Contraseña temporal generada"
        />
        <button
          type="button"
          className="app-icon-btn"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          onClick={() => setVisible((open) => !open)}
        >
          <i className={visible ? 'pi pi-eye-slash' : 'pi pi-eye'} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={copyPassword}>
          {copied ? 'Copiada' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

export function MaestroDetallePage() {
  const { slug, id } = useParams();
  const { canWrite } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutletContext() ?? {};
  const maestro = getMaestro(slug);
  const close = () => navigate(`/app/catalogos/${slug}`, { replace: true });
  const passwordGenerada = location.state?.passwordGenerada;

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
      <SaveFlash message={location.state?.flash} />
      <div className="app-fields">
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
      {passwordGenerada ? (
        <GeneratedPasswordNotice password={passwordGenerada} />
      ) : null}
      {canWrite(slug) ? (
        <div className="flex flex-wrap gap-3">
          <EditRecordButton to={`/app/catalogos/${slug}/${item.id}/editar`} />
        </div>
      ) : null}
    </DetailOverlay>
  );
}
