using System.ComponentModel.DataAnnotations;

namespace SLCDM.Domain.Entities;

/// <summary>
/// Tabla "Proveedor" del ERD: a quien se le compra un activo o quien da
/// mantenimiento externo. Catalogo por empresa (IdEmpresa), por eso hereda
/// de BaseAuditableEntity. IdEmpresa queda como int simple (sin navigation
/// property a Empresa) porque esa entidad se crea en otro ticket del sprint
/// (grupo nucleo empresarial); cuando exista, se puede agregar la
/// navegacion sin romper nada de lo que ya se construyo aqui.
/// </summary>

public class Proveedor: SLCDM.Domain.Common.BaseAuditableEntity {
    [Required(ErrorMessage = "El campo id empresa es obligatorio")]
    public int IdEmpresa { get; set; }

    [ForeignKey("IdEmpresa")]
    public Empresa? Empresa { get; set; }

    [Required(ErrorMessage = "El campo nombre es obligatorio")]
    [MaxLength(150, ErrorMessage = "El campo nombre no debe superar los 150 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo nit es obligatorio")]
    [MaxLength(50, ErrorMessage = "El campo nit no debe superar los 50 caracteres")]
    public string? Nit { get; set; }

    [MaxLength(100, ErrorMessage = "El campo nombre contacto no debe superar los 100 caracteres")]
    public string? NombreContacto { get; set; }
    
    [MaxLength(30, ErrorMessage = "El campo telefono no debe superar los 30 caracteres")]
    public string? Telefono { get; set; }   

    [MaxLength(150, ErrorMessage = "El campo email no debe superar los 150 caracteres")]
    public string? Email { get; set; }
}