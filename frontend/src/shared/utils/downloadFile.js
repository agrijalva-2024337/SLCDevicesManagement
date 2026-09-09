import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';

export function filenameFromContentDisposition(header, fallback = 'documento.pdf') {
  if (!header) {
    return fallback;
  }

  const utf8 = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim().replaceAll('"', ''));
    } catch {
      /* header malformado: se usa filename= o el fallback */
    }
  }

  const ascii = /filename="?([^";]+)"?/i.exec(header);
  return ascii ? ascii[1].trim() : fallback;
}

export function withPdfExtension(name, fallback = 'acta.pdf') {
  const raw = String(name ?? '').trim() || fallback;
  return raw.toLowerCase().endsWith('.pdf') ? raw : `${raw}.pdf`;
}

export function apiPathFromUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) {
    return null;
  }

  const base = String(env.apiUrl ?? '').replace(/\/$/, '');
  if (base && (raw === base || raw.startsWith(`${base}/`))) {
    const path = raw.slice(base.length);
    return path.startsWith('/') ? path : `/${path}`;
  }

  if (raw.startsWith('/api/')) {
    return raw;
  }

  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.pathname.startsWith('/api/')) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return null;
  }

  return null;
}

export function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

async function asPdfBlob(data) {
  const blob = data instanceof Blob ? data : new Blob([data]);
  const type = String(blob.type ?? '').toLowerCase();
  if (type.includes('html') || type.includes('json') || type.includes('text/plain')) {
    throw new Error('El servidor no devolvió un PDF. Vuelva a iniciar sesión e intente de nuevo.');
  }

  const magic = await blob.slice(0, 5).text();
  if (!magic.startsWith('%PDF')) {
    throw new Error('El archivo descargado no es un PDF válido.');
  }

  if (type.includes('pdf')) {
    return blob;
  }

  return new Blob([blob], { type: 'application/pdf' });
}

export async function downloadPdfFromApi(path, fallbackName = 'acta.pdf') {
  const response = await httpClient.get(path, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  });
  const blob = await asPdfBlob(response.data);
  const filename = withPdfExtension(
    filenameFromContentDisposition(response.headers['content-disposition'], fallbackName),
    fallbackName,
  );
  triggerBlobDownload(blob, filename);
}

export async function downloadActaPdf(url, fallbackName = 'acta.pdf') {
  const raw = String(url ?? '').trim();
  if (!raw) {
    throw new Error('Esta asignación no tiene un acta para descargar.');
  }

  const apiPath = apiPathFromUrl(raw);
  if (apiPath) {
    const idMatch = /\/api\/Asignaciones\/(\d+)\/pdf/i.exec(apiPath);
    const name = fallbackName !== 'acta.pdf' ? fallbackName : idMatch ? `acta-${idMatch[1]}.pdf` : fallbackName;
    await downloadPdfFromApi(apiPath, withPdfExtension(name));
    return;
  }

  triggerBlobDownload(await fetchPublicPdf(raw), withPdfExtension(fallbackName));
}

async function fetchPublicPdf(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se pudo descargar el acta en PDF.');
  }
  return asPdfBlob(await response.blob());
}
