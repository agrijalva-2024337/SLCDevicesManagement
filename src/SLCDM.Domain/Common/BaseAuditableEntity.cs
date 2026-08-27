namespace SLCDM.Domain.Common;

/// <summary>
/// Base para las entidades que participan del inventario multiempresa.
/// Aporta las columnas de auditoria/soft-delete comunes a todo el ERD:
/// habilitado, fecha de creacion y fecha de ultima modificacion. Son solo
/// propiedades — el valor se asigna desde Application/Persistence, esta
/// clase no conoce EF Core ni nada externo. Igual patron que usa Pais.
/// </summary>
public abstract class BaseAuditableEntity : BaseEntity
{
    public bool Habilitado { get; set; } = true;

    public DateTime FechaCreacion { get; set; }

    public DateTime? FechaModificacion { get; set; }
}
