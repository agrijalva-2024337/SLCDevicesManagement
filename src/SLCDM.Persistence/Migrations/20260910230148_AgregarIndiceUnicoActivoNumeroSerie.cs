using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AgregarIndiceUnicoActivoNumeroSerie : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_activo_numero_serie",
                table: "activo");

            migrationBuilder.CreateIndex(
                name: "ix_activo_numero_serie_unico",
                table: "activo",
                column: "numero_serie",
                unique: true,
                filter: "[numero_serie] IS NOT NULL AND [numero_serie] <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_activo_numero_serie_unico",
                table: "activo");

            migrationBuilder.CreateIndex(
                name: "IX_activo_numero_serie",
                table: "activo",
                column: "numero_serie");
        }
    }
}
