// [API] Workaround: AsignacionDto no trae DetalleBaja. El handler de CreateBajaCommand
// escribe HistorialActivo.informacionNueva con este formato. Cuando exista GET de
// DetalleBaja (o el DTO crezca), borrar este archivo y sus llamadas.

const KEYS = ['id_motivo_baja', 'documento_pdf_url', 'id_autorizado_por', 'id_responsable'];

function asId(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseDetalleBaja(informacionNueva) {
  const text = String(informacionNueva ?? '').trim();
  if (!text) return null;

  const bag = {};
  for (const part of text.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (KEYS.includes(key)) {
      bag[key] = value;
    }
  }

  if (!KEYS.some((key) => bag[key] != null && bag[key] !== '')) {
    return null;
  }

  return {
    idMotivoBaja: asId(bag.id_motivo_baja),
    documentoPdfUrl: bag.documento_pdf_url || null,
    idAutorizadoPor: asId(bag.id_autorizado_por),
    idResponsable: asId(bag.id_responsable),
  };
}
