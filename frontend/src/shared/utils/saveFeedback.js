export function resolveSavedId(saved, fallbackId) {
  const fromSaved = Number(saved?.id);
  if (Number.isFinite(fromSaved) && fromSaved > 0) {
    return fromSaved;
  }

  const fromFallback = Number(fallbackId);
  if (Number.isFinite(fromFallback) && fromFallback > 0) {
    return fromFallback;
  }

  return null;
}

export function saveSuccessState(editing, extra = {}) {
  return {
    flash: editing ? 'Los cambios se guardaron correctamente.' : 'El registro se creó correctamente.',
    ...extra,
  };
}
