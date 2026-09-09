import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { getMaestro } from '@/features/catalogos/maestros';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import { resolveUbicacionCoords } from '@/features/catalogos/ubicaciones/resolveUbicacionCoords';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as areaService from '@/features/organizacion/areas/areaService';
import { invalidateCatalogoAsignacionCache } from '@/shared/api/tipoAsignacion';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { compactErrors } from '@/shared/components/recordFormUtils';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useResource } from '@/shared/hooks/useResource';
import { toRedConocidaWriteError } from '@/features/catalogos/redesConocidas/redConocidaErrors';
import { derivePaisValues } from '@/features/catalogos/paises/paisForm';
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { saveSuccessResult } from '@/shared/components/SaveSuccessPanel';

function enabledRecords(list) {
  return (list ?? []).filter((item) => item.habilitado !== false);
}

function hasOutletList(outlet, key) {
  return Array.isArray(outlet?.lookups?.[key]);
}

function MaestroFormEditor({ slug, id }) {
  const navigate = useNavigate();
  const { rol, idEmpresa } = useAuth();
  const { idActiva } = useEmpresaActiva();
  const outlet = useOutletContext() ?? {};
  const maestro = getMaestro(slug);
  const needed = maestro?.lookups ?? [];
  const empresas = useResource(empresaService.getAll, {
    enabled: needed.includes('empresas') && !hasOutletList(outlet, 'empresas'),
  });
  const sedes = useResource(sedeService.getAll, {
    enabled: needed.includes('sedes') && !hasOutletList(outlet, 'sedes'),
  });
  const areas = useResource(areaService.getAll, {
    enabled: needed.includes('areas') && !hasOutletList(outlet, 'areas'),
  });
  const paises = useResource(paisService.getAll, {
    enabled: needed.includes('paises') && !hasOutletList(outlet, 'paises'),
  });
  const ubicaciones = useResource(ubicacionService.getAll, {
    enabled: needed.includes('ubicaciones') && !hasOutletList(outlet, 'ubicaciones'),
  });
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

  const waitingLookups =
    (needed.includes('paises') && !hasOutletList(outlet, 'paises') && paises.isLoading) ||
    (needed.includes('empresas') && !hasOutletList(outlet, 'empresas') && empresas.isLoading) ||
    (needed.includes('sedes') && !hasOutletList(outlet, 'sedes') && sedes.isLoading) ||
    (needed.includes('areas') && !hasOutletList(outlet, 'areas') && areas.isLoading) ||
    (needed.includes('ubicaciones') && !hasOutletList(outlet, 'ubicaciones') && ubicaciones.isLoading);

  if (!ready || waitingLookups) {
    return (
      <DetailOverlay open title={maestro.title} kicker={editing ? 'Editar registro' : maestro.registerLabel} onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  const empresasList = hasOutletList(outlet, 'empresas') ? outlet.lookups.empresas : empresas.data;
  const sedesList = hasOutletList(outlet, 'sedes') ? outlet.lookups.sedes : sedes.data;
  const areasList = hasOutletList(outlet, 'areas') ? outlet.lookups.areas : areas.data;
  const paisesList = hasOutletList(outlet, 'paises') ? outlet.lookups.paises : paises.data;
  const ubicacionesList = hasOutletList(outlet, 'ubicaciones')
    ? outlet.lookups.ubicaciones
    : ubicaciones.data;

  const lookups = {
    empresas: enabledRecords(empresasList),
    sedes: enabledRecords(sedesList),
    areas: enabledRecords(areasList),
    paises: paisesList,
    ubicaciones: enabledRecords(ubicacionesList),
    rol,
    idEmpresa,
    idEmpresaActiva: idActiva,
    editing,
  };
  const initialValues = item ? maestro.toForm(item, lookups) : maestro.empty(lookups);
  const fields = maestro.fields(lookups);

  return (
    <RecordFormOverlay
      open
      title={editing ? maestro.titleOf(item) : (maestro.newTitle ?? `Nueva ${maestro.singular}`)}
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
      deriveValues={slug === 'paises' ? derivePaisValues : undefined}
      validate={(values) => compactErrors(maestro.validate(values, records, id, lookups))}
      onSave={async (values) => {
        let payload = maestro.toPayload(values, { editing, idEmpresaActiva: idActiva });
        if (slug === 'ubicaciones') {
          const sede = (sedesList ?? []).find((row) => Number(row.id) === Number(payload.idSede));
          const pais = (paisesList ?? []).find((row) => Number(row.id) === Number(sede?.idPais));
          payload = await resolveUbicacionCoords(payload, sede, pais?.nombre);
        }
        try {
          const saved = editing
            ? await maestro.service.update(Number(id), payload)
            : await maestro.service.create(payload);
          if (slug === 'estados' || slug === 'tipos-asignacion') {
            invalidateCatalogoAsignacionCache();
          }
          await outlet.reload?.();
          return saveSuccessResult({
            created: !editing,
            entityLabel: maestro.singular,
            passwordGenerada: saved.passwordGenerada,
          });
        } catch (error) {
          throw slug === 'redes-conocidas' ? toRedConocidaWriteError(error) : applyApiFieldErrors(error);
        }
      }}
      onClose={close}
    />
  );
}

export function MaestroFormPage() {
  const { slug, id } = useParams();
  return <MaestroFormEditor key={`${slug}-${id ?? 'nueva'}`} slug={slug} id={id} />;
}
