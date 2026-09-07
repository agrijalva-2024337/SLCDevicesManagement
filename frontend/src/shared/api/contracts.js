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
 * @typedef {object} RedConocidaDto
 * Punto de acceso Wi-Fi conocido. No tiene `habilitado` (DELETE real, no disable).
 * `bssid` es único, varchar(17), formato MAC `aa:bb:cc:dd:ee:ff`.
 * @property {number} id
 * @property {string} bssid
 * @property {number} idUbicacion
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
 * @property {string | null} [tokenConsulta] código público del QR; [API] nombre por confirmar
 *
 * @typedef {object} DispositivoRastreoDto
 * `GET /api/Dispositivos/rastreo`. Coordenadas salen de Ubicacion (asignada o detectada).
 * @property {number} id
 * @property {number} idActivo
 * @property {string} nombreActivo
 * @property {number | null} idUbicacionAsignada
 * @property {number | null} idUbicacionDetectada
 * @property {string | null} ultimoUsoEn
 * @property {boolean} fueraDeRango
 * @property {boolean} revocado
 * @property {string} creadoEn
 * @property {string | null} expiraEn
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
 * @property {string | null} [documentoPdfGeneradoEn]
 * @property {string | null} [hashDocumento] SHA-256 hex del acta original; [API] nombre por confirmar
 *
 * @typedef {object} VerificacionPdfDto
 * Resultado de `POST /api/Asignaciones/{id}/pdf/verificar`. [API] forma por confirmar.
 * @property {boolean} coincide
 * @property {string | null} hashRegistro
 * @property {string | null} firmaDocumento
 * @property {string | null} fechaGenerado
 *
 * @typedef {object} ConsultaPublicaActivoDto
 * Ficha anónima del QR. Sin costos ni factura.
 * @property {string} nombre
 * @property {string | null} marca
 * @property {string | null} modelo
 * @property {string | null} numeroSerie
 * @property {string | null} categoria
 * @property {string | null} empresa
 * @property {string | null} sede
 * @property {string | null} ubicacion
 * @property {string | null} estado
 * @property {string | null} responsable
 * @property {string | null} area
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
 *
 * estadoOperativo en Reportes: "disponible" | "asignado" | "mantenimiento" | "baja"
 *
 * @typedef {object} InventarioEmpresaResumenDto
 * @property {number} idEmpresa
 * @property {string} nombreEmpresa
 * @property {number} totalActivos
 * @property {number} disponibles
 * @property {number} asignados
 * @property {number} enMantenimiento
 * @property {number} dadosDeBaja
 * @property {number} costoAdquisicionTotal
 *
 * @typedef {object} ActivosPorSedeDto
 * @property {number} idSede
 * @property {string} nombreSede
 * @property {number} idEmpresa
 * @property {number} totalActivos
 * @property {number} disponibles
 * @property {number} asignados
 * @property {number} enMantenimiento
 * @property {number} dadosDeBaja
 *
 * @typedef {object} ActivosPorUbicacionDto
 * @property {number} idUbicacion
 * @property {string} nombreUbicacion
 * @property {number} idSede
 * @property {string} nombreSede
 * @property {number} idEmpresa
 * @property {number} totalActivos
 * @property {number} disponibles
 * @property {number} asignados
 * @property {number} enMantenimiento
 * @property {number} dadosDeBaja
 *
 * @typedef {object} ActivosPorCategoriaDto
 * @property {number} idCategoriaActivo
 * @property {string} nombreCategoria
 * @property {number} totalActivos
 * @property {number} disponibles
 * @property {number} asignados
 * @property {number} enMantenimiento
 * @property {number} dadosDeBaja
 *
 * @typedef {object} ActivosPorResponsableDto
 * @property {number} idResponsable
 * @property {string} nombreResponsable
 * @property {number} totalAsignados
 *
 * @typedef {object} ActivoReporteDto
 * @property {ActivoDto} activo
 * @property {'disponible' | 'asignado' | 'mantenimiento' | 'baja'} estadoOperativo
 * @property {number} idSede
 * @property {string} nombreSede
 * @property {number | null} idResponsable
 *
 * @typedef {object} GarantiaPorVencerDto
 * @property {ActivoDto} activo
 * @property {string} fechaVencimientoGarantia
 * @property {number} diasRestantes
 * @property {number} idSede
 * @property {string} nombreSede
 *
 * @typedef {object} DiferenciaInventarioReporteDto
 * @property {number} idHistoricoInventario
 * @property {string} nombreSede
 * @property {string} fechaInicio
 * @property {string} tipoDiferencia
 * @property {number} idActivo
 * @property {string} nombreActivo
 * @property {string | null} observaciones
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

export const ESTADO_OPERATIVO = {
  Disponible: 'disponible',
  Asignado: 'asignado',
  Mantenimiento: 'mantenimiento',
  Baja: 'baja',
};

export const ESTADO_OPERATIVO_LABEL = {
  [ESTADO_OPERATIVO.Disponible]: 'Disponible',
  [ESTADO_OPERATIVO.Asignado]: 'Asignado',
  [ESTADO_OPERATIVO.Mantenimiento]: 'En mantenimiento',
  [ESTADO_OPERATIVO.Baja]: 'Dado de baja',
};

export const ESTADO_OPERATIVO_TONE = {
  [ESTADO_OPERATIVO.Disponible]: 'success',
  [ESTADO_OPERATIVO.Asignado]: 'info',
  [ESTADO_OPERATIVO.Mantenimiento]: 'warning',
  [ESTADO_OPERATIVO.Baja]: 'danger',
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
