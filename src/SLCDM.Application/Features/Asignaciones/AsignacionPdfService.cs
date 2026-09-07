using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Asignaciones;

public sealed class AsignacionPdfService : IAsignacionPdfService
{
    private static readonly Color Navy = Color.FromHex("#12344d");
    private static readonly Color Gold = Color.FromHex("#c9a227");

    private readonly IApplicationDbContext _db;

    static AsignacionPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public AsignacionPdfService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AsignacionPdfFileDto> GenerarAsync(
        int idAsignacion, CancellationToken cancellationToken = default)
    {
        var asignacion = await _db.Asignaciones
            .AsNoTracking()
            .Include(a => a.TipoAsignacion)
            .Include(a => a.Estado)
            .FirstOrDefaultAsync(a => a.Id == idAsignacion, cancellationToken)
            ?? throw new NotFoundException("Asignacion", idAsignacion);

        var activo = await _db.Activos.AsNoTracking().IgnoreQueryFilters()
            .Include(a => a.CategoriaActivo)
            .FirstOrDefaultAsync(a => a.Id == asignacion.IdActivo, cancellationToken);

        var ubicacion = activo?.IdUbicacion is int idUbic
            ? await _db.Ubicaciones.AsNoTracking().IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == idUbic, cancellationToken)
            : null;

        var responsable = await _db.Responsables.AsNoTracking().IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.Id == asignacion.IdResponsable, cancellationToken);

        var usuarioEntrega = await _db.Usuarios.AsNoTracking().IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == asignacion.IdUsuario, cancellationToken);

        var tipo = asignacion.TipoAsignacion?.Nombre ?? "Movimiento";
        var esBaja = TipoAsignacionNombres.EsNombre(tipo, TipoAsignacionNombres.Baja);
        var titulo = esBaja ? "Acta de baja de activo" : "Acta de asignación de activo";
        var quienEntrega = usuarioEntrega is null
            ? $"Usuario #{asignacion.IdUsuario}"
            : $"{usuarioEntrega.Nombres} {usuarioEntrega.Apellidos}".Trim();
        var quienRecibe = responsable?.NombreCompleto ?? $"Responsable #{asignacion.IdResponsable}";
        var fileName = esBaja ? $"acta-baja-{asignacion.Id}.pdf" : $"acta-asignacion-{asignacion.Id}.pdf";

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(24);
                page.MarginBottom(28);
                page.MarginHorizontal(40);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Navy));

                page.Header().Column(col =>
                {
                    col.Item().Background(Navy).Padding(12).Row(row =>
                    {
                        row.RelativeItem().Column(brand =>
                        {
                            brand.Item().Text("SLC").FontColor(Colors.White).Bold().FontSize(16);
                            brand.Item().Text("Control de activos · Inventario").FontColor(Colors.White).FontSize(9);
                        });
                        row.ConstantItem(160).AlignRight().Column(meta =>
                        {
                            meta.Item().Text(titulo).FontColor(Gold).FontSize(9).Bold();
                            meta.Item().Text($"Folio #{asignacion.Id}").FontColor(Colors.White).FontSize(9);
                        });
                    });
                    col.Item().Height(4).Background(Gold);
                });

                page.Content().PaddingTop(12).Column(col =>
                {
                    col.Spacing(4);

                    var tipoEquipo = activo?.CategoriaActivo?.Nombre ?? activo?.Nombre ?? $"#{asignacion.IdActivo}";
                    var motivo = string.IsNullOrWhiteSpace(asignacion.Observaciones)
                        ? null
                        : asignacion.Observaciones.Trim();

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(izq =>
                        {
                            izq.Spacing(3);
                            Dato(izq, "Tipo de equipo", tipoEquipo);
                            Dato(izq, "Nombre", Texto(activo?.Nombre));
                            Dato(izq, "Marca", Texto(activo?.Marca));
                            Dato(izq, "Modelo", Texto(activo?.Modelo));
                        });
                        row.RelativeItem().PaddingLeft(16).Column(der =>
                        {
                            der.Spacing(3);
                            Dato(der, "Serie", Texto(activo?.NumeroSerie));
                            Dato(der, "Ubicación", Texto(ubicacion?.Nombre));
                            Dato(der, "Estado", Texto(asignacion.Estado?.Nombre));
                            Dato(der, "Fecha", asignacion.FechaAsignacion.ToString("yyyy-MM-dd"));
                        });
                    });

                    if (!string.IsNullOrWhiteSpace(activo?.Descripcion))
                    {
                        Dato(col, "Especificaciones", activo!.Descripcion!.Trim());
                    }

                    if (!string.IsNullOrWhiteSpace(motivo))
                    {
                        Dato(col, esBaja ? "Motivo de baja" : "Motivo de entrega", motivo);
                    }

                    col.Item().PaddingTop(24).PaddingLeft(20)
                        .Element(c => DrawFirmas(c, esBaja, quienEntrega, quienRecibe, asignacion.FirmaEntrega, asignacion.FirmaRecibe));
                });

                page.Footer().Column(col =>
                {
                    col.Item().Height(3).Background(Gold);
                    col.Item().Background(Navy).Padding(8).AlignCenter().Text(text =>
                    {
                        text.Span("SLC · documento interno de inventario  ·  ").FontSize(8).FontColor(Colors.White);
                        text.Span($"{DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC").FontSize(8).FontColor(Gold);
                    });
                });
            });
        }).GeneratePdf();

        return new AsignacionPdfFileDto(pdf, fileName);
    }

    private static string Texto(string? value) => string.IsNullOrWhiteSpace(value) ? "—" : value.Trim();

    private static void Dato(ColumnDescriptor column, string etiqueta, string valor)
    {
        column.Item().Text(text =>
        {
            text.Span($"{etiqueta}: ").Bold().FontSize(9);
            text.Span(valor).FontSize(9);
        });
    }

    private static void DrawFirmas(
        IContainer container, bool esBaja, string quienEntrega, string quienRecibe,
        byte[]? firmaEntrega, byte[]? firmaRecibe)
    {
        container.Row(firmas =>
        {
            firmas.RelativeItem().PaddingRight(18).Column(left =>
            {
                left.Item().Text(esBaja ? "Firma de quien registra" : "Firma de quien entrega").Bold().FontSize(8);
                left.Item().Text(quienEntrega).FontSize(8);
                DrawFirma(left, firmaEntrega);
            });
            firmas.RelativeItem().PaddingLeft(14).Column(right =>
            {
                right.Item().Text(esBaja ? "Firma de quien autoriza" : "Firma de quien recibe").Bold().FontSize(8);
                right.Item().Text(quienRecibe).FontSize(8);
                DrawFirma(right, firmaRecibe);
            });
        });
    }

    private static void DrawFirma(ColumnDescriptor column, byte[]? firma)
    {
        column.Item().Height(50).Element(box =>
        {
            if (firma is { Length: > 32 })
            {
                box.Image(firma).FitArea();
            }
            else
            {
                box.AlignMiddle().AlignCenter().Text("Sin firma").FontColor(Colors.Grey.Medium).Italic();
            }
        });
    }
}