using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGeolocalizacionDispositivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "distancia_sede_metros",
                table: "dispositivo_token",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "fuera_de_rango",
                table: "dispositivo_token",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ultima_direccion",
                table: "dispositivo_token",
                type: "varchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ultima_latitud",
                table: "dispositivo_token",
                type: "decimal(9,6)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ultima_longitud",
                table: "dispositivo_token",
                type: "decimal(9,6)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ultima_precision_metros",
                table: "dispositivo_token",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ultima_ubicacion_detectada_id",
                table: "dispositivo_token",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_dispositivo_token_ultima_ubicacion_detectada_id",
                table: "dispositivo_token",
                column: "ultima_ubicacion_detectada_id");

            migrationBuilder.AddForeignKey(
                name: "FK_dispositivo_token_ubicacion_ultima_ubicacion_detectada_id",
                table: "dispositivo_token",
                column: "ultima_ubicacion_detectada_id",
                principalTable: "ubicacion",
                principalColumn: "id_ubicacion",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_dispositivo_token_ubicacion_ultima_ubicacion_detectada_id",
                table: "dispositivo_token");

            migrationBuilder.DropIndex(
                name: "IX_dispositivo_token_ultima_ubicacion_detectada_id",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "distancia_sede_metros",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "fuera_de_rango",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "ultima_direccion",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "ultima_latitud",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "ultima_longitud",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "ultima_precision_metros",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "ultima_ubicacion_detectada_id",
                table: "dispositivo_token");
        }
    }
}
