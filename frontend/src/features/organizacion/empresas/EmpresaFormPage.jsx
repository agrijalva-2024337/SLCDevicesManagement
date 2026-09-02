import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import {
  emptyEmpresaForm,
  empresaFields,
  empresaToForm,
  empresaToPayload,
  validateEmpresaForm,
} from '@/features/organizacion/empresas/empresaFormModel';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { compactErrors } from '@/shared/components/recordFormUtils';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

function EmpresaFormEditor({ id }) {
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const editing = Boolean(id);
  const close = () => navigate('/app/catalogos/empresas');

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

  if (!ready) {
    return (
      <DetailOverlay open title="Empresas" kicker={editing ? 'Editar registro' : 'Registrar empresa'} onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  const initialValues = item ? empresaToForm(item) : emptyEmpresaForm();

  return (
    <RecordFormOverlay
      open
      title={editing ? item.nombre : 'Nueva empresa'}
      kicker={editing ? 'Editar registro' : 'Registrar empresa'}
      badge={editing ? <StatusBadge active={Boolean(initialValues.habilitado)} /> : null}
      hint="Complete el registro corporativo. Nombre y NIT son obligatorios."
      fields={empresaFields()}
      initialValues={initialValues}
      submitLabel={editing ? 'Guardar cambios' : 'Registrar empresa'}
      validate={(values) => compactErrors(validateEmpresaForm(values, records, id))}
      onSave={async (values) => {
        const payload = empresaToPayload(values);
        // [API] mapear errores de campo del backend con fieldErrors.js
        const saved = editing
          ? await empresaService.update(Number(id), payload)
          : await empresaService.create(payload);
        await outlet.reload?.();
        navigate(`/app/catalogos/empresas/${saved.id}`);
      }}
      onClose={close}
    />
  );
}

export function EmpresaFormPage() {
  const { id } = useParams();
  return <EmpresaFormEditor key={id ?? 'nueva'} id={id} />;
}
