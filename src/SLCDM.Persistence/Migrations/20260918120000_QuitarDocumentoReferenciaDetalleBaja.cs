using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class QuitarDocumentoReferenciaDetalleBaja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "documento_referencia",
                table: "detalle_baja");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "documento_referencia",
                table: "detalle_baja",
                type: "varchar(300)",
                maxLength: 300,
                nullable: true);
        }
    }
}
