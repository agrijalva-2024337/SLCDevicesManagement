using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class TipoMantenimientoConfiguration : IEntityTypeConfiguration<TipoMantenimiento>
{
    public void Configure(EntityTypeBuilder<TipoMantenimiento> builder)
    {
        builder.ToTable("tipo_mantenimiento");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id_tipo_mantenimiento");
        builder.Property(t => t.Nombre)
            .HasColumnName("nombre")
            .HasColumnType("varchar(50)")
            .IsRequired();
        builder.Property(t => t.Descripcion)
            .HasColumnName("descripcion")
            .HasColumnType("varchar(150)");
        builder.HasIndex(t => t.Nombre).IsUnique();
    }
}