using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EstadoYTipoAsignacionPorEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tipo_asignacion_nombre",
                table: "tipo_asignacion");

            migrationBuilder.DropIndex(
                name: "IX_estado_nombre",
                table: "estado");

            migrationBuilder.AddColumn<int>(
                name: "id_empresa",
                table: "tipo_asignacion",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "id_empresa",
                table: "estado",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                """
                DECLARE @primeraEmpresa int = (SELECT TOP 1 id_empresa FROM empresa ORDER BY id_empresa);

                IF @primeraEmpresa IS NULL
                BEGIN
                    IF EXISTS (SELECT 1 FROM estado) OR EXISTS (SELECT 1 FROM tipo_asignacion)
                        THROW 50003, 'No hay empresas para asignar a estados y tipos de asignacion existentes.', 1;
                END
                ELSE
                BEGIN
                    UPDATE estado SET id_empresa = @primeraEmpresa WHERE id_empresa IS NULL;
                    UPDATE tipo_asignacion SET id_empresa = @primeraEmpresa WHERE id_empresa IS NULL;

                    SELECT id_estado, nombre, descripcion
                    INTO #estados_base
                    FROM estado;

                    INSERT INTO estado (nombre, descripcion, id_empresa)
                    SELECT b.nombre, b.descripcion, e.id_empresa
                    FROM #estados_base b
                    INNER JOIN empresa e ON e.id_empresa <> @primeraEmpresa;

                    SELECT id_tipo_asignacion, nombre, descripcion
                    INTO #tipos_base
                    FROM tipo_asignacion;

                    INSERT INTO tipo_asignacion (nombre, descripcion, id_empresa)
                    SELECT b.nombre, b.descripcion, e.id_empresa
                    FROM #tipos_base b
                    INNER JOIN empresa e ON e.id_empresa <> @primeraEmpresa;

                    UPDATE a
                    SET a.id_estado = e_nuevo.id_estado
                    FROM activo a
                    INNER JOIN proveedor pr ON pr.id_proveedor = a.id_proveedor
                    INNER JOIN estado e_origen ON e_origen.id_estado = a.id_estado
                    INNER JOIN estado e_nuevo ON e_nuevo.nombre = e_origen.nombre
                        AND e_nuevo.id_empresa = pr.id_empresa
                    WHERE e_origen.id_empresa <> pr.id_empresa;

                    UPDATE asig
                    SET asig.id_estado = e_nuevo.id_estado
                    FROM asignacion asig
                    INNER JOIN activo a ON a.id_activo = asig.id_activo
                    INNER JOIN proveedor pr ON pr.id_proveedor = a.id_proveedor
                    INNER JOIN estado e_origen ON e_origen.id_estado = asig.id_estado
                    INNER JOIN estado e_nuevo ON e_nuevo.nombre = e_origen.nombre
                        AND e_nuevo.id_empresa = pr.id_empresa
                    WHERE e_origen.id_empresa <> pr.id_empresa;

                    UPDATE asig
                    SET asig.id_tipo_asignacion = t_nuevo.id_tipo_asignacion
                    FROM asignacion asig
                    INNER JOIN activo a ON a.id_activo = asig.id_activo
                    INNER JOIN proveedor pr ON pr.id_proveedor = a.id_proveedor
                    INNER JOIN tipo_asignacion t_origen ON t_origen.id_tipo_asignacion = asig.id_tipo_asignacion
                    INNER JOIN tipo_asignacion t_nuevo ON t_nuevo.nombre = t_origen.nombre
                        AND t_nuevo.id_empresa = pr.id_empresa
                    WHERE t_origen.id_empresa <> pr.id_empresa;

                    DROP TABLE #estados_base;
                    DROP TABLE #tipos_base;
                END
                """);

            migrationBuilder.AlterColumn<int>(
                name: "id_empresa",
                table: "tipo_asignacion",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "id_empresa",
                table: "estado",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_tipo_asignacion_empresa_nombre",
                table: "tipo_asignacion",
                columns: new[] { "id_empresa", "nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_estado_empresa_nombre",
                table: "estado",
                columns: new[] { "id_empresa", "nombre" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_estado_empresa_id_empresa",
                table: "estado",
                column: "id_empresa",
                principalTable: "empresa",
                principalColumn: "id_empresa",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_tipo_asignacion_empresa_id_empresa",
                table: "tipo_asignacion",
                column: "id_empresa",
                principalTable: "empresa",
                principalColumn: "id_empresa",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_estado_empresa_id_empresa",
                table: "estado");

            migrationBuilder.DropForeignKey(
                name: "FK_tipo_asignacion_empresa_id_empresa",
                table: "tipo_asignacion");

            migrationBuilder.DropIndex(
                name: "ix_tipo_asignacion_empresa_nombre",
                table: "tipo_asignacion");

            migrationBuilder.DropIndex(
                name: "ix_estado_empresa_nombre",
                table: "estado");

            migrationBuilder.DropColumn(
                name: "id_empresa",
                table: "tipo_asignacion");

            migrationBuilder.DropColumn(
                name: "id_empresa",
                table: "estado");

            migrationBuilder.CreateIndex(
                name: "IX_tipo_asignacion_nombre",
                table: "tipo_asignacion",
                column: "nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_estado_nombre",
                table: "estado",
                column: "nombre",
                unique: true);
        }
    }
}
