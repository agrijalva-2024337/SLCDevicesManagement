import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import * as paisService from '@/features/catalogos/paises/paisService';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
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
import { saveSuccessResult } from '@/shared/components/SaveSuccessPanel';
import { useResource } from '@/shared/hooks/useResource';
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

function SedeFormEditor({ id }) {
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const { idActiva } = useEmpresaActiva();
  const hasOutletPaises = Array.isArray(outlet.lookups?.paises);
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

  if (!editing && (idActiva == null || idActiva === '')) {
    return (
      <DetailOverlay open title="Selecciona una empresa" kicker="Registrar sede" onClose={close}>
        <p className="text-base text-navy">
          Inicia sesión eligiendo una empresa antes de registrar una sede.
        </p>
      </DetailOverlay>
    );
  }

  if (!ready || (!hasOutletPaises && paises.isLoading)) {
    return (
      <DetailOverlay open title="Sedes" kicker={editing ? 'Editar registro' : 'Registrar sede'} onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  const paisesList = hasOutletPaises ? outlet.lookups.paises : paises.data;
  const initialValues = item ? sedeToForm(item) : emptySedeForm(idActiva ?? '');

  return (
    <RecordFormOverlay
      open
      title={editing ? item.nombre : 'Nueva sede'}
      kicker={editing ? 'Editar registro' : 'Registrar sede'}
      badge={editing ? <StatusBadge active={Boolean(initialValues.habilitado)} /> : null}
      hint="El nombre es obligatorio."
      fields={sedeFields({
        paises: paisesDeEmpresa(paisesList, idActiva),
      })}
      initialValues={initialValues}
      submitLabel={editing ? 'Guardar cambios' : 'Registrar sede'}
      validate={(values) =>
        compactErrors(
          validateSedeForm(
            {
              ...values,
              idEmpresa: editing
                ? String(item?.idEmpresa ?? values.idEmpresa ?? '')
                : String(idActiva ?? ''),
            },
            paisesList,
            outlet.rows ?? [],
            editing ? id : undefined,
          ),
        )
      }
      onSave={async (values) => {
        const payload = sedeToPayload({
          ...values,
          idEmpresa: editing
            ? String(item?.idEmpresa ?? values.idEmpresa ?? '')
            : String(idActiva ?? ''),
        });
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
