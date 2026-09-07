using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCoordenadasDispositivoToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "distancia_sede_metros",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "ultima_direccion",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "ultima_precision_metros",
                table: "dispositivo_token");

            migrationBuilder.AddColumn<string>(
                name: "origen_coordenada",
                table: "dispositivo_token",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ultimo_bssid",
                table: "dispositivo_token",
                type: "varchar(17)",
                maxLength: 17,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "origen_coordenada",
                table: "dispositivo_token");

            migrationBuilder.DropColumn(
                name: "ultimo_bssid",
                table: "dispositivo_token");

            migrationBuilder.AddColumn<double>(
                name: "distancia_sede_metros",
                table: "dispositivo_token",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ultima_direccion",
                table: "dispositivo_token",
                type: "varchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ultima_precision_metros",
                table: "dispositivo_token",
                type: "float",
                nullable: true);
        }
    }
}
