/**
 * Aviso cuando el Admin general elige en el form una empresa distinta
 * a la que estaba activa al abrir el formulario.
 */
export function empresaMismatchHint({
  idEmpresaForm,
  idEmpresaReferencia,
  empresas = [],
  entityLabel = 'registro',
} = {}) {
  if (idEmpresaReferencia == null || idEmpresaReferencia === '') {
    return undefined;
  }
  if (idEmpresaForm == null || idEmpresaForm === '') {
    return undefined;
  }
  if (String(idEmpresaForm) === String(idEmpresaReferencia)) {
    return undefined;
  }

  const nombre = (id) => {
    const found = (empresas ?? []).find((item) => Number(item.id) === Number(id));
    return found?.nombre?.trim() || `empresa #${id}`;
  };

  return `Estás registrando esta ${entityLabel} para ${nombre(idEmpresaForm)}, distinta a la empresa activa arriba (${nombre(idEmpresaReferencia)}).`;
}

/** Inyecta el hint de desajuste en el campo idEmpresa (si existe). */
export function withEmpresaMismatchHint(fields, values, options) {
  const hint = empresaMismatchHint({
    idEmpresaForm: values?.idEmpresa,
    idEmpresaReferencia: options?.idEmpresaReferencia,
    empresas: options?.empresas,
    entityLabel: options?.entityLabel,
  });

  if (!hint) {
    return fields ?? [];
  }

  return (fields ?? []).map((field) => {
    if (field?.name !== 'idEmpresa' || field.readOnly) {
      return field;
    }
    return { ...field, hint, hintTone: 'warning' };
  });
}
