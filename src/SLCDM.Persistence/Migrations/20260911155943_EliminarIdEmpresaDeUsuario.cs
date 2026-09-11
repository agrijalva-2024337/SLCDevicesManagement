using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EliminarIdEmpresaDeUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_usuario_empresa_id_empresa",
                table: "usuario");

            migrationBuilder.DropIndex(
                name: "IX_usuario_id_empresa",
                table: "usuario");

            migrationBuilder.DropColumn(
                name: "id_empresa",
                table: "usuario");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "id_empresa",
                table: "usuario",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuario_id_empresa",
                table: "usuario",
                column: "id_empresa");

            migrationBuilder.AddForeignKey(
                name: "FK_usuario_empresa_id_empresa",
                table: "usuario",
                column: "id_empresa",
                principalTable: "empresa",
                principalColumn: "id_empresa",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
