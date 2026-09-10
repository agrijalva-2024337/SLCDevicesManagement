using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CrearUsuarioEmpresaYMigrarDatos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "usuario_empresa",
                columns: table => new
                {
                    id_usuario_empresa = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_usuario = table.Column<int>(type: "int", nullable: false),
                    id_empresa = table.Column<int>(type: "int", nullable: false),
                    rol = table.Column<string>(type: "varchar(50)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuario_empresa", x => x.id_usuario_empresa);
                    table.ForeignKey(
                        name: "FK_usuario_empresa_empresa_id_empresa",
                        column: x => x.id_empresa,
                        principalTable: "empresa",
                        principalColumn: "id_empresa",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_usuario_empresa_usuario_id_usuario",
                        column: x => x.id_usuario,
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_usuario_empresa_id_empresa",
                table: "usuario_empresa",
                column: "id_empresa");

            migrationBuilder.CreateIndex(
                name: "IX_usuario_empresa_id_usuario_id_empresa",
                table: "usuario_empresa",
                columns: new[] { "id_usuario", "id_empresa" },
                unique: true);

            // Backfill: una fila por usuario con IdEmpresa (AdministradorGeneral queda sin filas).
            migrationBuilder.Sql("""
                INSERT INTO usuario_empresa (id_usuario, id_empresa, rol)
                SELECT id_usuario, id_empresa, rol
                FROM usuario
                WHERE id_empresa IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1
                      FROM usuario_empresa ue
                      WHERE ue.id_usuario = usuario.id_usuario
                        AND ue.id_empresa = usuario.id_empresa);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "usuario_empresa");
        }
    }
}
