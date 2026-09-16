using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Domain.Entities;
using SLCDM.Domain.Enums;

namespace SLCDM.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        IPasswordHashService passwordHasher,
        IConfiguration configuration)
    {
        if (await context.Usuarios.IgnoreQueryFilters().AnyAsync())
        {
            return;
        }

        var seedPassword = configuration["SeedAdmin:Password"]
            ?? throw new InvalidOperationException(
                "Falta configurar SeedAdmin:Password (variable de entorno SeedAdmin__Password) " +
                "antes de arrancar con la base de datos vacia.");

        var admin = new Usuario
        {
            Nombres = "Admin",
            Apellidos = "General",
            Correo = configuration["SeedAdmin:Correo"] ?? "admin@slc.com.gt",
            Username = configuration["SeedAdmin:Username"] ?? "admin",
            PasswordHash = passwordHasher.HashPassword(seedPassword),
            Rol = RolUsuario.AdministradorGeneral,
            Habilitado = true,
            FechaCreacion = DateTime.UtcNow
        };

        context.Usuarios.Add(admin);
        await context.SaveChangesAsync();
    }
}
