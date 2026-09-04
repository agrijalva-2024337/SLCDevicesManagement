using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class MotivoBajaConfiguration : IEntityTypeConfiguration<MotivoBaja>
{
    public void Configure(EntityTypeBuilder<MotivoBaja> builder)
    {
        builder.ToTable("motivo_baja");
        
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id_motivo_baja");

        builder.Property(m => m.Nombre)
            .HasColumnName("nombre")
            .HasColumnType("varchar(50)")
            .IsRequired();

        builder.Property(m => m.Descripcion)
            .HasColumnName("descripcion")
            .HasColumnType("varchar(150)");
        builder.HasIndex(m => m.Nombre).IsUnique();
    }
}