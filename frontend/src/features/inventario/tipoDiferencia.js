export const TIPO_DIFERENCIA = {
  Faltante: 'Faltante',
  NoEncontrado: 'NoEncontrado',
  MalEstado: 'MalEstado',
};

export const TIPO_DIFERENCIA_LABEL = {
  [TIPO_DIFERENCIA.Faltante]: 'Faltante',
  [TIPO_DIFERENCIA.NoEncontrado]: 'No encontrado',
  [TIPO_DIFERENCIA.MalEstado]: 'Mal estado',
};

export const TIPO_DIFERENCIA_TONE = {
  [TIPO_DIFERENCIA.Faltante]: 'warning',
  [TIPO_DIFERENCIA.NoEncontrado]: 'danger',
  [TIPO_DIFERENCIA.MalEstado]: 'warning',
};
