using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class AsignacionDocumentoPdfConfiguration : IEntityTypeConfiguration<AsignacionDocumentoPdf>
{
    public void Configure(EntityTypeBuilder<AsignacionDocumentoPdf> builder)
    {
        builder.ToTable("asignacion_documento_pdf");
        builder.HasKey(d => d.IdAsignacion);
        builder.Property(d => d.IdAsignacion).HasColumnName("id_asignacion");
        builder.Property(d => d.Contenido)
            .HasColumnName("contenido")
            .HasColumnType("varbinary(max)")
            .IsRequired();

        builder.HasOne(d => d.Asignacion)
            .WithOne()
            .HasForeignKey<AsignacionDocumentoPdf>(d => d.IdAsignacion)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
