export function signatureToPayload(dataUrl) {
  if (!dataUrl) return null;
  const index = dataUrl.indexOf(',');
  return index >= 0 ? dataUrl.slice(index + 1) : dataUrl;
}
