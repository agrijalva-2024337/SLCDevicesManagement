import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ActivoFormOverlay } from '@/features/activos/ActivoFormOverlay';
import {
  estadoNombreDeActivo,
  getAccionesDisponibles,
} from '@/features/activos/activoAcciones';
import * as activoService from '@/features/activos/activoService';
import { activosVistaPath } from '@/features/activos/activosVistas';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as categoriaService from '@/features/catalogos/categorias/categoriaService';
import * as proveedorService from '@/features/catalogos/proveedores/proveedorService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { useAuth } from '@/features/auth/useAuth';
import { BajaFormOverlay } from '@/features/bajas/BajaFormOverlay';
import * as bajaService from '@/features/bajas/bajaService';
import * as motivoBajaService from '@/features/bajas/motivoBajaService';
import * as consultaPublicaService from '@/features/consulta/consultaPublicaService';
import { TrasladoFormOverlay } from '@/features/inventario/TrasladoFormOverlay';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';
import * as trasladoService from '@/features/inventario/trasladoService';
import { MantenimientoFormOverlay } from '@/features/mantenimientos/MantenimientoFormOverlay';
import * as mantenimientoService from '@/features/mantenimientos/mantenimientoService';
import * as tipoMantenimientoService from '@/features/mantenimientos/tipoMantenimientoService';
import * as areaService from '@/features/organizacion/areas/areaService';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import * as usuarioService from '@/features/organizacion/usuarios/usuarioService';
import { formatHaceCuanto, listarRastreo, mapsUrlDe } from '@/features/rastreo/rastreoService';
import { DataTable } from '@/shared/components/DataTable';
import { DetailField } from '@/shared/components/DetailOverlay';
import { PageHeader } from '@/shared/components/PageHeader';
import { DescargarActaButton } from '@/shared/components/RecordActions';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { detailQueryKey, listQueryKey } from '@/shared/data/queryKeys';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDate, formatMoney } from '@/shared/utils/format';
import { saveSuccessResult } from '@/shared/components/SaveSuccessPanel';

const ETIQUETA_ACCION = {
  edit: 'Editar registro',
  assign: 'Asignar responsable',
  transfer: 'Nuevo traslado',
  maintenance: 'Enviar a mantenimiento',
  retire: 'Registrar baja',
};

function estadoTone(nombre) {
  const key = String(nombre ?? '').toLowerCase();
  if (key.includes('baja')) return 'danger';
  if (key.includes('mantenimiento')) return 'warning';
  if (key.includes('asignado')) return 'info';
  if (key.includes('disponible')) return 'success';
  return 'muted';
}

export function ActivoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite, usuario } = useAuth();
  const allowWrite = canWrite('activos');
  const canRetire = canWrite('bajas');
  const canReadUsuarios = canWrite('usuarios');
  const { idActiva, empresas } = useEmpresaActiva();

  const [movimiento, setMovimiento] = useState(null);
  const [editando, setEditando] = useState(false);

  const loadActivo = useCallback(() => activoService.getById(id), [id]);
  const loadQr = useCallback(() => consultaPublicaService.getQrDeActivo(id), [id]);
  const loadUsuarios = useCallback(() => usuarioService.getAllIfAllowed(canReadUsuarios), [canReadUsuarios]);

  const activoRes = useResource(loadActivo, { key: detailQueryKey('activos', id), initialData: null });
  const qrRes = useResource(loadQr, { key: detailQueryKey('consultaQr', id), initialData: null });
  const activos = useResource(activoService.getAll);
  const categorias = useResource(categoriaService.getAll);
  const proveedores = useResource(proveedorService.getAll);
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);
  const estados = useResource(estadoService.getAll);
  const responsables = useResource(responsableService.getAll);
  const areas = useResource(areaService.getAll);
  const tipos = useResource(tipoAsignacionService.getAll);
  const asignaciones = useResource(asignacionService.getAll);
  const motivos = useResource(motivoBajaService.getAll);
  const tiposMantenimiento = useResource(tipoMantenimientoService.getAll);
  const usuarios = useResource(loadUsuarios, {
    key: listQueryKey('usuarios'),
    enabled: canReadUsuarios,
  });
  const rastreo = useResource(listarRastreo, { key: listQueryKey('rastreo') });

  const activo = activoRes.data?.id ? activoRes.data : null;
  const qr = qrRes.data?.imageUrl ? qrRes.data : null;

  const ubicacion = byId(ubicaciones.data, activo?.idUbicacion);
  const sede = byId(sedes.data, ubicacion?.idSede);
  const empresa = byId(empresas, sede?.idEmpresa);
  const categoria = byId(categorias.data, activo?.idCategoriaActivo);
  const proveedor = byId(proveedores.data, activo?.idProveedor);
  const estadoNombre = estadoNombreDeActivo(activo, {
    asignaciones: asignaciones.data,
    estados: estados.data,
  });

  const asignacionVigente = useMemo(
    () => (asignaciones.data ?? []).find((row) => Number(row.idActivo) === Number(id) && row.activa) ?? null,
    [asignaciones.data, id],
  );
  const responsableActual = byId(responsables.data, asignacionVigente?.idResponsable);
  const areaActual = byId(areas.data, responsableActual?.idArea);

  const acciones = useMemo(() => {
    if (!activo) return [];
    const ctx = { asignaciones: asignaciones.data, tipos: tipos.data, canRetire };
    return getAccionesDisponibles(activo, ctx).filter((item) => {
      if (item.key === 'view' || item.key === 'qr') return false;
      return allowWrite;
    });
  }, [activo, allowWrite, asignaciones.data, canRetire, tipos.data]);

  const seguimiento = useMemo(() => {
    const row = (rastreo.data ?? []).find((item) => Number(item.idActivo) === Number(id));
    if (!row) return null;
    const detectada = byId(ubicaciones.data, row.idUbicacionDetectada);
    return {
      ...row,
      detectadaNombre: nombreUbicacion(detectada),
      haceCuanto: formatHaceCuanto(row.ultimoUsoEn),
      mapsUrl: mapsUrlDe(detectada ?? byId(ubicaciones.data, row.idUbicacionAsignada)),
    };
  }, [id, rastreo.data, ubicaciones.data]);

  const movimientos = useMemo(
    () =>
      (asignaciones.data ?? [])
        .filter((row) => Number(row.idActivo) === Number(id))
        .map((row) => {
          const registrador = byId(usuarios.data, row.idUsuario);
          return {
            ...row,
            tipoNombre: byId(tipos.data, row.idTipoAsignacion)?.nombre ?? 'Movimiento',
            responsableNombre: byId(responsables.data, row.idResponsable)?.nombreCompleto ?? '—',
            registradoPor: registrador
              ? [registrador.nombres, registrador.apellidos].filter(Boolean).join(' ')
              : '—',
            estadoVista: row.activa ? 'Activo' : 'Cerrado',
          };
        })
        .sort((left, right) => new Date(right.fechaAsignacion) - new Date(left.fechaAsignacion)),
    [asignaciones.data, id, responsables.data, tipos.data, usuarios.data],
  );

  const refrescar = useCallback(async () => {
    await Promise.all([activoRes.reload(), asignaciones.reload(), ubicaciones.reload(), activos.reload()]);
  }, [activoRes, activos, asignaciones, ubicaciones]);

  function ejecutarAccion(key) {
    if (key === 'edit') {
      setEditando(true);
      return;
    }
    if (key === 'assign') {
      navigate(activosVistaPath('asignaciones'), { state: { idActivo: Number(id) } });
      return;
    }
    if (key === 'transfer') setMovimiento('traslado');
    if (key === 'maintenance') setMovimiento('mantenimiento');
    if (key === 'retire') setMovimiento('baja');
  }

  if (activoRes.errorMessage) {
    return (
      <section>
        <div className="app-feedback app-feedback--error" role="alert">
          {activoRes.errorMessage}
        </div>
        <Link to="/app/activos" className="app-btn app-btn--ghost mt-4">
          <i className="pi pi-arrow-left" aria-hidden="true" />
          Volver al listado
        </Link>
      </section>
    );
  }

  if (!activo) {
    return (
      <section>
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando la ficha del activo…
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title={activo.nombre}
        description="Detalle, QR e historial. Puede registrar un movimiento desde aquí."
        actions={
          <>
            <Link to="/app/escanear" className="app-btn app-btn--ghost">
              <i className="pi pi-qrcode" aria-hidden="true" />
              Escanear QR
            </Link>
            <Link to="/app/activos" className="app-btn app-btn--ghost">
              <i className="pi pi-arrow-left" aria-hidden="true" />
              Volver al listado
            </Link>
          </>
        }
      />

      <div className="app-ficha-grid">
        <div className="app-panel">
          <div className="app-fields app-fields-plain">
            <DetailField label="Código interno" value={activo.numeroSerie || `A-${String(activo.id).padStart(5, '0')}`} />
            <DetailField label="Serie / etiqueta" value={activo.numeroSerie} />
            <DetailField label="Empresa" value={empresa?.nombre} />
            <DetailField label="Sede" value={sede?.nombre} />
            <DetailField label="Categoría" value={categoria?.nombre} />
            <DetailField label="Proveedor" value={proveedor?.nombre} />
            <DetailField label="Ubicación asignada" value={nombreUbicacion(ubicacion)} />
            <DetailField label="Área" value={areaActual?.nombre} />
            <DetailField label="Responsable actual" value={responsableActual?.nombreCompleto} />
            <DetailField
              label="Estado"
              value={
                estadoNombre ? <ToneBadge tone={estadoTone(estadoNombre)}>{estadoNombre}</ToneBadge> : null
              }
            />
            <DetailField label="Marca / modelo" value={[activo.marca, activo.modelo].filter(Boolean).join(' ')} />
            <DetailField
              label="Compra"
              value={[formatDate(activo.fechaCompra), formatMoney(activo.costoAdquisicion, activo.moneda ?? 'GTQ')]
                .filter((part) => part && part !== '—')
                .join(' · ')}
            />
            <DetailField label="Factura" value={activo.numeroFactura} />
            <DetailField label="Garantía hasta" value={formatDate(activo.fechaVencimientoGarantia)} />
            <div className="sm:col-span-2">
              <DetailField label="Descripción" value={activo.descripcion} />
            </div>
            <div className="sm:col-span-2">
              <DetailField label="Especificaciones de hardware" value={activo.especificacionesHardware} />
            </div>
            <div className="sm:col-span-2">
              <DetailField label="Periféricos adicionales" value={activo.perifericosAdicionales} />
            </div>
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={activo.observaciones} />
            </div>
          </div>
        </div>

        <div className="app-panel">
          <div className="app-ficha-qr">
            {qrRes.isLoading ? <p className="app-ficha-qr-nota">Generando el código QR…</p> : null}
            {qrRes.errorMessage ? (
              <p className="app-ficha-qr-nota">{qrRes.errorMessage}</p>
            ) : null}
            {qr ? (
              <>
                <img src={qr.imageUrl} alt={`Código QR de ${activo.nombre}`} width={216} height={216} />
                <p className="app-ficha-qr-nombre">{activo.nombre}</p>
                {qr.consultaUrl ? (
                  <a className="app-ficha-qr-url" href={qr.consultaUrl} target="_blank" rel="noreferrer">
                    {qr.consultaUrl}
                  </a>
                ) : null}
                <a
                  className="app-btn app-btn--primary"
                  href={qr.imageUrl}
                  download={`qr-${activo.numeroSerie ?? activo.id}.png`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="pi pi-download" aria-hidden="true" />
                  Descargar QR
                </a>
                <p className="app-ficha-qr-nota">
                  Al escanearlo, cualquiera ve la ficha pública del equipo. El personal con sesión puede abrir el
                  inventario y registrar movimientos.
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="app-panel mt-5">
        <p className="app-label">Última ubicación del equipo</p>
        {seguimiento ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ToneBadge tone={seguimiento.fueraDeRango ? 'danger' : 'success'}>
              {seguimiento.fueraDeRango ? 'Fuera de rango' : 'En rango'}
            </ToneBadge>
            <span className="text-sm">{seguimiento.detectadaNombre}</span>
            <span className="text-sm text-text-muted">{seguimiento.haceCuanto}</span>
            {seguimiento.mapsUrl ? (
              <a
                className="app-btn app-btn--ghost app-btn--sm"
                href={seguimiento.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <i className="pi pi-map-marker" aria-hidden="true" />
                Ver en el mapa
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-muted">
            Este activo aún no reporta ubicación. Instale el agente para ver dónde está el equipo.
          </p>
        )}
      </div>

      {acciones.length ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {acciones.map((accion) => (
            <button
              key={accion.key}
              type="button"
              className={`app-btn ${accion.key === 'retire' ? 'app-btn--ghost' : 'app-btn--primary'}`}
              disabled={!accion.enabled}
              title={accion.enabled ? undefined : accion.disabledReason}
              onClick={() => ejecutarAccion(accion.key)}
            >
              <i className={accion.icon} aria-hidden="true" />
              {ETIQUETA_ACCION[accion.key] ?? accion.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <DataTable
          title="Historial de movimientos"
          description="Asignaciones, traslados, mantenimientos y bajas registrados sobre este activo."
          columns={[
            { key: 'tipoNombre', header: 'Tipo', primary: true },
            { key: 'responsableNombre', header: 'Responsable' },
            { key: 'registradoPor', header: 'Registró' },
            {
              key: 'fechaAsignacion',
              header: 'Fecha',
              getValue: (row) => formatDate(row.fechaAsignacion),
              sortValue: (row) => row.fechaAsignacion,
            },
            {
              key: 'estadoVista',
              header: 'Estado',
              type: 'badge',
              tone: (row) => (row.activa ? 'success' : 'muted'),
            },
          ]}
          rows={movimientos}
          loading={asignaciones.isLoading}
          searchPlaceholder="Buscar por tipo o responsable"
          emptyTitle="Sin movimientos"
          emptyDescription="Cuando se registre una entrega, traslado o baja aparecerá en esta lista."
          renderRowActions={(row) =>
            row.documentoPdfUrl ? (
              <DescargarActaButton
                url={row.documentoPdfUrl}
                label="Descargar PDF"
                className="app-btn app-btn--ghost app-btn--sm"
              />
            ) : (
              <span className="text-sm text-text-muted">Sin acta</span>
            )
          }
        />
      </div>

      {editando ? (
        <ActivoFormOverlay
          open
          editing
          record={activo}
          categorias={categorias.data}
          proveedores={proveedores.data}
          ubicaciones={ubicaciones.data}
          sedes={sedes.data}
          idEmpresaActiva={idActiva}
          onClose={() => setEditando(false)}
          onSave={async (payload) => {
            await activoService.update(activo.id, payload);
            await refrescar();
            return saveSuccessResult({ created: false, entityLabel: 'activo' });
          }}
        />
      ) : null}

      <TrasladoFormOverlay
        open={movimiento === 'traslado'}
        prefill={movimiento === 'traslado' ? { idActivo: activo.id } : null}
        activos={activos.data}
        ubicaciones={ubicaciones.data}
        sedes={sedes.data}
        responsables={responsables.data}
        asignaciones={asignaciones.data}
        tipos={tipos.data}
        idEmpresaActiva={idActiva}
        onClose={() => setMovimiento(null)}
        onSave={async (values) => {
          await trasladoService.registrar({
            idActivo: Number(values.idActivo),
            idUbicacionDestino: Number(values.idUbicacionDestino),
            idUsuario: usuario?.id,
            idResponsable: Number(values.idResponsable),
            fecha: values.fecha,
            motivo: values.motivo,
          });
          await refrescar();
          return saveSuccessResult({ created: true, entityLabel: 'traslado' });
        }}
      />

      <MantenimientoFormOverlay
        open={movimiento === 'mantenimiento'}
        prefill={movimiento === 'mantenimiento' ? { idActivo: activo.id } : null}
        activos={activos.data}
        ubicaciones={ubicaciones.data}
        sedes={sedes.data}
        responsables={responsables.data}
        tiposMantenimiento={tiposMantenimiento.data}
        asignaciones={asignaciones.data}
        tipos={tipos.data}
        onClose={() => setMovimiento(null)}
        onSave={async (values) => {
          await mantenimientoService.registrar({
            idActivo: Number(values.idActivo),
            idUsuario: usuario?.id,
            idResponsable: Number(values.idResponsable),
            fecha: values.fecha,
            observaciones: values.observaciones,
            idTipoMantenimiento: Number(values.idTipoMantenimiento),
            descripcionProblema: values.descripcionProblema,
          });
          await refrescar();
          return saveSuccessResult({ created: true, entityLabel: 'mantenimiento' });
        }}
      />

      <BajaFormOverlay
        open={movimiento === 'baja'}
        prefill={movimiento === 'baja' ? { idActivo: activo.id } : null}
        activos={activos.data}
        motivos={motivos.data}
        usuarios={usuarios.data}
        usuariosUnavailableReason={canReadUsuarios ? null : usuarioService.USUARIOS_SIN_LECTURA}
        responsables={responsables.data}
        asignaciones={asignaciones.data}
        tipos={tipos.data}
        onClose={() => setMovimiento(null)}
        onSave={async (values) => {
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
          await refrescar();
          return saveSuccessResult({ created: true, entityLabel: 'baja' });
        }}
      />
    </section>
  );
}
