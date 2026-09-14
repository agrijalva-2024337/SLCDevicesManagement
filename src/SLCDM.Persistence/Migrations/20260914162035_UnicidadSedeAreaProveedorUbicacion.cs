using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UnicidadSedeAreaProveedorUbicacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ubicacion_nombre",
                table: "ubicacion");

            migrationBuilder.DropIndex(
                name: "IX_proveedor_nit",
                table: "proveedor");

            migrationBuilder.CreateIndex(
                name: "ix_ubicacion_sede_nombre",
                table: "ubicacion",
                columns: new[] { "id_sede", "nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sede_empresa_nombre",
                table: "sede",
                columns: new[] { "id_empresa", "nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_proveedor_empresa_nit",
                table: "proveedor",
                columns: new[] { "id_empresa", "nit" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_proveedor_empresa_nombre",
                table: "proveedor",
                columns: new[] { "id_empresa", "nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_area_sede_nombre",
                table: "area",
                columns: new[] { "id_sede", "nombre" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_ubicacion_sede_nombre",
                table: "ubicacion");

            migrationBuilder.DropIndex(
                name: "ix_sede_empresa_nombre",
                table: "sede");

            migrationBuilder.DropIndex(
                name: "ix_proveedor_empresa_nit",
                table: "proveedor");

            migrationBuilder.DropIndex(
                name: "ix_proveedor_empresa_nombre",
                table: "proveedor");

            migrationBuilder.DropIndex(
                name: "ix_area_sede_nombre",
                table: "area");

            migrationBuilder.CreateIndex(
                name: "IX_ubicacion_nombre",
                table: "ubicacion",
                column: "nombre");

            migrationBuilder.CreateIndex(
                name: "IX_proveedor_nit",
                table: "proveedor",
                column: "nit");
        }
    }
}
