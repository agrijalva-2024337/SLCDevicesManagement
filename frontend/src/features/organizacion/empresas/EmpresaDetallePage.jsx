import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { EditRecordButton } from '@/shared/components/RecordActions';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

export function EmpresaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const outlet = useOutletContext() ?? {};
  const close = () => navigate('/app/catalogos/empresas');

  const [empresa, setEmpresa] = useState(
    () => outlet.rows?.find((row) => String(row.id) === String(id)) ?? null,
  );
  const [sedes, setSedes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const fromRows = outlet.rows?.find((row) => String(row.id) === String(id));
        const found = fromRows ?? (await empresaService.getById(id));
        const sedeRows = await sedeService.getAll();
        if (!cancelled) {
          setEmpresa(found);
          setSedes(sedeRows.filter((sede) => Number(sede.idEmpresa) === Number(found.id)));
          setLoadError(null);
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setEmpresa(null);
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

  if (ready && !empresa) {
    return (
      <DetailOverlay open title="Empresa no encontrada" onClose={close}>
        <p className="text-base text-navy">
          {loadError ?? 'El registro no existe o fue retirado del catálogo.'}
        </p>
      </DetailOverlay>
    );
  }

  if (!ready) {
    return (
      <DetailOverlay open title="Empresa" kicker="Empresa" onClose={close}>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      </DetailOverlay>
    );
  }

  return (
    <DetailOverlay
      open
      title={empresa.nombre}
      kicker="Empresa"
      badge={<StatusBadge active={empresa.habilitado} />}
      onClose={close}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailField label="NIT" value={empresa.nitCodigo} />
        <DetailField label="Teléfono" value={empresa.telefono} />
        <DetailField label="Dirección" value={empresa.direccion} />
        {empresa.fechaCreacion ? (
          <DetailField label="Alta en el sistema" value={formatDate(empresa.fechaCreacion)} />
        ) : null}
        {empresa.fechaModificacion ? (
          <DetailField label="Última modificación" value={formatDate(empresa.fechaModificacion)} />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <EditRecordButton to={`/app/catalogos/empresas/${empresa.id}/editar`} />
      </div>

      <section>
        <h3 className="font-display text-xl font-bold text-navy">Sedes de esta empresa</h3>
        <p className="mt-1 text-base text-text-muted">Instalaciones vinculadas al registro corporativo.</p>
        <ul className="mt-4 grid gap-3">
          {sedes.length === 0 ? (
            <li className="app-field text-base font-medium text-text-muted">
              Esta empresa aún no tiene sedes.
            </li>
          ) : (
            sedes.map((sede) => (
              <li key={sede.id}>
                <Link to={`/app/catalogos/sedes/${sede.id}`} className="app-row">
                  <span>{sede.nombre}</span>
                  <span>
                    {sede.ciudad}
                    {sede.habilitado ? '' : ' · Inactiva'}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </DetailOverlay>
  );
}
