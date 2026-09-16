using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidarPaisesGlobalYQuitarIdEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Consolida copias por empresa (codigo_iso2) antes de quitar id_empresa.
            // Canonico = MIN(id_pais) por codigo_iso2; sedes se repuntan y luego se borran copias.
            migrationBuilder.Sql(
                """
                UPDATE s
                SET s.id_pais = canon.id_pais_canonico
                FROM sede s
                INNER JOIN pais p ON p.id_pais = s.id_pais
                INNER JOIN (
                    SELECT codigo_iso2, MIN(id_pais) AS id_pais_canonico
                    FROM pais
                    GROUP BY codigo_iso2
                ) canon ON canon.codigo_iso2 = p.codigo_iso2
                WHERE s.id_pais <> canon.id_pais_canonico;

                DELETE p
                FROM pais p
                INNER JOIN (
                    SELECT codigo_iso2, MIN(id_pais) AS id_pais_canonico
                    FROM pais
                    GROUP BY codigo_iso2
                ) canon ON canon.codigo_iso2 = p.codigo_iso2
                WHERE p.id_pais <> canon.id_pais_canonico;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_pais_empresa_id_empresa",
                table: "pais");

            migrationBuilder.DropIndex(
                name: "ix_pais_empresa_iso2",
                table: "pais");

            migrationBuilder.DropIndex(
                name: "ix_pais_empresa_iso3",
                table: "pais");

            migrationBuilder.DropColumn(
                name: "id_empresa",
                table: "pais");

            migrationBuilder.CreateIndex(
                name: "IX_pais_codigo_iso2",
                table: "pais",
                column: "codigo_iso2",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pais_codigo_iso3",
                table: "pais",
                column: "codigo_iso3",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_pais_codigo_iso2",
                table: "pais");

            migrationBuilder.DropIndex(
                name: "IX_pais_codigo_iso3",
                table: "pais");

            migrationBuilder.AddColumn<int>(
                name: "id_empresa",
                table: "pais",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "ix_pais_empresa_iso2",
                table: "pais",
                columns: new[] { "id_empresa", "codigo_iso2" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pais_empresa_iso3",
                table: "pais",
                columns: new[] { "id_empresa", "codigo_iso3" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_pais_empresa_id_empresa",
                table: "pais",
                column: "id_empresa",
                principalTable: "empresa",
                principalColumn: "id_empresa",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
