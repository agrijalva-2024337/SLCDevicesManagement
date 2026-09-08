import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import {
  emptySedeForm,
  paisesDeEmpresa,
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
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { resolveSavedId, saveSuccessState } from '@/shared/utils/saveFeedback';

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
      hint="La sede pertenece a una empresa y a un país de esa misma empresa. El nombre es obligatorio."
      fields={(values) =>
        sedeFields({
          empresas: enabledRecords(empresas.data),
          paises: paisesDeEmpresa(paises.data, values.idEmpresa),
        })
      }
      deriveValues={(next, prev) =>
        next.idEmpresa === prev.idEmpresa ? next : { ...next, idPais: '' }
      }
      initialValues={initialValues}
      submitLabel={editing ? 'Guardar cambios' : 'Registrar sede'}
      validate={(values) => compactErrors(validateSedeForm(values, paises.data))}
      onSave={async (values) => {
        const payload = sedeToPayload(values);
        try {
          const saved = editing
            ? await sedeService.update(Number(id), payload)
            : await sedeService.create(payload);
          await outlet.reload?.();
          const recordId = resolveSavedId(saved, id);
          if (recordId == null) {
            navigate('/app/catalogos/sedes');
            return;
          }
          navigate(`/app/catalogos/sedes/${recordId}`, { state: saveSuccessState(editing) });
        } catch (error) {
          throw applyApiFieldErrors(error);
        }
      }}
      onClose={close}
    />
  );
}

export function SedeFormPage() {
  const { id } = useParams();
  return <SedeFormEditor key={id ?? 'nueva'} id={id} />;
}
