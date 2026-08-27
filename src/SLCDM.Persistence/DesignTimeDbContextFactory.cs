using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SLCDM.Persistence;

/// <summary>
/// Le permite a `dotnet ef` construir un ApplicationDbContext SIN depender
/// de que SLCDM.Api ya tenga el DbContext registrado en Program.cs (eso es
/// BE-07/BE-08, todavia no esta hecho). Gracias a esto, BE-06 (migracion +
/// script SQL) se puede generar corriendo el comando solo contra este
/// proyecto, sin --startup-project:
///
///   dotnet ef migrations add InitialCreate --project src/SLCDM.Persistence
///
/// La cadena de conexion NO se sube al repo: se lee de la variable de
/// entorno CONNECTIONSTRINGS__DEFAULTCONNECTION, y si no existe usa un
/// placeholder valido solo para que EF pueda generar el modelo (no hace
/// falta una base real corriendo para `migrations add` o `migrations
/// script` — si hace falta para `database update`).
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("CONNECTIONSTRINGS__DEFAULTCONNECTION")
            ?? "Server=localhost;Database=DercasInventario;Trusted_Connection=True;TrustServerCertificate=True;";

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
