using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class PaisConfiguration : IEntityTypeConfiguration<Pais>
{
    public void Configure(EntityTypeBuilder<Pais> builder)
    {
        builder.ToTable("pais");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id_pais");

        builder.Property(p => p.Nombre)
            .HasColumnName("nombre")
            .HasColumnType("varchar(100)")
            .IsRequired();

        builder.Property(p => p.CodigoIso2)
            .HasColumnName("codigo_iso2")
            .HasColumnType("varchar(2)")
            .IsRequired();

        builder.Property(p => p.CodigoIso3)
            .HasColumnName("codigo_iso3")
            .HasColumnType("varchar(3)")
            .IsRequired();

        builder.Property(p => p.CodigoTelefonico)
            .HasColumnName("codigo_telefonico")
            .HasColumnType("varchar(5)");

        builder.Property(p => p.IdEmpresa)
            .HasColumnName("id_empresa")
            .IsRequired();

        builder.HasOne(p => p.Empresa)
            .WithMany()
            .HasForeignKey(p => p.IdEmpresa)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.IdEmpresa, p.CodigoIso2 })
            .IsUnique()
            .HasDatabaseName("ix_pais_empresa_iso2");

        builder.HasIndex(p => new { p.IdEmpresa, p.CodigoIso3 })
            .IsUnique()
            .HasDatabaseName("ix_pais_empresa_iso3");
    }
}
