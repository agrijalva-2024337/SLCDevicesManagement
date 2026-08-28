using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class HistorialActivoConfiguration : IEntityTypeConfiguration<HistorialActivo>
{
    public void Configure(EntityTypeBuilder<HistorialActivo> builder)
    {
        builder.ToTable("historial_activo", t => t.HasCheckConstraint(
            "ck_historial_activo_una_sola_fuente",
            "([id_asignacion] IS NOT NULL AND [id_detalle_activo] IS NOT NULL) " +
            "OR ([id_asignacion] IS NULL AND [id_detalle_activo] IS NOT NULL)"));

        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasColumnName("id_historial_activo");

        builder.Property(h => id.Asignacion).HasColumnName("id_asignacion");
        builder.Property(h => id.DetalleActivo).HasColumnName("id_detalle_activo");

        builder.Property(h => h.FechaHora)
            .HasColumnName("fecha_hora")
            .HasColumnType("date")
            .IsRequired();

        builder.Property(h => h.TipoOperacion)
            .HasColumnName("tipo_operacion")
            .HasColumnType("varchar(30)");

        builder.Property(h => h.Descripcion)
            .HasColumnName("descripcion")
            .HasColumnType("varchar(300)");
        
        builder.Property(h => h.InformacionAnterior)
            .HasColumnName("informacion_anterior")
            .HasColumnType("nvarchar(max)");

        builder.Property(h => h.InformacionNueva)
            .HasColumnName("informacion_nueva")
            .HasColumnType("nvarchar(max)");

        builder.HasOne(h => h.Asignacion)
            .WithMany()
            .HasForeignKey(h => h.IdAsignacion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.DetalleActivo)
            .WithMany()
            .HasForeignKey(h => h.IdDetalleActivo)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => h.IdAsignacion);
        builder.HasIndex(h => h.IdDetalleActivo);
    }
}