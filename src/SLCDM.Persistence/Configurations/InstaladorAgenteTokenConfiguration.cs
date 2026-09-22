using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Configurations;

public class InstaladorAgenteTokenConfiguration : IEntityTypeConfiguration<InstaladorAgenteToken>
{
    public void Configure(EntityTypeBuilder<InstaladorAgenteToken> builder)
    {
        builder.ToTable("instalador_agente_token");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id_instalador_agente_token");

        builder.Property(t => t.Token)
            .HasColumnName("token")
            .HasColumnType("varchar(32)")
            .IsRequired();

        builder.Property(t => t.IdUsuarioCreador)
            .HasColumnName("id_usuario_creador")
            .IsRequired();

        builder.HasOne(t => t.UsuarioCreador)
            .WithMany()
            .HasForeignKey(t => t.IdUsuarioCreador)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(t => t.CreadoEn).HasColumnName("creado_en").IsRequired();
        builder.Property(t => t.ExpiraEn).HasColumnName("expira_en").IsRequired();
        builder.Property(t => t.UsadoEn).HasColumnName("usado_en");

        builder.Property(t => t.Revocado)
            .HasColumnName("revocado")
            .HasDefaultValue(false);

        builder.HasIndex(t => t.Token).IsUnique();
        builder.HasIndex(t => t.IdUsuarioCreador);
    }
}
