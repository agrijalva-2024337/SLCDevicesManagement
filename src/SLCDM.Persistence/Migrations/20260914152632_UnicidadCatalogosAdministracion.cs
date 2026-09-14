using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UnicidadCatalogosAdministracion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_responsable_dpi",
                table: "responsable");

            migrationBuilder.DropIndex(
                name: "IX_responsable_id_area",
                table: "responsable");

            migrationBuilder.CreateIndex(
                name: "ix_responsable_area_correo",
                table: "responsable",
                columns: new[] { "id_area", "correo" },
                unique: true,
                filter: "[correo] IS NOT NULL AND [correo] <> ''");

            migrationBuilder.CreateIndex(
                name: "ix_responsable_area_nombre",
                table: "responsable",
                columns: new[] { "id_area", "nombre_completo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_responsable_dpi",
                table: "responsable",
                column: "dpi",
                unique: true,
                filter: "[dpi] IS NOT NULL AND [dpi] <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_responsable_area_correo",
                table: "responsable");

            migrationBuilder.DropIndex(
                name: "ix_responsable_area_nombre",
                table: "responsable");

            migrationBuilder.DropIndex(
                name: "ix_responsable_dpi",
                table: "responsable");

            migrationBuilder.CreateIndex(
                name: "IX_responsable_dpi",
                table: "responsable",
                column: "dpi");

            migrationBuilder.CreateIndex(
                name: "IX_responsable_id_area",
                table: "responsable",
                column: "id_area");
        }
    }
}
