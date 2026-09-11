using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SLCDM.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EliminarRolYUsuariosConsulta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM asignacion a
                    INNER JOIN usuario u ON u.id_usuario = a.id_usuario
                    WHERE u.rol = 'Consulta'
                )
                OR EXISTS (
                    SELECT 1
                    FROM detalle_baja d
                    INNER JOIN usuario u ON u.id_usuario = d.id_autorizado_por
                    WHERE u.rol = 'Consulta'
                )
                    THROW 50004, 'No se pueden eliminar usuarios Consulta con asignaciones o bajas asociadas.', 1;

                DELETE b
                FROM bitacora b
                INNER JOIN usuario u ON u.id_usuario = b.id_usuario
                WHERE u.rol = 'Consulta';

                DELETE ue
                FROM usuario_empresa ue
                INNER JOIN usuario u ON u.id_usuario = ue.id_usuario
                WHERE u.rol = 'Consulta';

                DELETE FROM usuario WHERE rol = 'Consulta';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
