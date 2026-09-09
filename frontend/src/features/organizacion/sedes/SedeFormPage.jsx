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
import { saveSuccessResult } from '@/shared/components/SaveSuccessPanel';

function enabledRecords(list) {
  return (list ?? []).filter((item) => item.habilitado !== false);
}

function SedeFormEditor({ id }) {
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const hasOutletEmpresas = Array.isArray(outlet.lookups?.empresas);
  const hasOutletPaises = Array.isArray(outlet.lookups?.paises);
  const empresas = useResource(empresaService.getAll, { enabled: !hasOutletEmpresas });
  const paises = useResource(paisService.getAll, { enabled: !hasOutletPaises });
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

  if (!ready || (!hasOutletEmpresas && empresas.isLoading) || (!hasOutletPaises && paises.isLoading)) {
    return (
      <DetailOverlay open title="Sedes" kicker={editing ? 'Editar registro' : 'Registrar sede'} onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  const empresasList = hasOutletEmpresas ? outlet.lookups.empresas : empresas.data;
  const paisesList = hasOutletPaises ? outlet.lookups.paises : paises.data;
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
          empresas: enabledRecords(empresasList),
          paises: paisesDeEmpresa(paisesList, values.idEmpresa),
        })
      }
      deriveValues={(next, prev) =>
        next.idEmpresa === prev.idEmpresa ? next : { ...next, idPais: '' }
      }
      initialValues={initialValues}
      submitLabel={editing ? 'Guardar cambios' : 'Registrar sede'}
      validate={(values) => compactErrors(validateSedeForm(values, paisesList))}
      onSave={async (values) => {
        const payload = sedeToPayload(values);
        try {
          if (editing) {
            await sedeService.update(Number(id), payload);
          } else {
            await sedeService.create(payload);
          }
          await outlet.reload?.();
          return saveSuccessResult({ created: !editing, entityLabel: 'sede' });
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
