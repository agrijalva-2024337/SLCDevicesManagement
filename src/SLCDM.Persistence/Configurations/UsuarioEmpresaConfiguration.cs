using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class UsuarioEmpresaConfiguration : IEntityTypeConfiguration<UsuarioEmpresa>
{
    public void Configure(EntityTypeBuilder<UsuarioEmpresa> builder)
    {
        builder.ToTable("usuario_empresa");

        builder.HasKey(ue => ue.Id);
        builder.Property(ue => ue.Id).HasColumnName("id_usuario_empresa");

        builder.Property(ue => ue.IdUsuario).HasColumnName("id_usuario").IsRequired();
        builder.Property(ue => ue.IdEmpresa).HasColumnName("id_empresa").IsRequired();

        builder.Property(ue => ue.Rol)
            .HasColumnName("rol")
            .HasConversion<string>()
            .HasColumnType("varchar(50)")
            .IsRequired();

        builder.HasOne(ue => ue.Usuario)
            .WithMany()
            .HasForeignKey(ue => ue.IdUsuario)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ue => ue.Empresa)
            .WithMany()
            .HasForeignKey(ue => ue.IdEmpresa)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ue => new { ue.IdUsuario, ue.IdEmpresa }).IsUnique();
        builder.HasIndex(ue => ue.IdEmpresa);
    }
}
