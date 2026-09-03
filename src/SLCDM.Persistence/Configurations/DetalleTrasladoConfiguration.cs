using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class DetalleTrasladoConfiguration : IEntityTypeConfiguration<DetalleTraslado>
{
    public void Configure(EntityTypeBuilder<DetalleTraslado> builder)
    {
        builder.ToTable("detalle_traslado");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id_detalle_traslado");

        builder.Property(d => d.IdAsignacion).HasColumnName("id_asignacion").IsRequired();
        builder.Property(d => d.IdUbicacionOrigen).HasColumnName("id_ubicacion_origen").IsRequired();
        builder.Property(d => d.IdUbicacionDestino).HasColumnName("id_ubicacion_destino").IsRequired();

       builder.Property(d => d.Motivo)
            .HasColumnName("motivo")
            .HasColumnType("varchar(300)");

        builder.HasOne(d => d.Asignacion)
            .WithMany()
            .HasForeignKey(d => d.IdAsignacion)
            .OnDelete(DeleteBehavior.Restrict);

        // Restrict en ambas: no se puede borrar una Ubicacion si es origen/destino de un traslado.
        builder.HasOne(d => d.UbicacionOrigen)
            .WithMany()
            .HasForeignKey(d => d.IdUbicacionOrigen)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.UbicacionDestino)
            .WithMany()
            .HasForeignKey(d => d.IdUbicacionDestino)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.IdAsignacion).IsUnique();
    }
}