using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RelajarConstraintHistorialActivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_historial_activo_una_sola_fuente",
                table: "historial_activo");

            migrationBuilder.AddCheckConstraint(
                name: "ck_historial_activo_una_sola_fuente",
                table: "historial_activo",
                sql: "[id_asignacion] IS NULL OR [id_detalle_activo] IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_historial_activo_una_sola_fuente",
                table: "historial_activo");

            migrationBuilder.AddCheckConstraint(
                name: "ck_historial_activo_una_sola_fuente",
                table: "historial_activo",
                sql: "([id_asignacion] IS NOT NULL AND [id_detalle_activo] IS NULL) OR ([id_asignacion] IS NULL AND [id_detalle_activo] IS NOT NULL)");
        }
    }
}
