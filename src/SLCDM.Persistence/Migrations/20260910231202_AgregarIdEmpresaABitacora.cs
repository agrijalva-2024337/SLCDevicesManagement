using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AgregarIdEmpresaABitacora : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "id_empresa",
                table: "bitacora",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_bitacora_id_empresa",
                table: "bitacora",
                column: "id_empresa");

            migrationBuilder.AddForeignKey(
                name: "FK_bitacora_empresa_id_empresa",
                table: "bitacora",
                column: "id_empresa",
                principalTable: "empresa",
                principalColumn: "id_empresa",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bitacora_empresa_id_empresa",
                table: "bitacora");

            migrationBuilder.DropIndex(
                name: "IX_bitacora_id_empresa",
                table: "bitacora");

            migrationBuilder.DropColumn(
                name: "id_empresa",
                table: "bitacora");
        }
    }
}
