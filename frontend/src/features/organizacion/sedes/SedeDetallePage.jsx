import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as areaService from '@/features/organizacion/areas/areaService';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { EditRecordButton } from '@/shared/components/RecordActions';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

export function SedeDetallePage() {
  const { id } = useParams();
  const { canWrite } = useAuth();
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const close = () => navigate('/app/catalogos/sedes');

  const [sede, setSede] = useState(
    () => outlet.rows?.find((row) => String(row.id) === String(id)) ?? null,
  );
  const [empresa, setEmpresa] = useState(null);
  const [pais, setPais] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const fromRows = outlet.rows?.find((row) => String(row.id) === String(id));
        const found = fromRows ?? (await sedeService.getById(id));
        const [empresaRows, paisRows, areaRows] = await Promise.all([
          empresaService.getAll(),
          paisService.getAll(),
          areaService.getAll(),
        ]);

        if (!cancelled) {
          setSede(found);
          setEmpresa(empresaRows.find((item) => Number(item.id) === Number(found.idEmpresa)) ?? null);
          setPais(paisRows.find((item) => Number(item.id) === Number(found.idPais)) ?? null);
          setAreas(areaRows.filter((area) => Number(area.idSede) === Number(found.id)));
          setLoadError(null);
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSede(null);
          setLoadError(getErrorMessage(error));
          setReady(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, outlet.rows]);

  if (ready && !sede) {
    return (
      <DetailOverlay open title="Sede no encontrada" onClose={close}>
        <p className="text-base text-navy">
          {loadError ?? 'El registro no existe o fue retirado del catálogo.'}
        </p>
      </DetailOverlay>
    );
  }

  if (!ready) {
    return (
      <DetailOverlay open title="Sede" kicker="Sede" onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  return (
    <DetailOverlay
      open
      title={sede.nombre}
      kicker="Sede"
      badge={<StatusBadge active={sede.habilitado} />}
      onClose={close}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailField
          label="Empresa"
          value={
            empresa ? (
              <Link to={`/app/catalogos/empresas/${empresa.id}`} className="hover:underline">
                {empresa.nombre}
              </Link>
            ) : (
              '—'
            )
          }
        />
        <DetailField label="País" value={pais ? `${pais.nombre} (${pais.codigoIso2})` : '—'} />
        <DetailField label="Ciudad" value={sede.ciudad} />
        <DetailField label="Dirección" value={sede.direccion} />
        {sede.fechaCreacion ? (
          <DetailField label="Alta en el sistema" value={formatDate(sede.fechaCreacion)} />
        ) : null}
        {sede.fechaModificacion ? (
          <DetailField label="Última modificación" value={formatDate(sede.fechaModificacion)} />
        ) : null}
      </div>

      {canWrite('sedes') ? (
        <div className="flex flex-wrap gap-3">
          <EditRecordButton to={`/app/catalogos/sedes/${sede.id}/editar`} />
        </div>
      ) : null}

      <section>
        <h3 className="font-display text-xl font-bold text-navy">Áreas</h3>
        <p className="mt-1 text-base text-text-muted">Unidades internas que operan en esta sede.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {areas.length === 0 ? (
            <li className="app-field text-base text-text-muted">Sin áreas registradas.</li>
          ) : (
            areas.map((area) => (
              <li key={area.id}>
                <Link to={`/app/catalogos/areas/${area.id}`} className="app-row">
                  <span>{area.nombre}</span>
                  <span>{area.descripcion}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </DetailOverlay>
  );
}
