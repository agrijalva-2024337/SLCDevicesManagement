/**
 * Etiqueta cliente de catálogos globales (estado / tipo asignación) por empresa.
 * El backend sigue siendo global; el front filtra y recuerda el vínculo en localStorage.
 */
const STORAGE_KEY = 'slcdm_catalogo_empresa_scope';

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function rememberCatalogEmpresa(resource, id, idEmpresa) {
  if (id == null || id === '' || idEmpresa == null || idEmpresa === '') return;
  const all = readAll();
  const bucket = { ...(all[resource] ?? {}) };
  bucket[String(id)] = Number(idEmpresa);
  writeAll({ ...all, [resource]: bucket });
}

export function forgetCatalogEmpresa(resource, id) {
  if (id == null || id === '') return;
  const all = readAll();
  const bucket = { ...(all[resource] ?? {}) };
  delete bucket[String(id)];
  writeAll({ ...all, [resource]: bucket });
}

export function enrichWithEmpresaScope(resource, rows) {
  const bucket = readAll()[resource] ?? {};
  return (Array.isArray(rows) ? rows : []).map((row) => {
    if (row?.idEmpresa != null && row.idEmpresa !== '') return row;
    const tagged = bucket[String(row?.id)];
    if (tagged == null || !Number.isFinite(Number(tagged))) return row;
    return { ...row, idEmpresa: Number(tagged) };
  });
}
