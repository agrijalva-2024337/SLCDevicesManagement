export async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256File(file) {
  return sha256Hex(await file.arrayBuffer());
}

export function formatHash(value) {
  if (!value) return '—';
  return String(value).toLowerCase();
}
