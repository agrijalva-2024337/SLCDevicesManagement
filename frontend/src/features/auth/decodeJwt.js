function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return decodeURIComponent(
    [...binary].map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
  );
}

export function decodeJwt(token) {
  try {
    const parts = String(token ?? '').split('.');
    if (parts.length < 2) {
      return null;
    }
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

export function isJwtExpired(payload) {
  if (!payload?.exp) {
    return false;
  }
  return payload.exp * 1000 <= Date.now();
}
