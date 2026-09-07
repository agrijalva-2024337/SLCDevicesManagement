using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTokenPublicoActivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "token_publico",
                table: "activo",
                type: "varchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE activo SET token_publico = LOWER(REPLACE(CONVERT(varchar(36), NEWID()), '-', '')) WHERE token_publico IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "token_publico",
                table: "activo",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_activo_token_publico",
                table: "activo",
                column: "token_publico",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_activo_token_publico",
                table: "activo");

            migrationBuilder.DropColumn(
                name: "token_publico",
                table: "activo");
        }
    }
}
