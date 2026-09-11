import { usuariosSesion } from '@/features/auth/mocks/usuariosSesion';

export const usuarios = usuariosSesion.map((usuario) => {
  const idsEmpresas =
    usuario.idsEmpresas ??
    usuario.empresasAutorizadas ??
    (usuario.idEmpresa == null ? [] : [usuario.idEmpresa]);

  return {
    ...usuario,
    idsEmpresas,
    idEmpresa: idsEmpresas.length > 0 ? idsEmpresas[0] : null,
  };
});
