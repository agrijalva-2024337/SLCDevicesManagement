import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import { getMaestro } from '@/features/catalogos/maestros';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { compactErrors } from '@/shared/components/recordFormUtils';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useResource } from '@/shared/hooks/useResource';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

function enabledRecords(list) {
  return (list ?? []).filter((item) => item.habilitado !== false);
}

function MaestroFormEditor({ slug, id }) {
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const maestro = getMaestro(slug);
  const empresas = useResource(empresaService.getAll);
  const sedes = useResource(sedeService.getAll);
  const paises = useResource(paisService.getAll);
  const editing = Boolean(id);
  const close = () => navigate(`/app/catalogos/${slug}`);

  const [item, setItem] = useState(null);
  const [records, setRecords] = useState(outlet.rows ?? []);
  const [loadError, setLoadError] = useState(null);
  const [ready, setReady] = useState(!editing);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!maestro) {
        return;
      }

      try {
        const list = outlet.rows ?? (await maestro.service.getAll());
        if (!cancelled) {
          setRecords(list);
        }

        if (!editing) {
          if (!cancelled) {
            setReady(true);
          }
          return;
        }

        const fromRows = list.find((row) => String(row.id) === String(id));
        const found = fromRows ?? (await maestro.service.getById(id));
        if (!cancelled) {
          setItem(found);
          setLoadError(null);
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error));
          setReady(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [editing, id, maestro, outlet.rows]);

  if (!maestro || (editing && ready && !item)) {
    return (
      <DetailOverlay open title="Registro no encontrado" kicker="Registro" onClose={close}>
        <p className="text-base text-navy">
          {loadError ?? 'El registro no existe o fue retirado del catálogo.'}
        </p>
      </DetailOverlay>
    );
  }

  if (!ready) {
    return (
      <DetailOverlay open title={maestro.title} kicker={editing ? 'Editar registro' : maestro.registerLabel} onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  const lookups = {
    empresas: enabledRecords(empresas.data),
    sedes: enabledRecords(sedes.data),
    paises: paises.data,
  };
  const initialValues = item ? maestro.toForm(item) : maestro.empty();
  const fields = maestro.fields(lookups);

  return (
    <RecordFormOverlay
      open
      title={editing ? maestro.titleOf(item) : `Nueva ${maestro.singular}`}
      kicker={editing ? 'Editar registro' : maestro.registerLabel}
      badge={
        editing && maestro.hasHabilitado !== false ? (
          <StatusBadge active={Boolean(initialValues.habilitado)} />
        ) : null
      }
      hint={maestro.hint}
      fields={fields}
      initialValues={initialValues}
      submitLabel={editing ? 'Guardar cambios' : maestro.registerLabel}
      validate={(values) => compactErrors(maestro.validate(values, records, id))}
      onSave={async (values) => {
        const payload = maestro.toPayload(values);
        // [API] mapear errores de campo del backend con fieldErrors.js
        const saved = editing
          ? await maestro.service.update(Number(id), payload)
          : await maestro.service.create(payload);
        await outlet.reload?.();
        navigate(`/app/catalogos/${slug}/${saved.id}`);
      }}
      onClose={close}
    />
  );
}

export function MaestroFormPage() {
  const { slug, id } = useParams();
  return <MaestroFormEditor key={`${slug}-${id ?? 'nueva'}`} slug={slug} id={id} />;
}
