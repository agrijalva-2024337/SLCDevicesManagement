using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SLCDM.Persistence;

#nullable disable

namespace SLCDM.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260923162000_AsignacionIdResponsableNullable")]
public partial class AsignacionIdResponsableNullable : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<int>(
            name: "id_responsable",
            table: "asignacion",
            type: "int",
            nullable: true,
            oldClrType: typeof(int),
            oldType: "int");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE asignacion SET id_responsable = (
                SELECT TOP 1 id_responsable FROM responsable ORDER BY id_responsable
            ) WHERE id_responsable IS NULL;
            """);

        migrationBuilder.AlterColumn<int>(
            name: "id_responsable",
            table: "asignacion",
            type: "int",
            nullable: false,
            oldClrType: typeof(int),
            oldType: "int",
            oldNullable: true);
    }
}
