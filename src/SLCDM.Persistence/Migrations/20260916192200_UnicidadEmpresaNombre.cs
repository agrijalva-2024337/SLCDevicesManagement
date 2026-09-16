using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UnicidadEmpresaNombre : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_empresa_nombre_unico",
                table: "empresa",
                column: "nombre",
                unique: true,
                filter: "[nombre] IS NOT NULL AND [nombre] <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_empresa_nombre_unico",
                table: "empresa");
        }
    }
}
