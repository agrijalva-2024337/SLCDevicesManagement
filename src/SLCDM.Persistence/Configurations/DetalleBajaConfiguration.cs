using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class DetalleBajaConfiguration : IEntityTypeConfiguration<DetalleBaja>
{
    public void Configure(EntityTypeBuilder<DetalleBaja> builder)
    {
        builder.ToTable("detalle_baja");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id_detalle_baja");
        builder.Property(d => d.IdAsignacion).HasColumnName("id_asignacion").IsRequired();
        builder.Property(d => d.IdMotivoBaja).HasColumnName("id_motivo_baja").IsRequired();
        builder.Property(d => d.IdAutorizadoPor).HasColumnName("id_autorizado_por").IsRequired();

        builder.Property(d => d.DocumentoReferencia)
            .HasColumnName("documento_referencia")
            .HasColumnType("varchar(300)");

        builder.HasOne(d => d.Asignacion)
            .WithMany()
            .HasForeignKey(d => d.IdAsignacion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.MotivoBaja)
            .WithMany()
            .HasForeignKey(d => d.IdMotivoBaja)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.AutorizadoPor)
            .WithMany()
            .HasForeignKey(d => d.IdAutorizadoPor)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.IdAsignacion).IsUnique();
    }
}
