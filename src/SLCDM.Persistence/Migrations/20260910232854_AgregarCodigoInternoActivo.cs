using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCodigoInternoActivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "codigo_interno",
                table: "activo",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_activo_codigo_interno_unico",
                table: "activo",
                column: "codigo_interno",
                unique: true,
                filter: "[codigo_interno] IS NOT NULL AND [codigo_interno] <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_activo_codigo_interno_unico",
                table: "activo");

            migrationBuilder.DropColumn(
                name: "codigo_interno",
                table: "activo");
        }
    }
}
