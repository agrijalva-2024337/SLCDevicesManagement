using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class EstadoConfiguration : IEntityTypeConfiguration<Estado>
{
    public void Configure(EntityTypeBuilder<Estado> builder)
    {
        builder.ToTable("estado");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id_estado");

        builder.Property(e => e.Nombre)
            .HasColumnName("nombre")
            .HasColumnType("varchar(50)")
            .IsRequired();

        builder.Property(e => e.Descripcion)
            .HasColumnName("descripcion")
            .HasColumnType("varchar(150)");

        builder.Property(e => e.IdEmpresa)
            .HasColumnName("id_empresa")
            .IsRequired();

        builder.HasOne(e => e.Empresa)
            .WithMany()
            .HasForeignKey(e => e.IdEmpresa)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.IdEmpresa, e.Nombre })
            .IsUnique()
            .HasDatabaseName("ix_estado_empresa_nombre");
    }
}
