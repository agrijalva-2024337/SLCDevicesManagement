using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SLCDM.Persistence;

#nullable disable

namespace SLCDM.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260922215500_UnicidadSedeEmpresaDireccion")]
public partial class UnicidadSedeEmpresaDireccion : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "ix_sede_empresa_direccion",
            table: "sede",
            columns: new[] { "id_empresa", "direccion" },
            unique: true,
            filter: "[direccion] IS NOT NULL AND [direccion] <> ''");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_sede_empresa_direccion",
            table: "sede");
    }
}
