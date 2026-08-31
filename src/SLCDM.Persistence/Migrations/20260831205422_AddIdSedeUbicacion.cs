using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIdSedeUbicacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "id_sede",
                table: "ubicacion",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ubicacion_id_sede",
                table: "ubicacion",
                column: "id_sede");

            migrationBuilder.AddForeignKey(
                name: "FK_ubicacion_sede_id_sede",
                table: "ubicacion",
                column: "id_sede",
                principalTable: "sede",
                principalColumn: "id_sede",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ubicacion_sede_id_sede",
                table: "ubicacion");

            migrationBuilder.DropIndex(
                name: "IX_ubicacion_id_sede",
                table: "ubicacion");

            migrationBuilder.DropColumn(
                name: "id_sede",
                table: "ubicacion");
        }
    }
}
