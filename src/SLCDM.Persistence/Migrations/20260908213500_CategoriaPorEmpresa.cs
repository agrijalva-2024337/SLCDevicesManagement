using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CategoriaPorEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_categoria_activo_nombre",
                table: "categoria_activo");

            migrationBuilder.AddColumn<int>(
                name: "id_empresa",
                table: "categoria_activo",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                """
                DECLARE @primeraEmpresa int = (SELECT TOP 1 id_empresa FROM empresa ORDER BY id_empresa);

                IF @primeraEmpresa IS NULL
                BEGIN
                    IF EXISTS (SELECT 1 FROM categoria_activo)
                        THROW 50002, 'No hay empresas para asignar a las categorias existentes.', 1;
                END
                ELSE
                BEGIN
                    UPDATE categoria_activo SET id_empresa = @primeraEmpresa WHERE id_empresa IS NULL;
                END
                """);

            migrationBuilder.AlterColumn<int>(
                name: "id_empresa",
                table: "categoria_activo",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_categoria_activo_empresa_nombre",
                table: "categoria_activo",
                columns: new[] { "id_empresa", "nombre" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_categoria_activo_empresa_id_empresa",
                table: "categoria_activo",
                column: "id_empresa",
                principalTable: "empresa",
                principalColumn: "id_empresa",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_categoria_activo_empresa_id_empresa",
                table: "categoria_activo");

            migrationBuilder.DropIndex(
                name: "ix_categoria_activo_empresa_nombre",
                table: "categoria_activo");

            migrationBuilder.DropColumn(
                name: "id_empresa",
                table: "categoria_activo");

            migrationBuilder.CreateIndex(
                name: "IX_categoria_activo_nombre",
                table: "categoria_activo",
                column: "nombre",
                unique: true);
        }
    }
}
