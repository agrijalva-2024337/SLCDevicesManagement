import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import * as activoService from '@/features/activos/activoService';
import { BajaFormOverlay } from '@/features/bajas/BajaFormOverlay';
import * as bajaService from '@/features/bajas/bajaService';
import { parseDetalleBaja } from '@/features/bajas/detalleBajaParser';
import * as motivoBajaService from '@/features/bajas/motivoBajaService';
import * as historialActivoService from '@/features/activos/historialActivoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { filtrarPorEmpresaDeActivo } from '@/features/inventario/trasladoRuta';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DataTable } from '@/shared/components/DataTable';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { DescargarActaButton, EscanearQrButton, RegisterButton } from '@/shared/components/RecordActions';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { useRecordDeepLink } from '@/shared/hooks/useRecordDeepLink';
import { listQueryKey } from '@/shared/data/queryKeys';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDate } from '@/shared/utils/format';
import { saveSuccessResult } from '@/shared/components/SaveSuccessPanel';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import * as usuarioService from '@/features/organizacion/usuarios/usuarioService';
import * as estadoService from '@/features/organizacion/estados/estadoService';

function usuarioNombre(usuario) {
  if (!usuario) return '—';
  return [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ') || usuario.correo || '—';
}

function hydrate(row, lookups) {
  const activo = byId(lookups.activos, row.idActivo);
  const estado = byId(lookups.estados, row.idEstado);
  const detalle = lookups.detallePorAsignacion.get(Number(row.id));
  const motivo = detalle?.idMotivoBaja ? byId(lookups.motivos, detalle.idMotivoBaja) : null;
  const autorizador = detalle?.idAutorizadoPor
    ? byId(lookups.usuarios, detalle.idAutorizadoPor)
    : byId(lookups.usuarios, row.idUsuario);
  return {
    ...row,
    activoNombre: activo?.nombre ?? `Activo #${row.idActivo}`,
    motivoNombre: motivo?.nombre ?? '—',
    autorizadoNombre: usuarioNombre(autorizador),
    estadoNombre: estado?.nombre ?? '—',
    documentoPdfUrl: detalle?.documentoPdfUrl ?? row.documentoPdfUrl,
    documentoReferencia: null,
  };
}

export function BajasPage() {
  const { canWrite, usuario } = useAuth();
  const allowWrite = canWrite('bajas');
  const canReadUsuarios = canWrite('usuarios');
  const { idActiva } = useEmpresaActiva();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    rows: asignacionesRows,
    isLoading,
    errorMessage,
    banner,
    setBanner,
    reload,
  } = useCatalogCollection(asignacionService.getAll);
  const crud = useCrudOverlay();
  const prefillOpened = useRef(false);
  const activos = useResource(activoService.getAll);
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);
  const motivos = useResource(motivoBajaService.getAll);
  const loadUsuarios = useCallback(() => usuarioService.getAllIfAllowed(canReadUsuarios), [canReadUsuarios]);
  const usuarios = useResource(loadUsuarios, {
    key: listQueryKey('usuarios'),
    enabled: canReadUsuarios,
  });
  const responsables = useResource(responsableService.getAll);
  const estados = useResource(estadoService.getAll);
  const tipos = useResource(tipoAsignacionService.getAll);
  const historial = useResource(historialActivoService.getAll);

  const rows = useMemo(
    () => bajaService.filtrarBajas(asignacionesRows, tipos.data),
    [asignacionesRows, tipos.data],
  );

  const detallePorAsignacion = useMemo(() => {
    const map = new Map();
    for (const item of historial.data ?? []) {
      const parsed = parseDetalleBaja(item.informacionNueva);
      if (parsed && item.idAsignacion != null) {
        map.set(Number(item.idAsignacion), parsed);
      }
    }
    return map;
  }, [historial.data]);

  const lookups = useMemo(
    () => ({
      activos: activos.data,
      ubicaciones: ubicaciones.data,
      sedes: sedes.data,
      motivos: motivos.data,
      usuarios: usuarios.data,
      estados: estados.data,
      detallePorAsignacion,
    }),
    [activos.data, detallePorAsignacion, estados.data, motivos.data, sedes.data, ubicaciones.data, usuarios.data],
  );

  const tableRows = useMemo(
    () =>
      filtrarPorEmpresaDeActivo(rows, idActiva, lookups.activos, lookups.ubicaciones, lookups.sedes).map((row) =>
        hydrate(row, lookups),
      ),
    [idActiva, lookups, rows],
  );
  useRecordDeepLink(tableRows, crud.openView);

  useEffect(() => {
    if (prefillOpened.current || !allowWrite) return;
    const idActivo = location.state?.idActivo;
    if (idActivo == null || idActivo === '') return;
    prefillOpened.current = true;
    crud.openCreate({ idActivo });
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reacciona al state de navegación
  }, [allowWrite, location.pathname, location.search, location.state, navigate]);

  if (errorMessage) {
    return (
      <section>
        <div className="app-feedback app-feedback--error" role="alert">
          {errorMessage}
        </div>
      </section>
    );
  }

  return (
    <section>
      {banner ? (
        <div
          className={`app-feedback ${banner.variant === 'error' ? 'app-feedback--error' : 'app-feedback--empty'}`}
          role={banner.variant === 'error' ? 'alert' : 'status'}
        >
          {banner.message}
        </div>
      ) : null}
      <DataTable
        title="Bajas"
        description="Retiro definitivo de activos."
        primaryAction={
          <>
            <EscanearQrButton />
            {allowWrite ? <RegisterButton label="Registrar baja" onClick={() => crud.openCreate()} /> : null}
          </>
        }
        columns={[
          { key: 'activoNombre', header: 'Activo', primary: true },
          { key: 'motivoNombre', header: 'Motivo' },
          {
            key: 'fechaAsignacion',
            header: 'Fecha',
            numeric: true,
            getValue: (row) => formatDate(row.fechaAsignacion),
            sortValue: (row) => row.fechaAsignacion,
          },
          { key: 'autorizadoNombre', header: 'Autorizado por' },
          {
            key: 'estadoNombre',
            header: 'Estado',
            type: 'badge',
            tone: () => 'danger',
          },
        ]}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por activo, motivo o autorizante"
        emptyTitle="No hay bajas"
        emptyDescription="Registre la primera baja con motivo, autorizante y URL del documento."
        getRowActions={(row) => ({
          view: { onClick: () => crud.openView(row) },
        })}
      />

      <DetailOverlay
        open={crud.isView}
        title={crud.record?.activoNombre ?? 'Baja'}
        kicker="Baja"
        badge={crud.record ? <ToneBadge tone="danger">{crud.record.estadoNombre}</ToneBadge> : null}
        onClose={crud.close}
      >
        {crud.record ? (
          <div className="app-fields">
            <DetailField label="Activo" value={crud.record.activoNombre} />
            <DetailField label="Motivo" value={crud.record.motivoNombre} />
            <DetailField label="Autorizado por" value={crud.record.autorizadoNombre} />
            <DetailField label="Fecha" value={formatDate(crud.record.fechaAsignacion)} />
            <DetailField label="Estado" value={crud.record.estadoNombre} />
            <div className="sm:col-span-2">
              <DetailField label="URL del documento" value={crud.record.documentoPdfUrl} />
            </div>
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={crud.record.observaciones} />
            </div>
            <div className="sm:col-span-2">
              <DescargarActaButton url={crud.record.documentoPdfUrl} />
            </div>
          </div>
        ) : null}
      </DetailOverlay>

      <BajaFormOverlay
        open={crud.isCreate}
        prefill={crud.record}
        activos={activos.data}
        motivos={motivos.data}
        usuarios={usuarios.data}
        usuariosUnavailableReason={canReadUsuarios ? null : usuarioService.USUARIOS_SIN_LECTURA}
        responsables={responsables.data}
        asignaciones={asignacionesRows}
        tipos={tipos.data}
        onClose={crud.close}
        onSave={async (values) => {
          try {
            await bajaService.registrar({
              idActivo: Number(values.idActivo),
              idUsuario: usuario?.id,
              idResponsable: Number(values.idResponsable),
              idMotivoBaja: Number(values.idMotivoBaja),
              idAutorizadoPor: Number(values.idAutorizadoPor),
              documentoReferencia: values.documentoReferencia,
              documentoPdfUrl: values.documentoPdfUrl,
              fecha: values.fecha,
              observaciones: values.observaciones,
              firmaEntrega: values.firmaEntrega,
              firmaRecibe: values.firmaRecibe,
            });
            await Promise.all([reload(), activos.reload(), historial.reload()]);
            return saveSuccessResult({ created: true, entityLabel: 'baja' });
          } catch (error) {
            if (error.response?.status === 409 || error.status === 409) {
              setBanner({ message: error.message, variant: 'error' });
            }
            throw error;
          }
        }}
      />
    </section>
  );
}
