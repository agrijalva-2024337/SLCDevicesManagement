using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PaisPorEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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
                nullable: true);

            migrationBuilder.Sql(
                """
                DECLARE @primeraEmpresa int = (SELECT TOP 1 id_empresa FROM empresa ORDER BY id_empresa);

                IF @primeraEmpresa IS NULL
                BEGIN
                    IF EXISTS (SELECT 1 FROM pais)
                        THROW 50001, 'No hay empresas para asignar a los paises existentes.', 1;
                END
                ELSE
                BEGIN
                    UPDATE pais SET id_empresa = @primeraEmpresa WHERE id_empresa IS NULL;

                    SELECT id_pais, nombre, codigo_iso2, codigo_iso3, codigo_telefonico
                    INTO #paises_base
                    FROM pais;

                    INSERT INTO pais (nombre, codigo_iso2, codigo_iso3, codigo_telefonico, id_empresa)
                    SELECT p.nombre, p.codigo_iso2, p.codigo_iso3, p.codigo_telefonico, e.id_empresa
                    FROM #paises_base p
                    INNER JOIN empresa e ON e.id_empresa <> @primeraEmpresa;

                    UPDATE s
                    SET s.id_pais = p_nuevo.id_pais
                    FROM sede s
                    INNER JOIN pais p_origen ON p_origen.id_pais = s.id_pais
                    INNER JOIN pais p_nuevo ON p_nuevo.codigo_iso2 = p_origen.codigo_iso2
                        AND p_nuevo.id_empresa = s.id_empresa
                    WHERE p_origen.id_empresa <> s.id_empresa;

                    DROP TABLE #paises_base;
                END
                """);

            migrationBuilder.AlterColumn<int>(
                name: "id_empresa",
                table: "pais",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
    }
}
