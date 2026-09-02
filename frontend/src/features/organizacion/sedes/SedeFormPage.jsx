import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import {
  emptySedeForm,
  sedeFields,
  sedeToForm,
  sedeToPayload,
  validateSedeForm,
} from '@/features/organizacion/sedes/sedeFormModel';
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

function SedeFormEditor({ id }) {
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const empresas = useResource(empresaService.getAll);
  const paises = useResource(paisService.getAll);
  const editing = Boolean(id);
  const close = () => navigate('/app/catalogos/sedes');

  const [item, setItem] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [ready, setReady] = useState(!editing);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!editing) {
        setReady(true);
        return;
      }

      try {
        const fromRows = outlet.rows?.find((row) => String(row.id) === String(id));
        const found = fromRows ?? (await sedeService.getById(id));
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
  }, [editing, id, outlet.rows]);

  if (editing && ready && !item) {
    return (
      <DetailOverlay open title="Sede no encontrada" kicker="Registro" onClose={close}>
        <p className="text-base text-navy">
          {loadError ?? 'El registro no existe o fue retirado del catálogo.'}
        </p>
      </DetailOverlay>
    );
  }

  if (!ready) {
    return (
      <DetailOverlay open title="Sedes" kicker={editing ? 'Editar registro' : 'Registrar sede'} onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  const initialValues = item ? sedeToForm(item) : emptySedeForm();

  return (
    <RecordFormOverlay
      open
      title={editing ? item.nombre : 'Nueva sede'}
      kicker={editing ? 'Editar registro' : 'Registrar sede'}
      badge={editing ? <StatusBadge active={Boolean(initialValues.habilitado)} /> : null}
      hint="La sede pertenece a una empresa y a un país. El nombre es obligatorio."
      fields={sedeFields({
        empresas: enabledRecords(empresas.data),
        paises: paises.data,
      })}
      initialValues={initialValues}
      submitLabel={editing ? 'Guardar cambios' : 'Registrar sede'}
      validate={(values) => compactErrors(validateSedeForm(values))}
      onSave={async (values) => {
        const payload = sedeToPayload(values);
        // [API] mapear errores de campo del backend con fieldErrors.js
        const saved = editing
          ? await sedeService.update(Number(id), payload)
          : await sedeService.create(payload);
        await outlet.reload?.();
        navigate(`/app/catalogos/sedes/${saved.id}`);
      }}
      onClose={close}
    />
  );
}

export function SedeFormPage() {
  const { id } = useParams();
  return <SedeFormEditor key={id ?? 'nueva'} id={id} />;
}
