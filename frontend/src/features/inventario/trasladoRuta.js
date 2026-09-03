const RUTA_RE = /Traslado\s+(.+?)\s+→\s+(.+?)(?:\.|$)/;

export function formatTrasladoObservaciones({ origen, destino, detalle }) {
  const ruta = `Traslado ${origen} → ${destino}`;
  const extra = String(detalle ?? '').trim();
  if (!extra) return ruta;
  return `${ruta}. ${extra}`.slice(0, 300);
}

export function parseTrasladoRuta(observaciones) {
  const text = String(observaciones ?? '');
  const match = text.match(RUTA_RE);
  if (!match) {
    return { origen: null, destino: null };
  }
  return { origen: match[1].trim(), destino: match[2].trim() };
}

export function nombreUbicacion(ubicacion) {
  if (!ubicacion) return 'Sin ubicación';
  return ubicacion.nombre;
}

export function empresaIdDeUbicacion(ubicacion, sedes) {
  if (!ubicacion) return null;
  const sede = (sedes ?? []).find((item) => Number(item.id) === Number(ubicacion.idSede));
  return sede ? Number(sede.idEmpresa) : null;
}

export function ubicacionesDeEmpresa(ubicaciones, sedes, idEmpresa) {
  const habilitadas = (ubicaciones ?? []).filter((item) => item.habilitado !== false);
  if (idEmpresa == null || idEmpresa === '') return habilitadas;
  const wanted = Number(idEmpresa);
  return habilitadas.filter((ubicacion) => empresaIdDeUbicacion(ubicacion, sedes) === wanted);
}

export function empresaIdDeActivo(activo, ubicaciones, sedes) {
  if (!activo?.idUbicacion) return null;
  const ubicacion = (ubicaciones ?? []).find((item) => Number(item.id) === Number(activo.idUbicacion));
  return empresaIdDeUbicacion(ubicacion, sedes);
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function initialTrasladoValues(prefill, { activos, ubicaciones } = {}) {
  const idActivo = prefill?.idActivo ? String(prefill.idActivo) : '';
  const activo = (activos ?? []).find((item) => Number(item.id) === Number(idActivo));
  const ubicacion = (ubicaciones ?? []).find((item) => Number(item.id) === Number(activo?.idUbicacion));
  return {
    idActivo,
    origen: idActivo ? nombreUbicacion(ubicacion) : '',
    idUbicacionDestino: '',
    idResponsable: prefill?.idResponsable ? String(prefill.idResponsable) : '',
    fecha: todayIsoDate(),
    observaciones: '',
  };
}
