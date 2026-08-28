using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence;

/// <summary>
/// Implementacion real de IApplicationDbContext con EF Core. Igual que la
/// interfaz, este archivo lo va a tocar Gerardo en BE-05 para agregar los
/// DbSet de su grupo — si hay conflicto al mergear, se resuelve dejando las
/// propiedades de los dos, nunca borrando una.
/// </summary>
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Pais> Paises => Set<Pais>();
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Sede> Sedes => Set<Sede>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Responsable> Responsables => Set<Responsable>();
    public DbSet<Bitacora> Bitacoras => Set<Bitacora>();
    public DbSet<Estado> Estados => Set<Estado>();
    public DbSet<TipoAsignacion> TiposAsignacion => Set<TipoAsignacion>();
    public DbSet<CategoriaActivo> CategoriasActivo => Set<CategoriaActivo>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Ubicacion> Ubicaciones => Set<Ubicacion>();
    public DbSet<Activo> Activos => Set<Activo>();
    public DbSet<Asignacion> Asignaciones => Set<Asignacion>();
    public DbSet<HistoricoInventario> HistoricosInventario => Set<HistoricoInventario>();
    public DbSet<DetalleActivo> DetallesActivos => Set<DetalleActivo>();
    public DbSet<HistorialActivo> HistorialActivos => Set<HistorialActivo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}
