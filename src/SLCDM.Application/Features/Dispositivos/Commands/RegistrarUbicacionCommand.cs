using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Dispositivos.Commands;

/// <summary>
/// IdActivo llega desde la claim del DeviceToken (Api/Authentication), nunca
/// del cuerpo de la peticion: un dispositivo solo puede reportar su propia
/// ubicacion, jamas la de otro activo.
/// </summary>
public sealed record RegistrarUbicacionCommand(int IdActivo, string Bssid);

public sealed class RegistrarUbicacionCommandHandler : ICommandHandler<RegistrarUbicacionCommand>
{
    private readonly IApplicationDbContext _db;

    public RegistrarUbicacionCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task HandleAsync(RegistrarUbicacionCommand command, CancellationToken cancellationToken = default)
    {
        var activo = await _db.Activos.IgnoreQueryFilters()
            .FirstOrDefaultAsync(a => a.Id == command.IdActivo, cancellationToken)
            ?? throw new NotFoundException("Activo", command.IdActivo);

        var token = await _db.DispositivosToken.IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.IdActivo == command.IdActivo, cancellationToken)
            ?? throw new NotFoundException("DispositivoToken", command.IdActivo);

        var redConocida = await _db.RedesConocidas.IgnoreQueryFilters()
            .Include(r => r.Ubicacion)
            .FirstOrDefaultAsync(r => r.Bssid == command.Bssid, cancellationToken);

        var ubicacionDetectada = redConocida?.Ubicacion;

        // Decision de negocio: si el activo TODAVIA no tiene ubicacion
        // asignada (nunca paso por un traslado formal), no evaluamos alerta
        // -- no tiene sentido avisar que esta "fuera de rango" de un rango
        // que nunca se definio. Si mas adelante prefieren lo contrario
        // (tratar "sin asignar" como alerta), este es el unico punto que
        // hay que cambiar.
        if (activo.IdUbicacion is null)
        {
            token.UltimaUbicacionDetectadaId = ubicacionDetectada?.Id;
            token.UltimoUsoEn = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return;
        }

        // Fuera de rango: la red no esta catalogada, o esta catalogada pero
        // apunta a una ubicacion distinta de la asignada al activo.
        var estaFueraDeRango = ubicacionDetectada is null || ubicacionDetectada.Id != activo.IdUbicacion;
        var eraFueraDeRango = token.FueraDeRango;

        token.FueraDeRango = estaFueraDeRango;
        token.UltimaUbicacionDetectadaId = ubicacionDetectada?.Id;
        token.UltimoUsoEn = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        // Solo se escribe en el historial cuando cambia el estado (entra o
        // sale de la alerta), no en cada ping -- si no, serian decenas de
        // renglones idénticos por dia mientras el equipo sigue fuera de rango.
        if (estaFueraDeRango == eraFueraDeRango)
        {
            return;
        }

        _db.HistorialActivos.Add(new HistorialActivo
        {
            FechaHora = DateTime.UtcNow,
            TipoOperacion = estaFueraDeRango ? "AlertaFueraDeRango" : "AlertaResuelta",
            Descripcion = estaFueraDeRango
                ? "El activo fue detectado fuera de la ubicacion asignada"
                : "El activo volvio a la ubicacion asignada",
            InformacionAnterior = $"id_ubicacion_asignada={activo.IdUbicacion}",
            InformacionNueva = ubicacionDetectada is not null
                ? $"id_ubicacion_detectada={ubicacionDetectada.Id}; bssid={command.Bssid}"
                : $"ubicacion_detectada=desconocida; bssid={command.Bssid}"
        });
        await _db.SaveChangesAsync(cancellationToken);
    }
}