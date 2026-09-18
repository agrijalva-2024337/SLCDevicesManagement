using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GuardarBytesActaAsignacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "asignacion_documento_pdf",
                columns: table => new
                {
                    id_asignacion = table.Column<int>(type: "int", nullable: false),
                    contenido = table.Column<byte[]>(type: "varbinary(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asignacion_documento_pdf", x => x.id_asignacion);
                    table.ForeignKey(
                        name: "FK_asignacion_documento_pdf_asignacion_id_asignacion",
                        column: x => x.id_asignacion,
                        principalTable: "asignacion",
                        principalColumn: "id_asignacion",
                        onDelete: ReferentialAction.Restrict);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "asignacion_documento_pdf");
        }
    }
}
