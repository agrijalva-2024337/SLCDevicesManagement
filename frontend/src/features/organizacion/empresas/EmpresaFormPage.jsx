import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import {
  emptyEmpresaForm,
  empresaFields,
  empresaToForm,
  empresaToPayload,
  validateEmpresaForm,
} from '@/features/organizacion/empresas/empresaFormModel';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import { useResource } from '@/shared/hooks/useResource';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { compactErrors } from '@/shared/components/recordFormUtils';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { saveSuccessResult } from '@/shared/components/SaveSuccessPanel';
import { buscarPorCodigoTelefonico } from '@/shared/validation/paisesIso';

function EmpresaFormEditor({ id }) {
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const editing = Boolean(id);
  const close = () => navigate('/app/catalogos/empresas');

  const hasOutletPaises = Array.isArray(outlet.lookups?.paises);
  const paises = useResource(paisService.getAll, { enabled: !hasOutletPaises });
  const [item, setItem] = useState(null);
  const [records, setRecords] = useState(outlet.rows ?? []);
  const [loadError, setLoadError] = useState(null);
  const [ready, setReady] = useState(!editing);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = outlet.rows ?? (await empresaService.getAll());
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
        const found = fromRows ?? (await empresaService.getById(id));
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
      <DetailOverlay open title="Empresa no encontrada" kicker="Registro" onClose={close}>
        <p className="text-base text-navy">
          {loadError ?? 'El registro no existe o fue retirado del catálogo.'}
        </p>
      </DetailOverlay>
    );
  }

  if (!ready || (!hasOutletPaises && paises.isLoading)) {
    return (
      <DetailOverlay open title="Empresas" kicker={editing ? 'Editar registro' : 'Registrar empresa'} onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  const paisesList = hasOutletPaises ? outlet.lookups.paises : paises.data;
  const initialValues = item ? empresaToForm(item, paisesList) : emptyEmpresaForm(paisesList);

  return (
    <RecordFormOverlay
      open
      title={editing ? item.nombre : 'Nueva empresa'}
      kicker={editing ? 'Editar registro' : 'Registrar empresa'}
      badge={editing ? <StatusBadge active={Boolean(initialValues.habilitado)} /> : null}
      hint="Complete el registro corporativo. Nombre e identificación tributaria son obligatorios."
      fields={empresaFields(paisesList)}
      initialValues={initialValues}
      submitLabel={editing ? 'Guardar cambios' : 'Registrar empresa'}
      validate={(values) =>
        compactErrors(
          validateEmpresaForm(values, records, id, {
            iso2: buscarPorCodigoTelefonico(values.telefonoPrefijo)?.codigoIso2,
            paises: paisesList,
          }),
        )
      }
      onSave={async (values) => {
        const payload = empresaToPayload(values);
        try {
          if (editing) {
            await empresaService.update(Number(id), payload);
          } else {
            await empresaService.create(payload);
          }
          await outlet.reload?.();
          return saveSuccessResult({ created: !editing, entityLabel: 'empresa' });
        } catch (error) {
          throw applyApiFieldErrors(error);
        }
      }}
      onClose={close}
    />
  );
}

export function EmpresaFormPage() {
  const { id } = useParams();
  return <EmpresaFormEditor key={id ?? 'nueva'} id={id} />;
}
