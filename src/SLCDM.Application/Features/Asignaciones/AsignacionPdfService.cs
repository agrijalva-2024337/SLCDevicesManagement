using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Options;
using SLCDM.Application.Features.Activos;

namespace SLCDM.Application.Features.Asignaciones;

public sealed class AsignacionPdfService : IAsignacionPdfService
{
    private static readonly Color Navy = Color.FromHex("#12344d");
    private static readonly Color Gold = Color.FromHex("#c9a227");
    private static readonly object MembreteLock = new();
    private static string? MembreteCachePath;
    private static byte[]? MembreteCache;

    // Texto fijo del acta oficial FRM-CORP-TT-ALTBAJ-3 v1 (10/03/25).
    private const string CodigoFormulario = "FRM-CORP-TT-ALTBAJ-3";
    private const string VersionFormulario = "1";
    private const string FechaFormulario = "10/03/25";

    private static readonly string[] Prohibiciones =
    [
        "Descargar software, aplicaciones o archivos no autorizados.",
        "Acceder sitios web no relacionados con el trabajo.",
        "Utilizar una computadora para actividades personales.",
        "Dejar el equipo desbloqueado o desatendido.",
        "Compartir credenciales de acceso a personal no autorizado.",
        "Compartir información confidencial."
    ];

    private readonly IApplicationDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly BrandingOptions _branding;

    static AsignacionPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public AsignacionPdfService(
        IApplicationDbContext db, IConfiguration configuration, IOptions<BrandingOptions> branding)
    {
        _db = db;
        _configuration = configuration;
        _branding = branding.Value;
    }

    public async Task<AsignacionPdfFileDto> GenerarAsync(
        int idAsignacion, DateTime marcaTemporal, CancellationToken cancellationToken = default)
    {
        var asignacion = await _db.Asignaciones
            .AsNoTracking()
            .Include(a => a.TipoAsignacion)
            .Include(a => a.Estado)
            .FirstOrDefaultAsync(a => a.Id == idAsignacion, cancellationToken)
            ?? throw new NotFoundException("Asignacion", idAsignacion);

        var activo = await _db.Activos.AsNoTracking().IgnoreQueryFilters()
            .Include(a => a.CategoriaActivo)
            .Include(a => a.Proveedor)
            .FirstOrDefaultAsync(a => a.Id == asignacion.IdActivo, cancellationToken);

        var responsable = await _db.Responsables.AsNoTracking().IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.Id == asignacion.IdResponsable, cancellationToken);

        var area = responsable is not null
            ? await _db.Areas.AsNoTracking().IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == responsable.IdArea, cancellationToken)
            : null;

        var usuarioEntrega = await _db.Usuarios.AsNoTracking().IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == asignacion.IdUsuario, cancellationToken);

        var empresa = activo?.Proveedor is not null
            ? await _db.Empresas.AsNoTracking().IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == activo.Proveedor.IdEmpresa, cancellationToken)
            : null;

        var tipo = asignacion.TipoAsignacion?.Nombre ?? "Movimiento";
        var esBaja = TipoAsignacionNombres.EsNombre(tipo, TipoAsignacionNombres.Baja);
        var titulo = esBaja ? "Acta de baja de activo" : "Acta de entrega de equipo";
        var quienEntrega = usuarioEntrega is null
            ? $"Usuario #{asignacion.IdUsuario}"
            : $"{usuarioEntrega.Nombres} {usuarioEntrega.Apellidos}".Trim();
        var quienRecibe = responsable?.NombreCompleto ?? $"Responsable #{asignacion.IdResponsable}";
        var fileName = esBaja ? $"acta-baja-{asignacion.Id}.pdf" : $"acta-entrega-{asignacion.Id}.pdf";
        var empresaNombre = string.IsNullOrWhiteSpace(empresa?.Nombre) ? "SLC Trade" : empresa!.Nombre;

        // QR embebido -> ficha de consulta publica (BE-31, ya existe). No estaba
        // en el acta original en papel; se agrega como valor extra del sistema.
        byte[]? qrPng = null;
        if (activo is not null && !string.IsNullOrWhiteSpace(activo.TokenPublico))
        {
            var publicUrl = _configuration["Frontend:PublicUrl"] ?? "http://localhost:5173";
            qrPng = ActivoQr.Png(ActivoQr.Url(publicUrl, activo.TokenPublico));
        }

        var membrete = LeerMembrete();
        var hayMembrete = membrete is { Length: > 0 };

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(9.5f).FontColor(Navy));
                page.MarginHorizontal(40);
                page.MarginBottom(30);

                if (hayMembrete)
                {
                    page.MarginTop(4);
                    page.Header().PaddingBottom(6).Image(membrete!).FitWidth();
                }
                else
                {
                    page.MarginTop(24);
                    page.Header().Column(col =>
                    {
                        col.Item().Background(Navy).Padding(12).Row(row =>
                        {
                            row.RelativeItem().Column(brand =>
                            {
                                brand.Item().Text(empresaNombre).FontColor(Colors.White).Bold().FontSize(16);
                                brand.Item().Text("Sistemas Logísticos y Corporativos").FontColor(Colors.White).FontSize(9);
                            });
                            row.ConstantItem(160).AlignRight().Text(titulo).FontColor(Gold).FontSize(9).Bold();
                        });
                        col.Item().Height(4).Background(Gold);
                    });
                }

                page.Content().PaddingTop(10).Column(col =>
                {
                    col.Spacing(6);

                    // -- Cajita de control de documento + Para/Departamento/Fecha --
                    col.Item().Row(row =>
                    {
                        row.ConstantItem(170).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.ConstantColumn(60); c.RelativeColumn(); });
                            CeldaControl(table, "Código", CodigoFormulario);
                            CeldaControl(table, "Versión", VersionFormulario);
                            CeldaControl(table, "Fecha", FechaFormulario);
                        });

                        row.RelativeItem().PaddingLeft(16).Column(datos =>
                        {
                            datos.Spacing(2);
                            datos.Item().Text($"Para: {quienRecibe}").FontSize(9.5f).Bold();
                            datos.Item().Text($"Departamento: {(string.IsNullOrWhiteSpace(area?.Nombre) ? "—" : area!.Nombre)}").FontSize(9.5f).Bold();
                            datos.Item().Text($"Fecha: {asignacion.FechaAsignacion:dd/MM/yyyy}").FontSize(9.5f).Bold();
                        });

                        if (qrPng is not null)
                        {
                            row.ConstantItem(64).Column(qr =>
                            {
                                qr.Item().AlignCenter().Width(58).Image(qrPng).FitArea();
                                qr.Item().AlignCenter().Text("Consulta pública").FontSize(6).FontColor(Colors.Grey.Darken1);
                            });
                        }
                    });

                    // -- Parrafo introductorio --
                    col.Item().PaddingTop(4).Text(esBaja
                        ? "Estimado, por este medio se hace constar la baja / devolución de este equipo, el cual deja de estar bajo su responsabilidad y cuidado a partir de esta fecha."
                        : "Estimado, por este medio se hace constar la entrega de este equipo el cual estará bajo su responsabilidad y cuidado.");

                    // -- Prohibiciones (solo aplica a entregas activas) --
                    if (!esBaja)
                    {
                        col.Item().PaddingTop(2).Text("Al utilizar este equipo está prohibido:").Bold();
                        foreach (var regla in Prohibiciones)
                        {
                            col.Item().PaddingLeft(14).Text($"•  {regla}");
                        }
                    }

                    // -- Tabla de campos del equipo (los 8 del acta original) --
                    var tipoEquipo = activo?.CategoriaActivo?.Nombre ?? activo?.Nombre ?? $"#{asignacion.IdActivo}";
                    var motivo = string.IsNullOrWhiteSpace(asignacion.Observaciones)
                        ? "—"
                        : asignacion.Observaciones!.Trim();

                    col.Item().PaddingTop(6).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.ConstantColumn(160); c.RelativeColumn(); });

                        FilaCampo(table, "Tipo de equipo", tipoEquipo);
                        FilaCampo(table, "Marca", Texto(activo?.Marca));
                        FilaCampo(table, "Modelo", Texto(activo?.Modelo));
                        FilaCampo(table, "Serie", Texto(activo?.NumeroSerie));
                        FilaCampo(table, "Especificaciones de hardware", Texto(activo?.EspecificacionesHardware));
                        FilaCampo(table, "Periféricos adicionales", Texto(activo?.PerifericosAdicionales));
                        FilaCampo(table, "Estado", Texto(asignacion.Estado?.Nombre));
                        FilaCampo(table, esBaja ? "Motivo de baja" : "Motivo de entrega", motivo);
                    });

                    // -- Parrafo de aceptacion --
                    col.Item().PaddingTop(6).Text($"Yo: {quienRecibe}     DPI: ____________________________");
                    col.Item().Text(esBaja
                        ? "Hago constar la devolución del equipo y accesorios detallados en esta acta, entregándolos en el estado descrito, salvo el desgaste de uso normal. Confirmo que a partir de esta fecha dejo de tener responsabilidad alguna sobre el mismo."
                        : "Acepto seguir las instrucciones detalladas en esta entrega, así como también que el equipo y accesorios de hardware quedan bajo mi estricta responsabilidad. Estoy anuente y acepto hacerme responsable por cualquier tipo de daño o pérdida que se cause al equipo entregado, en caso aún aplique el deducible por garantía y en caso la garantía ya no aplique debo absorber el costo total. Además, estoy consciente de que al retirarme de la empresa debo devolver el equipo con los hardware detallados en esta entrega y en el estado que fueron entregados con desgaste de uso normal."
                    ).FontSize(8.5f);

                    // -- Firmas --
                    col.Item().PaddingTop(18)
                        .Element(c => DrawFirmas(c, esBaja, quienEntrega, quienRecibe, responsable?.Cargo, asignacion.FirmaEntrega, asignacion.FirmaRecibe));
                });

                page.Footer().Column(col =>
                {
                    col.Item().PaddingTop(6).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten2);
                    col.Item().PaddingTop(3).Text(text =>
                    {
                        text.Span($"Este documento es propiedad de {empresaNombre}, queda prohibida su reproducción total o parcial.")
                            .FontSize(7).Italic().FontColor(Colors.Grey.Darken2);
                    });
                    col.Item().AlignRight().Text($"Folio #{asignacion.Id} · {marcaTemporal:yyyy-MM-dd HH:mm} UTC")
                        .FontSize(7).FontColor(Colors.Grey.Medium);
                });
            });
        }).GeneratePdf();

        return new AsignacionPdfFileDto(pdf, fileName);
    }

    private byte[]? LeerMembrete()
    {
        var path = _branding.LetterheadPath;
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return null;
        }

        lock (MembreteLock)
        {
            if (MembreteCachePath == path && MembreteCache is { Length: > 0 })
            {
                return MembreteCache;
            }

            MembreteCachePath = path;
            MembreteCache = File.ReadAllBytes(path); // PNG/JPG directo -- sin conversion, sin SkiaSharp.
            return MembreteCache;
        }
    }

    private static string Texto(string? value) => string.IsNullOrWhiteSpace(value) ? "—" : value.Trim();

    private static void CeldaControl(TableDescriptor table, string etiqueta, string valor)
    {
        table.Cell().Border(1).BorderColor(Colors.Grey.Lighten1).Background(Colors.Blue.Lighten5)
            .Padding(3).Text(etiqueta).Bold().FontSize(8);
        table.Cell().Border(1).BorderColor(Colors.Grey.Lighten1).Padding(3).Text(valor).FontSize(8);
    }

    private static void FilaCampo(TableDescriptor table, string etiqueta, string valor)
    {
        table.Cell().Border(1).BorderColor(Colors.Grey.Lighten1).Padding(4).Text(etiqueta).Bold().FontSize(9);
        table.Cell().Border(1).BorderColor(Colors.Grey.Lighten1).Padding(4).Text(valor).FontSize(9);
    }

    private static void DrawFirmas(
        IContainer container, bool esBaja, string quienEntrega, string quienRecibe, string? cargoRecibe,
        byte[]? firmaEntrega, byte[]? firmaRecibe)
    {
        container.Row(firmas =>
        {
            firmas.RelativeItem().PaddingRight(18).Column(left =>
            {
                DrawFirma(left, firmaEntrega);
                left.Item().PaddingTop(2).LineHorizontal(0.75f).LineColor(Colors.Grey.Darken1);
                left.Item().AlignCenter().Text(quienEntrega).FontSize(8).Bold();
                left.Item().AlignCenter().Text(esBaja ? "Quien registra" : "Quien entrega").FontSize(7).FontColor(Colors.Grey.Darken1);
            });
            firmas.RelativeItem().PaddingLeft(14).Column(right =>
            {
                DrawFirma(right, firmaRecibe);
                right.Item().PaddingTop(2).LineHorizontal(0.75f).LineColor(Colors.Grey.Darken1);
                right.Item().AlignCenter().Text(quienRecibe).FontSize(8).Bold();
                right.Item().AlignCenter().Text(string.IsNullOrWhiteSpace(cargoRecibe)
                    ? (esBaja ? "Quien autoriza" : "Quien recibe")
                    : cargoRecibe).FontSize(7).FontColor(Colors.Grey.Darken1);
            });
        });
    }

    private static void DrawFirma(ColumnDescriptor column, byte[]? firma)
    {
        column.Item().Height(48).Element(box =>
        {
            if (firma is { Length: > 32 })
            {
                box.Image(firma).FitArea();
            }
            else
            {
                box.AlignBottom().AlignCenter().Text("Sin firma").FontColor(Colors.Grey.Medium).Italic().FontSize(8);
            }
        });
    }
}