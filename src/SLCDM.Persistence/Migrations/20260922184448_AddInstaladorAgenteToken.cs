using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInstaladorAgenteToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "instalador_agente_token",
                columns: table => new
                {
                    id_instalador_agente_token = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    token = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    id_usuario_creador = table.Column<int>(type: "int", nullable: false),
                    creado_en = table.Column<DateTime>(type: "datetime2", nullable: false),
                    expira_en = table.Column<DateTime>(type: "datetime2", nullable: false),
                    usado_en = table.Column<DateTime>(type: "datetime2", nullable: true),
                    revocado = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_instalador_agente_token", x => x.id_instalador_agente_token);
                    table.ForeignKey(
                        name: "FK_instalador_agente_token_usuario_id_usuario_creador",
                        column: x => x.id_usuario_creador,
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_instalador_agente_token_id_usuario_creador",
                table: "instalador_agente_token",
                column: "id_usuario_creador");

            migrationBuilder.CreateIndex(
                name: "IX_instalador_agente_token_token",
                table: "instalador_agente_token",
                column: "token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "instalador_agente_token");
        }
    }
}
