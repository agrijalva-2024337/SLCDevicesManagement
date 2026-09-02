/**
 * Contratos del cliente HTTP alineados a los DTOs de Application.
 * No se importan en runtime: sirven de referencia para servicios y hooks.
 *
 * @typedef {0 | 1 | 2 | 3} RolUsuario
 * Consulta = 0, OperadorInventario = 1, AdministradorEmpresa = 2, AdministradorGeneral = 3
 *
 * @typedef {0 | 1 | 2} TipoOperacionBitacora
 * Creacion = 0, Modificacion = 1, Eliminacion = 2
 *
 * @typedef {object} LoginRequest
 * @property {string} emailOrUsername
 * @property {string} password
 *
 * @typedef {object} AuthenticatedUserDto
 * @property {number} id
 * @property {string} username
 * @property {string} nombre
 * @property {string} email
 * @property {RolUsuario} rol
 * @property {string} role
 * @property {number | null} idEmpresa
 *
 * @typedef {object} LoginResponse
 * @property {boolean} success
 * @property {string} message
 * @property {string} token
 * @property {string} tokenType
 * @property {string} expiresAt
 * @property {AuthenticatedUserDto} userDetails
 *
 * @typedef {object} UsuarioSesion
 * @property {number} id
 * @property {number | null} idEmpresa
 * @property {string} nombres
 * @property {string} correo
 * @property {string} username
 * @property {RolUsuario} rol
 * @property {string} role
 *
 * @typedef {object} PaisDto
 * @property {number} id
 * @property {string} nombre
 * @property {string} codigoIso2
 * @property {string} codigoIso3
 * @property {string | null} codigoTelefonico
 *
 * @typedef {object} EmpresaDto
 * @property {number} id
 * @property {boolean} habilitado
 * @property {string} nombre
 * @property {string} nitCodigo
 * @property {string | null} direccion
 * @property {string | null} telefono
 *
 * @typedef {object} SedeDto
 * @property {number} id
 * @property {boolean} habilitado
 * @property {number} idEmpresa
 * @property {number} idPais
 * @property {string} nombre
 * @property {string | null} direccion
 * @property {string | null} ciudad
 *
 * @typedef {object} AreaDto
 * @property {number} id
 * @property {boolean} habilitado
 * @property {number} idSede
 * @property {string} nombre
 * @property {string | null} descripcion
 *
 * @typedef {object} UsuarioDto
 * @property {number} id
 * @property {boolean} habilitado
 * @property {number | null} idEmpresa
 * @property {string} nombres
 * @property {string} apellidos
 * @property {string} correo
 * @property {string} username
 * @property {RolUsuario} rol
 * @property {string} fechaCreacion
 *
 * @typedef {object} ResponsableDto
 * @property {number} id
 * @property {number} idArea
 * @property {string} nombreCompleto
 * @property {string | null} cargo
 * @property {string | null} correo
 * @property {string | null} telefono
 * @property {boolean} habilitado
 *
 * @typedef {object} BitacoraDto
 * @property {number} id
 * @property {number} idUsuario
 * @property {string} fechaHora
 * @property {TipoOperacionBitacora} tipoOperacion
 * @property {string} entidadAfectada
 * @property {string | null} descripcion
 * @property {string | null} informacionAnterior
 * @property {string | null} informacionNueva
 *
 * @typedef {object} EstadoDto
 * @property {number} id
 * @property {string} nombre
 * @property {string | null} descripcion
 *
 * @typedef {object} TipoAsignacionDto
 * @property {number} id
 * @property {string} nombre
 * @property {string | null} descripcion
 *
 * @typedef {object} CategoriaActivoDto
 * @property {number} id
 * @property {boolean} habilitado
 * @property {string} nombre
 * @property {string | null} descripcion
 *
 * @typedef {object} ProveedorDto
 * @property {number} id
 * @property {boolean} habilitado
 * @property {number} idEmpresa
 * @property {string} nombre
 * @property {string} nit
 * @property {string | null} nombreContacto
 * @property {string | null} telefono
 * @property {string | null} corre
 * El backend serializa `Corre` (typo de Application). El servicio de catálogo lo mapea a `correo`.
 *
 * @typedef {object} UbicacionDto
 * @property {number} id
 * @property {boolean} habilitado
 * @property {number} idSede
 * @property {string} nombre
 * @property {string | null} descripcion
 * @property {number} latitud
 * @property {number} longitud
 *
 * @typedef {object} ActivoDto
 * @property {number} id
 * @property {number} idCategoriaActivo
 * @property {number} idProveedor
 * @property {number} idUbicacion
 * @property {string} nombre
 * @property {string | null} descripcion
 * @property {string | null} marca
 * @property {string | null} modelo
 * @property {string | null} numeroSerie
 * @property {string} fechaCompra
 * @property {number} costoAdquisicion
 * @property {string | null} moneda
 * @property {string | null} numeroFactura
 * @property {string} fechaVencimientoGarantia
 * @property {string | null} observaciones
 *
 * @typedef {object} AsignacionDto
 * @property {number} id
 * @property {number} idActivo
 * @property {number} idUsuario
 * @property {number} idResponsable
 * @property {number} idEstado
 * @property {number} idTipoAsignacion
 * @property {string} fechaAsignacion
 * @property {string | null} fechaDevolucion
 * @property {boolean} activa
 * @property {string | null} observaciones
 * @property {string | null} documentoPdfUrl
 *
 * @typedef {object} HistoricoInventarioDto
 * @property {number} id
 * @property {number} idSede
 * @property {boolean} cerrado
 * @property {string | null} responsable
 * @property {string} fechaInicio
 * @property {string | null} fechaCierre
 * @property {string | null} observaciones
 *
 * @typedef {object} DetalleActivoDto
 * @property {number} id
 * @property {number} idActivo
 * @property {number} idHistoricoInventario
 * @property {boolean} encontrado
 * @property {boolean} buenEstado
 * @property {string | null} observaciones
 * @property {string} fechaVerificacion
 *
 * @typedef {object} HistorialActivoDto
 * @property {number} id
 * @property {number | null} idAsignacion
 * @property {number | null} idDetalleActivo
 * @property {string} fechaHora
 * @property {string | null} tipoOperacion
 * @property {string | null} descripcion
 * @property {string | null} informacionAnterior
 * @property {string | null} informacionNueva
 */

export const RolUsuario = {
  Consulta: 0,
  OperadorInventario: 1,
  AdministradorEmpresa: 2,
  AdministradorGeneral: 3,
};

export const RolUsuarioClaim = {
  Consulta: 'Consulta',
  OperadorInventario: 'OperadorInventario',
  AdministradorEmpresa: 'AdministradorEmpresa',
  AdministradorGeneral: 'AdministradorGeneral',
};

export const TipoOperacionBitacora = {
  Creacion: 0,
  Modificacion: 1,
  Eliminacion: 2,
};

export const rolUsuarioLabel = {
  [RolUsuario.Consulta]: 'Consulta',
  [RolUsuario.OperadorInventario]: 'Operador de inventario',
  [RolUsuario.AdministradorEmpresa]: 'Administrador de empresa',
  [RolUsuario.AdministradorGeneral]: 'Administrador general',
};

export const AuthClaimTypes = {
  role: 'role',
  idEmpresa: 'id_empresa',
};

export function rolFromClaim(role) {
  if (role === RolUsuarioClaim.Consulta || role === RolUsuario.Consulta) return RolUsuario.Consulta;
  if (role === RolUsuarioClaim.OperadorInventario || role === RolUsuario.OperadorInventario) {
    return RolUsuario.OperadorInventario;
  }
  if (role === RolUsuarioClaim.AdministradorEmpresa || role === RolUsuario.AdministradorEmpresa) {
    return RolUsuario.AdministradorEmpresa;
  }
  if (role === RolUsuarioClaim.AdministradorGeneral || role === RolUsuario.AdministradorGeneral) {
    return RolUsuario.AdministradorGeneral;
  }
  return null;
}
