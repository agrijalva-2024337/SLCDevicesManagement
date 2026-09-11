using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUser;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : this(options, new DesignTimeCurrentUserService())
    {
    }

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUser)
        : base(options)
    {
        _currentUser = currentUser;
    }

    /// <summary>
    /// Expuesto para que EF reevalue el filtro en cada query (no capturar el valor al compilar el modelo).
    /// </summary>
    public bool IgnoreEmpresaFilter => _currentUser.IsAdministradorGeneral;

    /// <summary>
    /// Empresas del usuario autenticado. Usado por los query filters multiempresa.
    /// Debe ser List (no int[]): en .NET 9+/10 int[].Contains resuelve a
    /// MemoryExtensions.Contains y EF no puede traducirlo a SQL (500 en catálogos/reportes).
    /// </summary>
    public List<int> EmpresasAutorizadas =>
        _currentUser.EmpresasAutorizadas as List<int>
        ?? _currentUser.EmpresasAutorizadas.ToList();

    /// <summary>Compat: primera empresa autorizada (o -1 si ninguna).</summary>
    public int TenantEmpresaId => EmpresasAutorizadas.Count > 0 ? EmpresasAutorizadas[0] : -1;

    public DbSet<Pais> Paises => Set<Pais>();
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Sede> Sedes => Set<Sede>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<UsuarioEmpresa> UsuariosEmpresas => Set<UsuarioEmpresa>();
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
    public DbSet<TipoMantenimiento> TiposMantenimiento => Set<TipoMantenimiento>();
    public DbSet<MotivoBaja> MotivosBaja => Set<MotivoBaja>();
    public DbSet<DetalleMantenimiento> DetallesMantenimiento => Set<DetalleMantenimiento>();
    public DbSet<DetalleBaja> DetallesBaja => Set<DetalleBaja>();
    public DbSet<DetalleTraslado> DetallesTraslado => Set<DetalleTraslado>();
    public DbSet<DispositivoToken> DispositivosToken => Set<DispositivoToken>();
    public DbSet<RedConocida> RedesConocidas => Set<RedConocida>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        ApplyEmpresaQueryFilters(modelBuilder);
        base.OnModelCreating(modelBuilder);
    }

    /// <summary>
    /// Multiempresa: el Administrador general ve todo; el resto solo datos de
    /// sus empresas autorizadas (claims JWT / usuario_empresa).
    /// </summary>
    private void ApplyEmpresaQueryFilters(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Empresa>().HasQueryFilter(e =>
            IgnoreEmpresaFilter || EmpresasAutorizadas.Contains(e.Id));

        modelBuilder.Entity<Pais>().HasQueryFilter(p =>
            IgnoreEmpresaFilter || EmpresasAutorizadas.Contains(p.IdEmpresa));

        modelBuilder.Entity<Estado>().HasQueryFilter(e =>
            IgnoreEmpresaFilter || EmpresasAutorizadas.Contains(e.IdEmpresa));

        modelBuilder.Entity<TipoAsignacion>().HasQueryFilter(t =>
            IgnoreEmpresaFilter || EmpresasAutorizadas.Contains(t.IdEmpresa));

        modelBuilder.Entity<CategoriaActivo>().HasQueryFilter(c =>
            IgnoreEmpresaFilter || EmpresasAutorizadas.Contains(c.IdEmpresa));

        modelBuilder.Entity<Sede>().HasQueryFilter(s =>
            IgnoreEmpresaFilter || EmpresasAutorizadas.Contains(s.IdEmpresa));

        modelBuilder.Entity<Usuario>().HasQueryFilter(u =>
            IgnoreEmpresaFilter
            || UsuariosEmpresas.Any(ue => ue.IdUsuario == u.Id && EmpresasAutorizadas.Contains(ue.IdEmpresa)));

        modelBuilder.Entity<Proveedor>().HasQueryFilter(p =>
            IgnoreEmpresaFilter || EmpresasAutorizadas.Contains(p.IdEmpresa));

        modelBuilder.Entity<Area>().HasQueryFilter(a =>
            IgnoreEmpresaFilter || Sedes.Any(s => s.Id == a.IdSede));

        modelBuilder.Entity<Ubicacion>().HasQueryFilter(u =>
            IgnoreEmpresaFilter || Sedes.Any(s => s.Id == u.IdSede));

        modelBuilder.Entity<Responsable>().HasQueryFilter(r =>
            IgnoreEmpresaFilter || Areas.Any(a => a.Id == r.IdArea));

        modelBuilder.Entity<HistoricoInventario>().HasQueryFilter(h =>
            IgnoreEmpresaFilter || Sedes.Any(s => s.Id == h.IdSede));

        modelBuilder.Entity<Activo>().HasQueryFilter(a =>
            IgnoreEmpresaFilter || Proveedores.Any(p => p.Id == a.IdProveedor));

        modelBuilder.Entity<Asignacion>().HasQueryFilter(a =>
            IgnoreEmpresaFilter || Activos.Any(x => x.Id == a.IdActivo));

        modelBuilder.Entity<DetalleActivo>().HasQueryFilter(d =>
            IgnoreEmpresaFilter || Activos.Any(a => a.Id == d.IdActivo));

        // AdminGeneral (IgnoreEmpresaFilter) ve todas las filas, incluidas IdEmpresa NULL
        // (catalogos globales). Usuarios de empresa solo ven bitacora de sus tenants.
        modelBuilder.Entity<Bitacora>().HasQueryFilter(b =>
            IgnoreEmpresaFilter
            || (b.IdEmpresa.HasValue && EmpresasAutorizadas.Contains(b.IdEmpresa.Value)));

        modelBuilder.Entity<HistorialActivo>().HasQueryFilter(h =>
            IgnoreEmpresaFilter
            || (h.IdAsignacion.HasValue && Asignaciones.Any(a => a.Id == h.IdAsignacion))
            || (h.IdDetalleActivo.HasValue && DetallesActivos.Any(d => d.Id == h.IdDetalleActivo)));

        modelBuilder.Entity<DetalleMantenimiento>().HasQueryFilter(d =>
            IgnoreEmpresaFilter || Asignaciones.Any(a => a.Id == d.IdAsignacion));

        modelBuilder.Entity<DetalleBaja>().HasQueryFilter(d =>
            IgnoreEmpresaFilter || Asignaciones.Any(a => a.Id == d.IdAsignacion));

        modelBuilder.Entity<DetalleTraslado>().HasQueryFilter(d =>
            IgnoreEmpresaFilter || Asignaciones.Any(a => a.Id == d.IdAsignacion));

        modelBuilder.Entity<DispositivoToken>().HasQueryFilter(d =>
            IgnoreEmpresaFilter || Activos.Any(a => a.Id == d.IdActivo));

        modelBuilder.Entity<RedConocida>().HasQueryFilter(r =>
            IgnoreEmpresaFilter || Ubicaciones.Any(u => u.Id == r.IdUbicacion));
    }
}
