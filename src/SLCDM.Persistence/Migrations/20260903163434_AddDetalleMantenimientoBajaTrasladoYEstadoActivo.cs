using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDetalleMantenimientoBajaTrasladoYEstadoActivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "id_estado",
                table: "activo",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "detalle_traslado",
                columns: table => new
                {
                    id_detalle_traslado = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_asignacion = table.Column<int>(type: "int", nullable: false),
                    id_ubicacion_origen = table.Column<int>(type: "int", nullable: false),
                    id_ubicacion_destino = table.Column<int>(type: "int", nullable: false),
                    motivo = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_detalle_traslado", x => x.id_detalle_traslado);
                    table.ForeignKey(
                        name: "FK_detalle_traslado_asignacion_id_asignacion",
                        column: x => x.id_asignacion,
                        principalTable: "asignacion",
                        principalColumn: "id_asignacion",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_detalle_traslado_ubicacion_id_ubicacion_destino",
                        column: x => x.id_ubicacion_destino,
                        principalTable: "ubicacion",
                        principalColumn: "id_ubicacion",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_detalle_traslado_ubicacion_id_ubicacion_origen",
                        column: x => x.id_ubicacion_origen,
                        principalTable: "ubicacion",
                        principalColumn: "id_ubicacion",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "motivo_baja",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    descripcion = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_motivo_baja", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tipo_mantenimiento",
                columns: table => new
                {
                    id_tipo_mantenimiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    descripcion = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tipo_mantenimiento", x => x.id_tipo_mantenimiento);
                });

            migrationBuilder.CreateTable(
                name: "detalle_baja",
                columns: table => new
                {
                    id_detalle_baja = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_asignacion = table.Column<int>(type: "int", nullable: false),
                    id_motivo_baja = table.Column<int>(type: "int", nullable: false),
                    documento_referencia = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: true),
                    id_autorizado_por = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_detalle_baja", x => x.id_detalle_baja);
                    table.ForeignKey(
                        name: "FK_detalle_baja_asignacion_id_asignacion",
                        column: x => x.id_asignacion,
                        principalTable: "asignacion",
                        principalColumn: "id_asignacion",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_detalle_baja_motivo_baja_id_motivo_baja",
                        column: x => x.id_motivo_baja,
                        principalTable: "motivo_baja",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_detalle_baja_usuario_id_autorizado_por",
                        column: x => x.id_autorizado_por,
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "detalle_mantenimiento",
                columns: table => new
                {
                    id_detalle_mantenimiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_asignacion = table.Column<int>(type: "int", nullable: false),
                    id_tipo_mantenimiento = table.Column<int>(type: "int", nullable: false),
                    descripcion_problema = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: false),
                    trabajo_realizado = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: true),
                    costo = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                    numero_factura = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_detalle_mantenimiento", x => x.id_detalle_mantenimiento);
                    table.ForeignKey(
                        name: "FK_detalle_mantenimiento_asignacion_id_asignacion",
                        column: x => x.id_asignacion,
                        principalTable: "asignacion",
                        principalColumn: "id_asignacion",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_detalle_mantenimiento_tipo_mantenimiento_id_tipo_mantenimiento",
                        column: x => x.id_tipo_mantenimiento,
                        principalTable: "tipo_mantenimiento",
                        principalColumn: "id_tipo_mantenimiento",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_activo_id_estado",
                table: "activo",
                column: "id_estado");

            migrationBuilder.CreateIndex(
                name: "IX_detalle_baja_id_asignacion",
                table: "detalle_baja",
                column: "id_asignacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_detalle_baja_id_autorizado_por",
                table: "detalle_baja",
                column: "id_autorizado_por");

            migrationBuilder.CreateIndex(
                name: "IX_detalle_baja_id_motivo_baja",
                table: "detalle_baja",
                column: "id_motivo_baja");

            migrationBuilder.CreateIndex(
                name: "IX_detalle_mantenimiento_id_asignacion",
                table: "detalle_mantenimiento",
                column: "id_asignacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_detalle_mantenimiento_id_tipo_mantenimiento",
                table: "detalle_mantenimiento",
                column: "id_tipo_mantenimiento");

            migrationBuilder.CreateIndex(
                name: "IX_detalle_traslado_id_asignacion",
                table: "detalle_traslado",
                column: "id_asignacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_detalle_traslado_id_ubicacion_destino",
                table: "detalle_traslado",
                column: "id_ubicacion_destino");

            migrationBuilder.CreateIndex(
                name: "IX_detalle_traslado_id_ubicacion_origen",
                table: "detalle_traslado",
                column: "id_ubicacion_origen");

            migrationBuilder.CreateIndex(
                name: "IX_motivo_baja_nombre",
                table: "motivo_baja",
                column: "nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tipo_mantenimiento_nombre",
                table: "tipo_mantenimiento",
                column: "nombre",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_activo_estado_id_estado",
                table: "activo",
                column: "id_estado",
                principalTable: "estado",
                principalColumn: "id_estado",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_activo_estado_id_estado",
                table: "activo");

            migrationBuilder.DropTable(
                name: "detalle_baja");

            migrationBuilder.DropTable(
                name: "detalle_mantenimiento");

            migrationBuilder.DropTable(
                name: "detalle_traslado");

            migrationBuilder.DropTable(
                name: "motivo_baja");

            migrationBuilder.DropTable(
                name: "tipo_mantenimiento");

            migrationBuilder.DropIndex(
                name: "IX_activo_id_estado",
                table: "activo");

            migrationBuilder.DropColumn(
                name: "id_estado",
                table: "activo");
        }
    }
}
