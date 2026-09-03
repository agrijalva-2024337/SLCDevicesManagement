using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;
public class DetalleMantenimientoConfiguration : IEntityTypeConfiguration<DetalleMantenimiento>
{
    public void Configure(EntityTypeBuilder<DetalleMantenimiento> builder)
    {
        builder.ToTable("detalle_mantenimiento");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id_detalle_mantenimiento");

        builder.Property(d => d.IdAsignacion).HasColumnName("id_asignacion").IsRequired();
        builder.Property(d => d.IdTipoMantenimiento).HasColumnName("id_tipo_mantenimiento").IsRequired();

        builder.Property(d => d.DescripcionProblema)
            .HasColumnName("descripcion_problema")
            .HasColumnType("varchar(300)")
            .IsRequired();

        builder.Property(d => d.TrabajoRealizado)
            .HasColumnName("trabajo_realizado")
            .HasColumnType("varchar(300)");

        builder.Property(d => d.Costo)
            .HasColumnName("costo")
            .HasColumnType("decimal(12,2)");

        builder.Property(d => d.NumeroFactura)
            .HasColumnName("numero_factura")
            .HasColumnType("varchar(50)");

        builder.HasOne(d => d.Asignacion)
            .WithMany()
            .HasForeignKey(d => d.IdAsignacion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.TipoMantenimiento)
            .WithMany()
            .HasForeignKey(d => d.IdTipoMantenimiento)
            .OnDelete(DeleteBehavior.Restrict);

        // 1 a 0/1: una asignacion de tipo Mantenimiento tiene a lo sumo un detalle.
        builder.HasIndex(d => d.IdAsignacion).IsUnique();
    }
}