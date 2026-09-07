# Backend — todo lo que falta, con código

Este documento es solo la parte de backend (.NET). El frontend va aparte,
en texto plano, para pasárselo directo a Benjamín.

---

## 0. Antes que nada — el diseño del rastreo, con la corrección que pidió el cliente

Me comentaste que el cliente aclaró: quiere que se rastree **el equipo**,
no que se infiera la ubicación a partir de a qué router/módem está
conectado. Esto cambia una pieza importante del diseño que traía el repo
de prueba, y vale la pena explicarlo antes de meter código.

### Lo que traía el repo de prueba (y por qué no alcanza)

El agente que instala el repo de prueba (`agent/`, carpeta completa que
también rescaté de ahí porque nunca se trasplantó) intenta **dos** cosas en
cada ciclo:

1. Leer el GPS real del equipo, vía el servicio de ubicación de Windows.
2. Si eso falla, leer el BSSID de la red Wi-Fi a la que está conectado y
   buscarlo en un catálogo (`RedConocida`) para inferir la ubicación.

El problema: ese agente está instalado como **servicio de Windows corriendo
como LocalSystem** (`New-Service` sin credenciales = LocalSystem por
defecto). El propio código de prueba ya trae un comentario que lo admite:
*"En LocalSystem suele devolver vacío; entonces el backend usa el BSSID"*
— es decir, en la práctica, con esa instalación, el GPS **case siempre
falla** y todo termina dependiendo del catálogo de routers, que es
justo lo que el cliente no quiere.

### Por qué falla el GPS bajo LocalSystem

El servicio de ubicación de Windows (el mismo que usan apps como Mapas o
Clima, y que en una laptop sin GPS físico igual da una posición bastante
buena vía triangulación de redes Wi-Fi cercanas contra la base de datos de
Microsoft) está atado a una **sesión de usuario interactiva** y a los
permisos de privacidad de esa cuenta (Configuración > Privacidad y
seguridad > Ubicación). Un servicio LocalSystem no tiene sesión de usuario
ni pasa por ese chequeo de privacidad de la misma manera — por eso devuelve
vacío casi siempre, sin importar si la laptop tiene GPS o no.

### La corrección: correr el agente en la sesión del usuario, no como servicio

En vez de instalarlo como servicio de Windows, hay que instalarlo como una
**tarea programada que corre en la sesión del usuario que inició sesión**
(`Ejecutar solo cuando el usuario haya iniciado sesión`, disparada "al
iniciar sesión"). Así sí corre con el contexto de usuario que necesita el
servicio de ubicación de Windows, y el GPS real (o la triangulación Wi-Fi
que hace el propio Windows, que es distinta de nuestro catálogo manual)
funciona de verdad. Es el mismo ejecutable, el mismo código de rastreo —
cambia únicamente **cómo se instala**, no la lógica.

Con esto, el orden de prioridad de las fuentes de ubicación queda así, y
es importante que quede documentado para el equipo:

1. **GPS/ubicación real de Windows del equipo** (fuente principal — esto
   es lo que el cliente pidió: rastrear el equipo en sí).
2. **BSSID contra el catálogo `RedConocida`** — solo como respaldo, para
   cuando el equipo no tiene ubicación de Windows disponible (permiso de
   ubicación desactivado, sin señal, oficina totalmente interior sin GPS
   ni triangulación posible). El backend ya prioriza GPS sobre BSSID
   automáticamente (ver `RegistrarUbicacionCommand` más abajo) — no hace
   falta tocar esa lógica, solo hay que asegurarse de que el agente esté
   bien instalado para que el GPS realmente llegue.

### Qué necesita el equipo de sistemas/IT para que esto funcione en todas las laptops

Esto no es código, es una tarea de despliegue que alguien de IT tiene que
hacer una sola vez a nivel de política, para no depender de que cada
usuario active manualmente el permiso de ubicación en su laptop:

- Activar, vía Política de Grupo (GPO) o registro, "Permitir que las apps
  de escritorio accedan a tu ubicación" de forma forzada para todo el
  parque de equipos (política `Forzar permitir` en Configuración de
  equipo > Plantillas administrativas > Componentes de Windows >
  Privacidad de aplicaciones > "Permitir el acceso a la ubicación").
  Sin esto, el agente puede estar bien instalado y aun así no recibir
  coordenadas porque Windows bloquea el acceso por política de privacidad.
- Confirmar que el servicio de ubicación de Windows esté activado (no
  apagado a nivel de imagen corporativa).

Si esto no se puede gestionar centralmente todavía, el agente sigue
funcionando en modo degradado (cae al BSSID), simplemente no cumple del
todo el requisito de "rastrear el equipo" hasta que se resuelva el permiso.

---

## 1. BE-28 — CRUD de `RedConocida`

Esquema idéntico entre los dos repos — se copia tal cual. No requiere
migración nueva (la tabla ya existe desde BE-22) ni cambios en
`IApplicationDbContext` (el `DbSet<RedConocida> RedesConocidas` ya está).

### `src/SLCDM.Application/Features/RedesConocidas/RedConocidaDto.cs`

```csharp
namespace SLCDM.Application.Features.RedesConocidas;

public sealed record RedConocidaDto(int Id, string Bssid, int IdUbicacion);
```

### `src/SLCDM.Application/Features/RedesConocidas/Commands/CreateRedConocidaCommand.cs`

```csharp
using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.RedesConocidas.Commands;

public sealed record CreateRedConocidaCommand(string Bssid, int IdUbicacion);

public sealed class CreateRedConocidaCommandValidator : AbstractValidator<CreateRedConocidaCommand>
{
    public CreateRedConocidaCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.Bssid)
            .NotEmpty().WithMessage("El campo bssid es obligatorio.")
            .MaximumLength(17).WithMessage("El campo bssid no debe superar los 17 caracteres.")
            .Matches(@"^[0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5}$")
            .WithMessage("El campo bssid debe tener el formato aa:bb:cc:dd:ee:ff.");

        RuleFor(x => x.IdUbicacion)
            .RequiredId("id ubicacion")
            .MustAsync(async (id, ct) => await db.Ubicaciones.AnyAsync(u => u.Id == id, ct))
            .WithMessage("No se encontro una ubicacion con el id informado.");

        RuleFor(x => x.Bssid)
            .MustAsync(async (bssid, ct) =>
                !await db.RedesConocidas.AnyAsync(r => r.Bssid == bssid.Trim().ToLowerInvariant(), ct))
            .WithMessage("Ya existe una red conocida con ese BSSID.");
    }
}

public sealed class CreateRedConocidaCommandHandler : ICommandHandler<CreateRedConocidaCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateRedConocidaCommand> _validator;

    public CreateRedConocidaCommandHandler(IApplicationDbContext db, IValidator<CreateRedConocidaCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateRedConocidaCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = command.Adapt<RedConocida>();
        entity.Bssid = command.Bssid.Trim().ToLowerInvariant();

        _db.RedesConocidas.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
```

### `src/SLCDM.Application/Features/RedesConocidas/Commands/UpdateRedConocidaCommand.cs`

```csharp
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.RedesConocidas.Commands;

public sealed record UpdateRedConocidaCommand(int Id, string Bssid, int IdUbicacion);

public sealed class UpdateRedConocidaCommandValidator : AbstractValidator<UpdateRedConocidaCommand>
{
    public UpdateRedConocidaCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.Id).RequiredId("id red conocida");

        RuleFor(x => x.Bssid)
            .NotEmpty().WithMessage("El campo bssid es obligatorio.")
            .MaximumLength(17).WithMessage("El campo bssid no debe superar los 17 caracteres.")
            .Matches(@"^[0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5}$")
            .WithMessage("El campo bssid debe tener el formato aa:bb:cc:dd:ee:ff.");

        RuleFor(x => x.IdUbicacion)
            .RequiredId("id ubicacion")
            .MustAsync(async (id, ct) => await db.Ubicaciones.AnyAsync(u => u.Id == id, ct))
            .WithMessage("No se encontro una ubicacion con el id informado.");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                !await db.RedesConocidas.AnyAsync(
                    r => r.Id != cmd.Id && r.Bssid == cmd.Bssid.Trim().ToLowerInvariant(),
                    ct))
            .WithMessage("Ya existe una red conocida con ese BSSID.");
    }
}

public sealed class UpdateRedConocidaCommandHandler : ICommandHandler<UpdateRedConocidaCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<UpdateRedConocidaCommand> _validator;

    public UpdateRedConocidaCommandHandler(IApplicationDbContext db, IValidator<UpdateRedConocidaCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(UpdateRedConocidaCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.RedesConocidas.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("RedConocida", command.Id);

        entity.Bssid = command.Bssid.Trim().ToLowerInvariant();
        entity.IdUbicacion = command.IdUbicacion;
        await _db.SaveChangesAsync(cancellationToken);
    }
}
```

### `src/SLCDM.Application/Features/RedesConocidas/Commands/DeleteRedConocidaCommand.cs`

```csharp
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.RedesConocidas.Commands;

public sealed record DeleteRedConocidaCommand(int Id);

public sealed class DeleteRedConocidaCommandValidator : AbstractValidator<DeleteRedConocidaCommand>
{
    public DeleteRedConocidaCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id red conocida");
    }
}

public sealed class DeleteRedConocidaCommandHandler : ICommandHandler<DeleteRedConocidaCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DeleteRedConocidaCommand> _validator;

    public DeleteRedConocidaCommandHandler(IApplicationDbContext db, IValidator<DeleteRedConocidaCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DeleteRedConocidaCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.RedesConocidas.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("RedConocida", command.Id);

        _db.RedesConocidas.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
```

### `src/SLCDM.Application/Features/RedesConocidas/Queries/GetRedesConocidasQuery.cs`

```csharp
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.RedesConocidas.Queries;

public sealed record GetRedesConocidasQuery(int? IdUbicacion = null);

public sealed class GetRedesConocidasQueryHandler : IQueryHandler<GetRedesConocidasQuery, IReadOnlyList<RedConocidaDto>>
{
    private readonly IApplicationDbContext _db;

    public GetRedesConocidasQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<RedConocidaDto>> HandleAsync(
        GetRedesConocidasQuery query,
        CancellationToken cancellationToken = default)
    {
        var itemsQuery = _db.RedesConocidas.AsNoTracking();

        if (query.IdUbicacion.HasValue)
        {
            itemsQuery = itemsQuery.Where(r => r.IdUbicacion == query.IdUbicacion.Value);
        }

        var items = await itemsQuery
            .OrderBy(r => r.Bssid)
            .ToListAsync(cancellationToken);

        return items.Adapt<List<RedConocidaDto>>();
    }
}
```

### `src/SLCDM.Application/Features/RedesConocidas/Queries/GetRedConocidaByIdQuery.cs`

```csharp
using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.RedesConocidas.Queries;

public sealed record GetRedConocidaByIdQuery(int Id);

public sealed class GetRedConocidaByIdQueryValidator : AbstractValidator<GetRedConocidaByIdQuery>
{
    public GetRedConocidaByIdQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id red conocida");
    }
}

public sealed class GetRedConocidaByIdQueryHandler : IQueryHandler<GetRedConocidaByIdQuery, RedConocidaDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<GetRedConocidaByIdQuery> _validator;

    public GetRedConocidaByIdQueryHandler(IApplicationDbContext db, IValidator<GetRedConocidaByIdQuery> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<RedConocidaDto> HandleAsync(GetRedConocidaByIdQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var entity = await _db.RedesConocidas.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException("RedConocida", query.Id);

        return entity.Adapt<RedConocidaDto>();
    }
}
```

### `src/SLCDM.Api/Controllers/RedesConocidasController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.RedesConocidas;
using SLCDM.Application.Features.RedesConocidas.Commands;
using SLCDM.Application.Features.RedesConocidas.Queries;

namespace SLCDM.Api.Controllers;

public sealed class RedesConocidasController : ApiControllerBase
{
    private readonly IQueryHandler<GetRedesConocidasQuery, IReadOnlyList<RedConocidaDto>> _getAll;
    private readonly IQueryHandler<GetRedConocidaByIdQuery, RedConocidaDto> _getById;
    private readonly ICommandHandler<CreateRedConocidaCommand, int> _create;
    private readonly ICommandHandler<UpdateRedConocidaCommand> _update;
    private readonly ICommandHandler<DeleteRedConocidaCommand> _delete;

    public RedesConocidasController(
        IQueryHandler<GetRedesConocidasQuery, IReadOnlyList<RedConocidaDto>> getAll,
        IQueryHandler<GetRedConocidaByIdQuery, RedConocidaDto> getById,
        ICommandHandler<CreateRedConocidaCommand, int> create,
        ICommandHandler<UpdateRedConocidaCommand> update,
        ICommandHandler<DeleteRedConocidaCommand> delete)
    {
        _getAll = getAll;
        _getById = getById;
        _create = create;
        _update = update;
        _delete = delete;
    }

    [HttpGet]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<RedConocidaDto>>> GetAll(
        [FromQuery] int? idUbicacion = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _getAll.HandleAsync(new GetRedesConocidasQuery(idUbicacion), cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<RedConocidaDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await _getById.HandleAsync(new GetRedConocidaByIdQuery(id), cancellationToken));

    [HttpPost]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Create([FromBody] CreateRedConocidaCommand command, CancellationToken cancellationToken)
    {
        var id = await _create.HandleAsync(command, cancellationToken);
        return CreatedId(nameof(GetById), id);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRedConocidaCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id) return IdMismatch();
        await _update.HandleAsync(command, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _delete.HandleAsync(new DeleteRedConocidaCommand(id), cancellationToken);
        return NoContent();
    }
}
```

Dale a Benjamín estas rutas cuando esté mergeado: `GET /api/redesconocidas`,
`GET /api/redesconocidas/{id}`, `POST/PUT/DELETE` iguales — mismo patrón que
`ubicaciones`.

---

## 2. BE-29 — API de rastreo con coordenadas reales (GPS como fuente principal)

### 2.1 Ampliar `DispositivoToken` (Domain)

`src/SLCDM.Domain/Entities/DispositivoToken.cs` — agregar al final de la clase:

```csharp
    [MaxLength(17)]
    public string? UltimoBssid { get; set; }

    public decimal? UltimaLatitud { get; set; }

    public decimal? UltimaLongitud { get; set; }

    [MaxLength(10)]
    public string? OrigenCoordenada { get; set; }
```

### 2.2 Configuración EF — `DispositivoTokenConfiguration.cs`

Agregar antes de los `HasIndex` finales:

```csharp
        builder.Property(d => d.UltimoBssid)
            .HasColumnName("ultimo_bssid")
            .HasColumnType("varchar(17)");

        builder.Property(d => d.UltimaLatitud)
            .HasColumnName("ultima_latitud")
            .HasColumnType("decimal(9,6)");

        builder.Property(d => d.UltimaLongitud)
            .HasColumnName("ultima_longitud")
            .HasColumnType("decimal(9,6)");

        builder.Property(d => d.OrigenCoordenada)
            .HasColumnName("origen_coordenada")
            .HasColumnType("varchar(10)");
```

### 2.3 Migración

```bash
dotnet ef migrations add AddCoordenadasDispositivoToken --project src/SLCDM.Persistence --startup-project src/SLCDM.Api
dotnet ef migrations script --idempotent --project src/SLCDM.Persistence --startup-project src/SLCDM.Api -o Scripts/AddCoordenadasDispositivoToken.sql
```

### 2.4 Helpers nuevos

`src/SLCDM.Application/Common/BssidFormat.cs`:

```csharp
using System.Text.RegularExpressions;

namespace SLCDM.Application.Common;

public static class BssidFormat
{
    private static readonly Regex Hex = new("[^0-9a-fA-F]", RegexOptions.Compiled);

    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var hex = Hex.Replace(value, string.Empty).ToLowerInvariant();
        if (hex.Length != 12)
        {
            return null;
        }

        return string.Create(17, hex, static (span, src) =>
        {
            var offset = 0;
            for (var i = 0; i < 6; i++)
            {
                if (i > 0)
                {
                    span[offset++] = ':';
                }

                span[offset++] = src[i * 2];
                span[offset++] = src[(i * 2) + 1];
            }
        });
    }
}
```

`src/SLCDM.Application/Common/GeoCoords.cs`:

```csharp
namespace SLCDM.Application.Common;

public static class GeoCoords
{
    public static bool EsUtilizable(decimal? latitud, decimal? longitud)
    {
        if (latitud is null || longitud is null)
        {
            return false;
        }

        if (latitud is < -90 or > 90 || longitud is < -180 or > 180)
        {
            return false;
        }

        // Formularios vacios o sensores sin señal suelen mandar 0,0 (Golfo de Guinea).
        return Math.Abs((double)latitud.Value) >= 0.05 || Math.Abs((double)longitud.Value) >= 0.05;
    }
}
```

`src/SLCDM.Application/Features/Dispositivos/GeoDistance.cs`:

```csharp
namespace SLCDM.Application.Features.Dispositivos;

public static class GeoDistance
{
    public static double Meters(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        const double earthRadiusMeters = 6_371_000;
        var phi1 = DegreesToRadians((double)lat1);
        var phi2 = DegreesToRadians((double)lat2);
        var dPhi = DegreesToRadians((double)(lat2 - lat1));
        var dLambda = DegreesToRadians((double)(lon2 - lon1));

        var a = Math.Sin(dPhi / 2) * Math.Sin(dPhi / 2)
            + Math.Cos(phi1) * Math.Cos(phi2) * Math.Sin(dLambda / 2) * Math.Sin(dLambda / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180;
}
```

### 2.5 `DeviceTrackingOptions` — agregar el radio de geocerca

`src/SLCDM.Application/Common/Options/DeviceTrackingOptions.cs` — agregar:

```csharp
    /// <summary>
    /// Radio (metros) alrededor de la ubicacion asignada. Solo se usa cuando
    /// el agente manda coordenadas propias del equipo (GPS/ubicacion real).
    /// </summary>
    public int GeofenceRadiusMeters { get; set; } = 250;
```

Y en `src/SLCDM.Api/appsettings.json`, dentro de `"DeviceTracking"`:

```json
    "GeofenceRadiusMeters": 250
```

### 2.6 `RegistrarUbicacionCommand.cs` — reescrito, GPS primero

Reemplaza el archivo completo:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SLCDM.Application.Common;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Options;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Dispositivos.Commands;

/// <summary>
/// IdActivo llega desde la claim del DeviceToken (Api/Authentication), nunca
/// del cuerpo de la peticion: un dispositivo solo puede reportar su propia
/// ubicacion, jamas la de otro activo. Latitud/Longitud son la fuente
/// principal (GPS/ubicacion real del equipo, vía el agente corriendo en la
/// sesion del usuario); Bssid es solo respaldo para cuando no hay
/// coordenadas disponibles.
/// </summary>
public sealed record RegistrarUbicacionCommand(
    int IdActivo,
    string? Bssid,
    decimal? Latitud = null,
    decimal? Longitud = null);

public sealed class RegistrarUbicacionCommandHandler : ICommandHandler<RegistrarUbicacionCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly DeviceTrackingOptions _options;

    public RegistrarUbicacionCommandHandler(IApplicationDbContext db, IOptions<DeviceTrackingOptions> options)
    {
        _db = db;
        _options = options.Value;
    }

    public async Task HandleAsync(RegistrarUbicacionCommand command, CancellationToken cancellationToken = default)
    {
        var bssid = BssidFormat.Normalize(command.Bssid);

        var activo = await _db.Activos.IgnoreQueryFilters()
            .FirstOrDefaultAsync(a => a.Id == command.IdActivo, cancellationToken)
            ?? throw new NotFoundException("Activo", command.IdActivo);

        var token = await _db.DispositivosToken.IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.IdActivo == command.IdActivo && !d.Revocado, cancellationToken)
            ?? throw new NotFoundException("DispositivoToken", command.IdActivo);

        var redConocida = bssid is null
            ? null
            : (await _db.RedesConocidas.IgnoreQueryFilters()
                .Include(r => r.Ubicacion)
                .ToListAsync(cancellationToken))
                .FirstOrDefault(r => BssidFormat.Normalize(r.Bssid) == bssid);

        var ubicacionDetectada = redConocida?.Ubicacion;
        var gpsOk = GeoCoords.EsUtilizable(command.Latitud, command.Longitud);
        var wifiCoordsOk = ubicacionDetectada is not null
            && GeoCoords.EsUtilizable(ubicacionDetectada.Latitud, ubicacionDetectada.Longitud);

        token.UltimoBssid = bssid;
        token.UltimoUsoEn = DateTime.UtcNow;
        token.UltimaUbicacionDetectadaId = ubicacionDetectada?.Id;

        if (gpsOk)
        {
            // Fuente principal: coordenadas reales del equipo.
            token.UltimaLatitud = command.Latitud;
            token.UltimaLongitud = command.Longitud;
            token.OrigenCoordenada = "gps";
        }
        else if (wifiCoordsOk)
        {
            // Respaldo: sin GPS disponible, se usa la ubicacion del catalogo de redes conocidas.
            token.UltimaLatitud = ubicacionDetectada!.Latitud;
            token.UltimaLongitud = ubicacionDetectada.Longitud;
            token.OrigenCoordenada = "wifi";
        }
        else
        {
            token.UltimaLatitud = null;
            token.UltimaLongitud = null;
            token.OrigenCoordenada = null;
        }

        // Decision de negocio ya vigente en el repo real: si el activo
        // todavia no tiene ubicacion asignada (nunca paso por un traslado
        // formal), no se evalua alerta de "fuera de rango".
        if (activo.IdUbicacion is null)
        {
            await _db.SaveChangesAsync(cancellationToken);
            return;
        }

        var ubicacionAsignada = await _db.Ubicaciones.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == activo.IdUbicacion, cancellationToken);

        var estaFueraDeRango = gpsOk
            ? EstaFueraDeGeocerca(command.Latitud!.Value, command.Longitud!.Value, ubicacionAsignada)
            : ubicacionDetectada is null || ubicacionDetectada.Id != activo.IdUbicacion;
        var eraFueraDeRango = token.FueraDeRango;

        token.FueraDeRango = estaFueraDeRango;
        await _db.SaveChangesAsync(cancellationToken);

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
            InformacionNueva = gpsOk
                ? $"origen=gps; lat={command.Latitud}; lng={command.Longitud}; bssid={bssid ?? "ninguno"}"
                : ubicacionDetectada is not null
                    ? $"origen=wifi; id_ubicacion_detectada={ubicacionDetectada.Id}; bssid={bssid}"
                    : $"origen=wifi; ubicacion_detectada=desconocida; bssid={bssid}"
        });
        await _db.SaveChangesAsync(cancellationToken);
    }

    private bool EstaFueraDeGeocerca(decimal latitud, decimal longitud, Ubicacion? ubicacionAsignada)
    {
        if (ubicacionAsignada is null)
        {
            return false;
        }

        if (!GeoCoords.EsUtilizable(ubicacionAsignada.Latitud, ubicacionAsignada.Longitud))
        {
            return true;
        }

        var radio = _options.GeofenceRadiusMeters > 0 ? _options.GeofenceRadiusMeters : 250;
        return GeoDistance.Meters(latitud, longitud, ubicacionAsignada.Latitud, ubicacionAsignada.Longitud) > radio;
    }
}
```

### 2.7 `DispositivosController.cs` — `Ping` y `DevicePingRequest`

```csharp
public sealed record DevicePingRequest(string? Bssid, decimal? Latitud = null, decimal? Longitud = null);
```

Y en el método `Ping`:

```csharp
        await _ping.HandleAsync(
            new RegistrarUbicacionCommand(idActivo, body.Bssid, body.Latitud, body.Longitud),
            cancellationToken);
```

### 2.8 DTO y queries de rastreo — con coordenadas

`src/SLCDM.Application/Features/Dispositivos/DispositivoRastreoDto.cs`:

```csharp
namespace SLCDM.Application.Features.Dispositivos;

public sealed record UbicacionMapaDto(int Id, string Nombre, decimal Latitud, decimal Longitud);

public sealed record DispositivoRastreoDto(
    int Id,
    int IdActivo,
    string NombreActivo,
    bool FueraDeRango,
    DateTime? UltimoUsoEn,
    string? UltimoBssid,
    string? OrigenCoordenada,
    decimal? UltimaLatitud,
    decimal? UltimaLongitud,
    UbicacionMapaDto? UbicacionAsignada,
    UbicacionMapaDto? UbicacionDetectada);
```

`src/SLCDM.Application/Features/Dispositivos/Queries/GetDispositivosRastreoQuery.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Dispositivos.Queries;

public sealed record GetDispositivosRastreoQuery;

public sealed class GetDispositivosRastreoQueryHandler
    : IQueryHandler<GetDispositivosRastreoQuery, IReadOnlyList<DispositivoRastreoDto>>
{
    private readonly IApplicationDbContext _db;

    public GetDispositivosRastreoQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<DispositivoRastreoDto>> HandleAsync(
        GetDispositivosRastreoQuery query,
        CancellationToken cancellationToken = default)
    {
        return await _db.DispositivosToken.AsNoTracking()
            .Where(d => !d.Revocado)
            .Select(d => new DispositivoRastreoDto(
                d.Id,
                d.IdActivo,
                d.Activo!.Nombre,
                d.FueraDeRango,
                d.UltimoUsoEn,
                d.UltimoBssid,
                d.OrigenCoordenada,
                d.UltimaLatitud,
                d.UltimaLongitud,
                d.Activo.IdUbicacion == null || d.Activo.Ubicacion == null
                    ? null
                    : new UbicacionMapaDto(
                        d.Activo.Ubicacion.Id,
                        d.Activo.Ubicacion.Nombre,
                        d.Activo.Ubicacion.Latitud,
                        d.Activo.Ubicacion.Longitud),
                d.UltimaUbicacionDetectada == null
                    ? null
                    : new UbicacionMapaDto(
                        d.UltimaUbicacionDetectada.Id,
                        d.UltimaUbicacionDetectada.Nombre,
                        d.UltimaUbicacionDetectada.Latitud,
                        d.UltimaUbicacionDetectada.Longitud)))
            .ToListAsync(cancellationToken);
    }
}
```

`src/SLCDM.Application/Features/Dispositivos/Queries/GetRastreoByActivoQuery.cs` —
mismo cambio de `Select` que arriba en el handler existente, agregando
`d.IdActivo == query.IdActivo` en el `Where` y manteniendo la validación y
el `NotFoundException` que ya tiene.

---

## 3. El agente de rastreo (Windows) — la pieza que faltaba

Esto es lo que realmente "rastrea el equipo": un programa pequeño instalado
en cada laptop que, cada cierto tiempo, lee su ubicación real y se la
reporta al backend usando su propio token de dispositivo. **Este agente ya
existe completo en el repo de prueba** (carpeta `agent/`, aparte del
backend) pero nunca se trasplantó — hay que crear un proyecto nuevo para
esto (no va dentro de `SLCDevicesManagement`, es un ejecutable de Windows
independiente).

Es el mismo código del repo de prueba, con **un solo cambio real**: cómo se
instala (ver sección 0 arriba) — en vez de servicio de Windows, tarea
programada en la sesión del usuario. El código C# del agente no cambia
prácticamente nada.

### Estructura del proyecto (nuevo, separado del backend)

```
SLCDM.Agent/
  Program.cs
  Worker.cs
  UbicacionEquipo.cs
  HuellaHardware.cs
  CredencialAlmacen.cs
  appsettings.json
  SLCDM.Agent.csproj
  instalar-tarea.ps1
```

### `SLCDM.Agent.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk.Worker">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <RuntimeIdentifier>win-x64</RuntimeIdentifier>
    <SelfContained>true</SelfContained>
    <PublishSingleFile>true</PublishSingleFile>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <AssemblyName>SLCDMAgente</AssemblyName>
    <RootNamespace>SLCDM.Agent</RootNamespace>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Http" Version="8.0.0" />
    <PackageReference Include="System.Management" Version="8.0.0" />
  </ItemGroup>
</Project>
```

(Quité `Microsoft.Extensions.Hosting.WindowsServices` y `UseWindowsService`
porque ya no se instala como servicio.)

### `Program.cs`

```csharp
using SLCDM.Agent;

var builder = Host.CreateApplicationBuilder(args);

var backendUrl = builder.Configuration["Backend:BaseUrl"]
    ?? throw new InvalidOperationException("Falta Backend:BaseUrl en la configuracion.");

builder.Services.AddHttpClient("Backend", client =>
{
    client.BaseAddress = new Uri(backendUrl);
});

builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
```

### `UbicacionEquipo.cs` — lee el GPS/ubicación real de Windows

```csharp
using System.Diagnostics;
using System.Globalization;

namespace SLCDM.Agent;

/// <summary>
/// Lee la ubicacion real del equipo via el servicio de ubicacion de
/// Windows (GPS fisico si lo hay, o triangulacion Wi-Fi/red que hace el
/// propio Windows -- no nuestro catalogo RedConocida). Requiere correr en
/// la sesion de un usuario con el servicio de ubicacion y el permiso de
/// apps de escritorio activados -- por eso este agente se instala como
/// tarea programada en el logon del usuario, no como servicio LocalSystem.
/// Rechaza 0,0 (oceano) y precision peor de 5 km.
/// </summary>
public static class UbicacionEquipo
{
    public static (decimal Latitud, decimal Longitud)? Leer()
    {
        const string script =
            "Add-Type -AssemblyName System.Device; " +
            "$w = New-Object System.Device.Location.GeoCoordinateWatcher([System.Device.Location.GeoPositionAccuracy]::High); " +
            "$w.Start(); $n = 0; " +
            "while ($w.Status -ne 'Ready' -and $w.Status -ne 'Initializing' -and $n -lt 40) { Start-Sleep -Milliseconds 250; $n++ }; " +
            "while ($w.Status -eq 'Initializing' -and $n -lt 40) { Start-Sleep -Milliseconds 250; $n++ }; " +
            "$c = $w.Position.Location; $w.Stop(); " +
            "if ($null -eq $c -or $c.IsUnknown) { exit 1 }; " +
            "if ([double]::IsNaN($c.Latitude) -or [double]::IsNaN($c.Longitude)) { exit 1 }; " +
            "if ([math]::Abs($c.Latitude) -lt 0.05 -and [math]::Abs($c.Longitude) -lt 0.05) { exit 1 }; " +
            "if (-not [double]::IsNaN($c.HorizontalAccuracy) -and $c.HorizontalAccuracy -gt 5000) { exit 1 }; " +
            "$inv = [cultureinfo]::InvariantCulture; " +
            "Write-Output ($c.Latitude.ToString($inv) + '|' + $c.Longitude.ToString($inv))";

        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \"" + script + "\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        try
        {
            using var proceso = Process.Start(psi);
            if (proceso is null)
            {
                return null;
            }

            if (!proceso.WaitForExit(12_000))
            {
                proceso.Kill(entireProcessTree: true);
                return null;
            }

            if (proceso.ExitCode != 0)
            {
                return null;
            }

            var linea = proceso.StandardOutput.ReadToEnd().Trim().Replace(',', '.');
            var partes = linea.Split('|');
            if (partes.Length != 2)
            {
                return null;
            }

            if (!decimal.TryParse(partes[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var lat)
                || !decimal.TryParse(partes[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var lng))
            {
                return null;
            }

            if (lat is < -90 or > 90 || lng is < -180 or > 180)
            {
                return null;
            }

            if (Math.Abs((double)lat) < 0.05 && Math.Abs((double)lng) < 0.05)
            {
                return null;
            }

            return (lat, lng);
        }
        catch
        {
            return null;
        }
    }
}
```

### `HuellaHardware.cs` — identifica el equipo para el auto-registro

```csharp
using System.Management;
using System.Runtime.Versioning;

namespace SLCDM.Agent;

[SupportedOSPlatform("windows")]
public static class HuellaHardware
{
    public static string? LeerNumeroSerieBios()
    {
        using var searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
        foreach (ManagementObject item in searcher.Get())
        {
            return item["SerialNumber"]?.ToString()?.Trim();
        }
        return null;
    }
}
```

### `CredencialAlmacen.cs` — guarda el token en Credential Manager de Windows (no en un archivo de texto)

```csharp
using System.Runtime.InteropServices;
using System.Text;

namespace SLCDM.Agent;

public static class CredencialAlmacen
{
    private const string Target = "SLCDM-DeviceToken";

    public static string? LeerToken()
    {
        if (!CredRead(Target, CredType.Generic, 0, out var credentialPtr))
        {
            return null;
        }

        try
        {
            var cred = Marshal.PtrToStructure<NativeCredential>(credentialPtr);
            return cred.CredentialBlob == IntPtr.Zero || cred.CredentialBlobSize == 0
                ? null
                : Marshal.PtrToStringUni(cred.CredentialBlob, (int)cred.CredentialBlobSize / 2);
        }
        finally
        {
            CredFree(credentialPtr);
        }
    }

    public static void GuardarToken(string token)
    {
        var blob = Encoding.Unicode.GetBytes(token);
        var native = new NativeCredential
        {
            Type = CredType.Generic,
            TargetName = Target,
            UserName = "device",
            CredentialBlob = Marshal.AllocHGlobal(blob.Length),
            CredentialBlobSize = (uint)blob.Length,
            Persist = CredPersist.LocalMachine
        };

        try
        {
            Marshal.Copy(blob, 0, native.CredentialBlob, blob.Length);
            if (!CredWrite(ref native, 0))
            {
                throw new InvalidOperationException(
                    $"No se pudo guardar el token en Credential Manager (Win32 {Marshal.GetLastWin32Error()}).");
            }
        }
        finally
        {
            Marshal.FreeHGlobal(native.CredentialBlob);
        }
    }

    private enum CredType : uint { Generic = 1 }
    private enum CredPersist : uint { LocalMachine = 2 }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct NativeCredential
    {
        public uint Flags;
        public CredType Type;
        public string TargetName;
        public string? Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint CredentialBlobSize;
        public IntPtr CredentialBlob;
        public CredPersist Persist;
        public uint AttributeCount;
        public IntPtr Attributes;
        public string? TargetAlias;
        public string? UserName;
    }

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredRead(string target, CredType type, int reservedFlag, out IntPtr credentialPtr);

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredWrite([In] ref NativeCredential userCredential, [In] uint flags);

    [DllImport("advapi32.dll")]
    private static extern void CredFree([In] IntPtr buffer);
}
```

### `Worker.cs` — el ciclo de rastreo (cada 15 minutos)

```csharp
using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.RegularExpressions;

namespace SLCDM.Agent;

public sealed class Worker : BackgroundService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<Worker> _logger;
    private static readonly TimeSpan Intervalo = TimeSpan.FromMinutes(15);

    public Worker(IHttpClientFactory httpFactory, IConfiguration configuration, ILogger<Worker> logger)
    {
        _httpFactory = httpFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var token = CredencialAlmacen.LeerToken();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (token is null)
                {
                    token = await AutoRegistrarseAsync(stoppingToken);
                    CredencialAlmacen.GuardarToken(token);
                    _logger.LogInformation("Dispositivo auto-registrado.");
                }

                var coords = UbicacionEquipo.Leer();
                var bssid = ObtenerBssidConectado();
                if (bssid is null && coords is null)
                {
                    _logger.LogWarning("No se pudo leer la ubicacion real ni el BSSID del equipo.");
                }
                else
                {
                    _logger.LogInformation(
                        "Ping GPS={Gps} BSSID(respaldo)={Bssid}",
                        coords is null ? "(no disponible)" : $"{coords.Value.Latitud},{coords.Value.Longitud}",
                        bssid ?? "(ninguno)");
                    await EnviarPingAsync(token, bssid, coords, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                token = CredencialAlmacen.LeerToken();
                _logger.LogError(ex, "El ciclo de rastreo fallo. Se reintenta en {Intervalo}.", Intervalo);
            }

            await Task.Delay(Intervalo, stoppingToken);
        }
    }

    private async Task<string> AutoRegistrarseAsync(CancellationToken cancellationToken)
    {
        var numeroSerie = HuellaHardware.LeerNumeroSerieBios()
            ?? throw new InvalidOperationException("No se pudo leer el numero de serie del equipo.");

        var installKey = _configuration["Backend:InstallKey"]
            ?? throw new InvalidOperationException("Falta Backend:InstallKey en la configuracion.");

        var http = _httpFactory.CreateClient("Backend");
        var response = await http.PostAsJsonAsync("api/dispositivos/auto-registro", new
        {
            NumeroSerie = numeroSerie,
            InstallKey = installKey
        }, cancellationToken);

        response.EnsureSuccessStatusCode();

        var dto = await response.Content.ReadFromJsonAsync<RespuestaAutoRegistro>(cancellationToken: cancellationToken);
        return dto!.TokenCrudo;
    }

    private static string? ObtenerBssidConectado()
    {
        var psi = new ProcessStartInfo("netsh", "wlan show interfaces")
        {
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var proceso = Process.Start(psi);
        if (proceso is null)
        {
            return null;
        }

        var salida = proceso.StandardOutput.ReadToEnd();
        proceso.WaitForExit();

        var match = Regex.Match(
            salida,
            @"BSSID[^:]*:\s*([0-9a-fA-F]{2}([:\-\s][0-9a-fA-F]{2}){5})",
            RegexOptions.IgnoreCase);
        if (!match.Success)
        {
            return null;
        }

        var hex = Regex.Replace(match.Groups[1].Value, "[^0-9a-fA-F]", string.Empty).ToLowerInvariant();
        if (hex.Length != 12)
        {
            return null;
        }

        return string.Join(":", Enumerable.Range(0, 6).Select(i => hex.Substring(i * 2, 2)));
    }

    private async Task EnviarPingAsync(
        string token, string? bssid, (decimal Latitud, decimal Longitud)? coords, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/dispositivos/ping");
        request.Headers.Add("X-Device-Token", token);
        request.Content = JsonContent.Create(new
        {
            Bssid = bssid,
            Latitud = coords?.Latitud,
            Longitud = coords?.Longitud
        });

        try
        {
            var http = _httpFactory.CreateClient("Backend");
            using var response = await http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Ping fallido: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Sin conexion al backend. Se reintenta en el siguiente ciclo.");
        }
    }

    private sealed record RespuestaAutoRegistro(int Id, int IdActivo, string TokenCrudo, DateTime CreadoEn, DateTime? ExpiraEn);
}
```

### `appsettings.json`

```json
{
  "Backend": {
    "BaseUrl": "http://localhost:5139/",
    "InstallKey": "CAMBIAR_ESTO_ES_LA_LLAVE_DEL_LOTE_DE_INSTALACION"
  }
}
```

(la `InstallKey` tiene que ser la misma que ya está configurada en
`DeviceTracking:InstallKey` del backend.)

### `instalar-tarea.ps1` — instalación como tarea programada del usuario (reemplaza el `New-Service` del repo de prueba)

```powershell
param(
    [Parameter(Mandatory=$true)][string]$BackendUrl,
    [Parameter(Mandatory=$true)][string]$InstallKey
)

$installPath = "$env:LOCALAPPDATA\SLCDM"
New-Item -ItemType Directory -Force -Path $installPath | Out-Null
Copy-Item -Path ".\publish\*" -Destination $installPath -Recurse -Force

$config = @{
    "Backend" = @{
        "BaseUrl" = $BackendUrl
        "InstallKey" = $InstallKey
    }
} | ConvertTo-Json
Set-Content -Path "$installPath\appsettings.Production.json" -Value $config

$action = New-ScheduledTaskAction -Execute "$installPath\SLCDMAgente.exe"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName "SLCDM Agente de Rastreo" `
  -Action $action -Trigger $trigger -Settings $settings `
  -RunLevel Limited `
  -Description "Reporta la ubicacion real del equipo al backend de inventario." `
  -Force

Start-ScheduledTask -TaskName "SLCDM Agente de Rastreo"
Get-ScheduledTask -TaskName "SLCDM Agente de Rastreo" | Select-Object TaskName, State
Write-Host "Revisa que 'State' diga Running. Si no arranca, entra a Configuracion > Privacidad y seguridad > Ubicacion y confirma que este activado 'Permitir que las apps de escritorio accedan a tu ubicacion'."
```

Diferencias clave contra el `instalar.ps1` del repo de prueba: se instala
en `%LOCALAPPDATA%` (carpeta del usuario, no `Program Files`, porque ya no
corre con privilegios de sistema), se registra como tarea programada
disparada "al iniciar sesión" en vez de servicio, y `-RunLevel Limited`
para que no pida privilegios de administrador (no los necesita).

### Publicar el ejecutable

```bash
dotnet publish SLCDM.Agent.csproj -c Release -r win-x64 --self-contained true -o publish
```

Esto genera `publish/SLCDMAgente.exe` (un solo archivo, no necesita el
runtime de .NET instalado en la laptop destino) — ese es el que se copia
junto con `instalar-tarea.ps1` a cada equipo (o se distribuye por GPO/SCCM
si el parque es grande).

---

## 4. BE-30 — Firma digital + PDF de asignación + correo al responsable

Modelo de datos ya listo en `Asignacion` (`FirmaEntrega`, `FechaFirmaEntrega`,
`FirmaRecibe`, `DocumentoPdfUrl`, `DocumentoPdfGenerardoEn`) — falta la lógica.

**Simplificación deliberada:** el PDF del repo de prueba usa una hoja
membretada corporativa convertida con `PDFtoImage`/`SkiaSharp`, que **solo
funciona en Windows** (marcado `[SupportedOSPlatform("windows")]` en su
propio código) — mala idea si el backend se despliega en Linux. La versión
de abajo genera un PDF limpio con QuestPDF sin depender de esa imagen ni
de esa librería. También quité la dependencia del código QR (que depende
de la Consulta pública, sección opcional) — el PDF funciona sin eso.

### 4.1 Paquetes NuGet

`src/SLCDM.Application/SLCDM.Application.csproj`:

```xml
    <PackageReference Include="QuestPDF" Version="2024.12.3" />
```

`src/SLCDM.Api/SLCDM.Api.csproj`:

```xml
    <PackageReference Include="MailKit" Version="4.13.0" />
```

### 4.2 `src/SLCDM.Application/Common/Options/SmtpOptions.cs` (nuevo)

```csharp
namespace SLCDM.Application.Common.Options;

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";
    public bool Enabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string User { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string FromName { get; set; } = "SLC Devices Management";
    public bool UseStartTls { get; set; } = true;
    public string PublicAppUrl { get; set; } = "http://localhost:5173";
}
```

`src/SLCDM.Api/appsettings.json` — agregar:

```json
  "Smtp": {
    "Enabled": false,
    "Host": "",
    "Port": 587,
    "User": "",
    "Password": "",
    "From": "",
    "FromName": "SLC Devices Management",
    "UseStartTls": true,
    "PublicAppUrl": "http://localhost:5173"
  },
```

`Enabled: false` por defecto a propósito, para poder mergear esto sin
tener credenciales SMTP todavía. Cuando las consigan, van en
`user-secrets` (nunca en el `appsettings.json` commiteado).

### 4.3 Interfaces nuevas (Application/Common/Interfaces)

`IEmailSender.cs`:

```csharp
namespace SLCDM.Application.Common.Interfaces;

public sealed record EmailAttachment(string FileName, string ContentType, byte[] Content);

public interface IEmailSender
{
    Task SendAsync(
        string to, string subject, string htmlBody,
        IReadOnlyList<EmailAttachment>? attachments = null,
        CancellationToken cancellationToken = default);
}
```

`IAsignacionPdfService.cs`:

```csharp
namespace SLCDM.Application.Common.Interfaces;

public interface IAsignacionPdfService
{
    Task<Features.Asignaciones.AsignacionPdfFileDto> GenerarAsync(
        int idAsignacion, CancellationToken cancellationToken = default);
}
```

`IAsignacionCorreoService.cs`:

```csharp
namespace SLCDM.Application.Common.Interfaces;

public interface IAsignacionCorreoService
{
    Task NotificarResponsableAsync(int idAsignacion, CancellationToken cancellationToken = default);
}
```

### 4.4 `AsignacionPdfFileDto` — agregar al final de `AsignacionDto.cs`

```csharp
public sealed record AsignacionPdfFileDto(byte[] Content, string FileName);
```

### 4.5 `AsignacionPdfService.cs` (nuevo)

`src/SLCDM.Application/Features/Asignaciones/AsignacionPdfService.cs`:

```csharp
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
```

### 4.6 `GetAsignacionPdfQuery.cs` (nuevo)

`src/SLCDM.Application/Features/Asignaciones/Queries/GetAsignacionPdfQuery.cs`:

```csharp
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Asignaciones.Queries;

public sealed record GetAsignacionPdfQuery(int Id);

public sealed class GetAsignacionPdfQueryValidator : AbstractValidator<GetAsignacionPdfQuery>
{
    public GetAsignacionPdfQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id asignacion");
    }
}

public sealed class GetAsignacionPdfQueryHandler : IQueryHandler<GetAsignacionPdfQuery, AsignacionPdfFileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IAsignacionPdfService _pdf;
    private readonly IValidator<GetAsignacionPdfQuery> _validator;

    public GetAsignacionPdfQueryHandler(
        IApplicationDbContext db, IAsignacionPdfService pdf, IValidator<GetAsignacionPdfQuery> validator)
    {
        _db = db;
        _pdf = pdf;
        _validator = validator;
    }

    public async Task<AsignacionPdfFileDto> HandleAsync(
        GetAsignacionPdfQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);
        var file = await _pdf.GenerarAsync(query.Id, cancellationToken);

        var tracked = await _db.Asignaciones.FirstOrDefaultAsync(a => a.Id == query.Id, cancellationToken);
        if (tracked is not null && tracked.DocumentoPdfGenerardoEn is null)
        {
            tracked.DocumentoPdfUrl ??= $"/api/asignaciones/{tracked.Id}/pdf";
            tracked.DocumentoPdfGenerardoEn = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        return file;
    }
}
```

### 4.7 `AsignacionCorreoService.cs` (nuevo)

`src/SLCDM.Application/Features/Asignaciones/AsignacionCorreoService.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Asignaciones;

public sealed class AsignacionCorreoService : IAsignacionCorreoService
{
    private readonly IApplicationDbContext _db;
    private readonly IAsignacionPdfService _pdf;
    private readonly IEmailSender _email;
    private readonly ILogger<AsignacionCorreoService> _logger;

    public AsignacionCorreoService(
        IApplicationDbContext db, IAsignacionPdfService pdf, IEmailSender email,
        ILogger<AsignacionCorreoService> logger)
    {
        _db = db;
        _pdf = pdf;
        _email = email;
        _logger = logger;
    }

    public async Task NotificarResponsableAsync(int idAsignacion, CancellationToken cancellationToken = default)
    {
        try
        {
            var asignacion = await _db.Asignaciones.AsNoTracking()
                .Include(a => a.TipoAsignacion)
                .FirstOrDefaultAsync(a => a.Id == idAsignacion, cancellationToken);
            if (asignacion is null)
            {
                _logger.LogWarning("No se envio el acta {Id}: asignacion no encontrada.", idAsignacion);
                return;
            }

            var responsable = await _db.Responsables.AsNoTracking().IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.Id == asignacion.IdResponsable, cancellationToken);
            var to = responsable?.Correo?.Trim();
            if (string.IsNullOrWhiteSpace(to))
            {
                _logger.LogWarning("No se envio el acta {Id}: el responsable no tiene correo.", idAsignacion);
                return;
            }

            var esBaja = TipoAsignacionNombres.EsNombre(asignacion.TipoAsignacion?.Nombre, TipoAsignacionNombres.Baja);
            var pdf = await _pdf.GenerarAsync(idAsignacion, cancellationToken);
            var activo = await _db.Activos.AsNoTracking().IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == asignacion.IdActivo, cancellationToken);
            var activoNombre = activo?.Nombre ?? $"#{asignacion.IdActivo}";
            var asunto = esBaja ? $"Baja de activo {activoNombre}" : $"Asignación de activo {activoNombre}";
            var cuerpo = esBaja
                ? $"<p>Hola {responsable!.NombreCompleto},</p><p>Se registró la <strong>baja</strong> del activo <strong>{activoNombre}</strong>. Adjunto encontrará el acta en PDF.</p>"
                : $"<p>Hola {responsable!.NombreCompleto},</p><p>Se le asignó el activo <strong>{activoNombre}</strong>. Adjunto encontrará el acta de entrega en PDF.</p>";

            await _email.SendAsync(
                to, asunto, cuerpo,
                [new EmailAttachment(pdf.FileName, "application/pdf", pdf.Content)],
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo enviar el PDF de la asignacion {Id} al responsable.", idAsignacion);
        }
    }
}
```

Este método atrapa cualquier error y solo deja un log — a propósito, para
que un SMTP caído o un responsable sin correo nunca tumbe la operación de
negocio (crear la asignación) que sí importa que se guarde.

### 4.8 `SmtpEmailSender.cs` (nuevo, vive en Api)

`src/SLCDM.Api/Email/SmtpEmailSender.cs`:

```csharp
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Options;
using MimeKit;

namespace SLCDM.Api.Email;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(
        string to, string subject, string htmlBody,
        IReadOnlyList<EmailAttachment>? attachments = null,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.Host) || string.IsNullOrWhiteSpace(_options.From))
        {
            _logger.LogWarning("SMTP deshabilitado o incompleto. No se envio '{Subject}' a {To}.", subject, to);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.From));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var body = new BodyBuilder { HtmlBody = htmlBody };
        if (attachments is not null)
        {
            foreach (var file in attachments)
            {
                body.Attachments.Add(file.FileName, file.Content, MimeKit.ContentType.Parse(file.ContentType));
            }
        }
        message.Body = body.ToMessageBody();

        using var client = new SmtpClient();
        var secure = _options.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
        await client.ConnectAsync(_options.Host, _options.Port, secure, cancellationToken);
        if (!string.IsNullOrWhiteSpace(_options.User))
        {
            await client.AuthenticateAsync(_options.User.Trim(), _options.Password ?? string.Empty, cancellationToken);
        }
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
        _logger.LogInformation("Correo enviado a {To}: {Subject}", to, subject);
    }
}
```

### 4.9 Registro en DI

`src/SLCDM.Application/DependencyInjection.cs` — agregar dentro de `AddApplication`:

```csharp
        services.AddScoped<IAsignacionPdfService, AsignacionPdfService>();
        services.AddScoped<IAsignacionCorreoService, AsignacionCorreoService>();
```

`src/SLCDM.Api/Program.cs` — agregar junto a las demás `builder.Services.Configure<...>`:

```csharp
builder.Services.Configure<SLCDM.Application.Common.Options.SmtpOptions>(
    builder.Configuration.GetSection(SLCDM.Application.Common.Options.SmtpOptions.SectionName));
builder.Services.AddSingleton<SLCDM.Application.Common.Interfaces.IEmailSender, SLCDM.Api.Email.SmtpEmailSender>();
```

### 4.10 Enganchar el envío en `CreateAsignacionCommand.cs` y `CreateBajaCommand.cs`

En ambos handlers: inyectar `IAsignacionCorreoService _correo` en el
constructor, y justo antes del `return` final (después de que la entidad
ya se guardó con `SaveChangesAsync`) agregar:

```csharp
        await _correo.NotificarResponsableAsync(entity.Id, cancellationToken);
```

(usa el nombre de variable que ya tenga la entidad recién creada en cada
handler — revisá el `return entity.Id;` existente para ubicar el punto
exacto). Como el método atrapa sus propios errores, esto nunca puede
tumbar la creación de la asignación aunque el correo falle.

### 4.11 `AsignacionesController.cs` — endpoint de descarga

Agregar el campo `_pdf` (tipo `IQueryHandler<GetAsignacionPdfQuery, AsignacionPdfFileDto>`),
inyectarlo en el constructor igual que los demás query handlers, y agregar:

```csharp
    [HttpGet("{id:int}/pdf")]
    [Authorize(Roles = Roles.Lectura)]
    [Produces("application/pdf")]
    public async Task<IActionResult> GetPdf(int id, CancellationToken cancellationToken)
    {
        var file = await _pdf.HandleAsync(new GetAsignacionPdfQuery(id), cancellationToken);
        return File(file.Content, "application/pdf", file.FileName);
    }
```

Para el frontend, esto sale como `GET /api/asignaciones/{id}/pdf` — la
firma se manda como `byte[]?` en el JSON del `POST`/`PUT` de siempre
(base64 estándar, ASP.NET Core lo deserializa solo). Dale a Benjamín la
firma exacta del JSON cuando esté listo para conectar el formulario.

---

---

# BE-31 / FE-18 — Consulta pública por QR (CONFIRMADO — ya no es opcional)

Confirmado por el cliente: se debe poder escanear el QR físico pegado al
activo con la cámara del celular (sin instalar ninguna app, sin login) y
que eso abra directamente la ficha de consulta del activo. Esto ya
funciona así de por sí en cualquier celular moderno: un código QR no es
más que una URL codificada, y la cámara nativa de iOS/Android reconoce la
URL y ofrece abrirla en el navegador — no hace falta ninguna app de
lector de QR aparte, ni que el usuario tenga sesión iniciada en el
sistema. Por eso el diseño de abajo es exactamente ese: un endpoint
público (`[AllowAnonymous]`) y una página del frontend sin login, ambos
apuntando a la misma URL que lleva codificada el QR.

**Importante — identificador no adivinable.** El QR no debe apuntar a
`/consulta/activos/{id}` con el id secuencial de la base de datos —
cualquiera podría probar `1, 2, 3...` y ver todos los activos de todas las
empresas. Por eso se agrega un campo nuevo `TokenPublico` (una cadena
larga, no secuencial) y la URL/el endpoint público usan ese token, nunca
el id de la tabla.

## 1. Domain — `Activo.TokenPublico`

`src/SLCDM.Domain/Entities/Activo.cs` — agregar al final de la clase:

```csharp
    [Required]
    [MaxLength(32, ErrorMessage = "El campo token publico no debe superar los 32 caracteres")]
    public string TokenPublico { get; set; } = string.Empty;
```

## 2. Configuración EF — `ActivoConfiguration.cs`

Agregar junto a las demás `builder.Property(...)`:

```csharp
            builder.Property(a => a.TokenPublico)
                .HasColumnName("token_publico")
                .HasColumnType("varchar(32)")
                .IsRequired();

            builder.HasIndex(a => a.TokenPublico).IsUnique();
```

## 3. Migración — con backfill para los activos que ya existen

Como `Activo` ya tiene filas en producción/desarrollo, no se puede agregar
una columna `NOT NULL` de una sola vez sin darle un valor a las filas
existentes primero. La migración generada por EF hay que editarla a mano
para eso:

```bash
dotnet ef migrations add AddTokenPublicoActivo --project src/SLCDM.Persistence --startup-project src/SLCDM.Api
```

Editar el archivo generado (`..._AddTokenPublicoActivo.cs`) para que el
`Up()` quede así (agregar la columna como nullable, rellenar, luego volver
a `NOT NULL` + índice único):

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<string>(
        name: "token_publico",
        table: "activo",
        type: "varchar(32)",
        maxLength: 32,
        nullable: true);

    // Backfill: cada activo existente recibe un token unico antes de
    // volver la columna obligatoria.
    migrationBuilder.Sql(
        "UPDATE activo SET token_publico = LOWER(REPLACE(CONVERT(varchar(36), NEWID()), '-', '')) WHERE token_publico IS NULL;");

    migrationBuilder.AlterColumn<string>(
        name: "token_publico",
        table: "activo",
        type: "varchar(32)",
        maxLength: 32,
        nullable: false,
        oldClrType: typeof(string),
        oldType: "varchar(32)",
        oldNullable: true);

    migrationBuilder.CreateIndex(
        name: "IX_activo_token_publico",
        table: "activo",
        column: "token_publico",
        unique: true);
}
```

(El `Down()` que ya viene generado por EF -- que solo borra la columna --
no necesita cambios.)

```bash
dotnet ef migrations script --idempotent --project src/SLCDM.Persistence --startup-project src/SLCDM.Api -o Scripts/AddTokenPublicoActivo.sql
```

## 4. Generar el token al crear un activo

`src/SLCDM.Application/Features/Activos/Commands/CreateActivoCommand.cs` —
en el handler, justo antes de `_db.Activos.Add(entity)`:

```csharp
        entity.TokenPublico = Guid.NewGuid().ToString("N")[..24];
```

(24 caracteres hexadecimales de un GUID -- prácticamente imposible de
adivinar o de generar colisión, y entra sin problema en `varchar(32)`.)

## 5. `Frontend:PublicUrl` — de dónde sale la URL del QR

`src/SLCDM.Api/appsettings.json` — agregar una sección nueva:

```json
  "Frontend": {
    "PublicUrl": "http://localhost:5173"
  },
```

En producción esto se pone en `appsettings.Production.json` o
`user-secrets` con la URL pública real del frontend (ej.
`https://inventario.slc.com.gt`). Se usa un valor de configuración fijo
(no la cabecera `Origin` de la petición) porque el QR se genera una vez y
se imprime/pega físicamente en el activo -- tiene que apuntar siempre a la
misma URL pública, sin importar desde qué navegador se generó.

## 6. `ActivoQr.cs` (nuevo)

`src/SLCDM.Application/Features/Activos/ActivoQr.cs`:

```csharp
using QRCoder;

namespace SLCDM.Application.Features.Activos;

public static class ActivoQr
{
    public static string Url(string publicUrl, string tokenPublico) =>
        $"{publicUrl.TrimEnd('/')}/consulta/{tokenPublico}";

    public static byte[] Png(string payload)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.M);
        var png = new PngByteQRCode(data);
        return png.GetGraphic(8);
    }
}
```

Paquete NuGet nuevo en `src/SLCDM.Application/SLCDM.Application.csproj`:

```xml
    <PackageReference Include="QRCoder" Version="1.6.0" />
```

## 7. `GetActivoQrQuery.cs` (nuevo) — genera el PNG para que el personal lo imprima

`src/SLCDM.Application/Features/Activos/Queries/GetActivoQrQuery.cs`:

```csharp
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Activos.Queries;

public sealed record GetActivoQrQuery(int Id);

public sealed record ActivoQrFileDto(byte[] Content, string FileName);

public sealed class GetActivoQrQueryValidator : AbstractValidator<GetActivoQrQuery>
{
    public GetActivoQrQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id activo");
    }
}

public sealed class GetActivoQrQueryHandler : IQueryHandler<GetActivoQrQuery, ActivoQrFileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IValidator<GetActivoQrQuery> _validator;

    public GetActivoQrQueryHandler(
        IApplicationDbContext db, IConfiguration configuration, IValidator<GetActivoQrQuery> validator)
    {
        _db = db;
        _configuration = configuration;
        _validator = validator;
    }

    public async Task<ActivoQrFileDto> HandleAsync(GetActivoQrQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var activo = await _db.Activos.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException("Activo", query.Id);

        var publicUrl = _configuration["Frontend:PublicUrl"] ?? "http://localhost:5173";
        var url = ActivoQr.Url(publicUrl, activo.TokenPublico);
        var png = ActivoQr.Png(url);

        return new ActivoQrFileDto(png, $"qr-activo-{activo.Id}.png");
    }
}
```

## 8. Ficha pública — `Features/Consulta/`

`src/SLCDM.Application/Features/Consulta/ConsultaActivoDto.cs`:

```csharp
namespace SLCDM.Application.Features.Consulta;

/// <summary>
/// Ficha publica al escanear el QR. Sin costos, sin numero de factura,
/// sin historial de movimientos -- solo lo minimo para identificar el
/// equipo y saber si esta disponible, asignado, en mantenimiento o de baja.
/// </summary>
public sealed record ConsultaActivoDto(
    int Id,
    string Nombre,
    string? Descripcion,
    string? Marca,
    string? Modelo,
    string? NumeroSerie,
    string? NombreCategoria,
    string? NombreEmpresa,
    string? NombreSede,
    string? NombreUbicacion,
    string? NombreArea,
    string? NombreResponsable,
    string EstadoOperativo,
    string EstadoNombre,
    DateTime? FechaVencimientoGarantia);
```

`src/SLCDM.Application/Features/Consulta/Queries/GetConsultaActivoQuery.cs` —
**escrita desde cero contra el esquema real** (no es una copia del repo de
prueba: su versión original tenía los mismos dos problemas que ya
corregimos en `ActivoReporteConsulta` de Sprint 9 -- resolvía la empresa
vía `Ubicacion` con `INNER JOIN`, obligatorio en su esquema pero nullable
acá, y reconstruía el estado recorriendo asignaciones en vez de leer
`Activo.IdEstado`). Esta versión usa el mismo camino ya correcto:

```csharp
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.Asignaciones;
using SLCDM.Application.Features.Reportes;

namespace SLCDM.Application.Features.Consulta.Queries;

public sealed record GetConsultaActivoQuery(string Token);

public sealed class GetConsultaActivoQueryValidator : AbstractValidator<GetConsultaActivoQuery>
{
    public GetConsultaActivoQueryValidator()
    {
        RuleFor(x => x.Token).NotEmpty().WithMessage("El campo token es obligatorio.");
    }
}

public sealed class GetConsultaActivoQueryHandler : IQueryHandler<GetConsultaActivoQuery, ConsultaActivoDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<GetConsultaActivoQuery> _validator;

    public GetConsultaActivoQueryHandler(IApplicationDbContext db, IValidator<GetConsultaActivoQuery> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ConsultaActivoDto> HandleAsync(
        GetConsultaActivoQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        // IgnoreQueryFilters: la consulta publica es intencionalmente
        // multiempresa -- el token ya es el control de acceso (no
        // adivinable), no hace falta ademas exigir tenant.
        var activo = await _db.Activos.IgnoreQueryFilters().AsNoTracking()
            .Include(a => a.CategoriaActivo)
            .Include(a => a.Proveedor)
            .Include(a => a.Ubicacion)
            .FirstOrDefaultAsync(a => a.TokenPublico == query.Token, cancellationToken)
            ?? throw new NotFoundException("Activo", query.Token);

        var empresa = await _db.Empresas.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == activo.Proveedor!.IdEmpresa, cancellationToken);

        Sede? sede = null;
        if (activo.Ubicacion is not null)
        {
            sede = await _db.Sedes.IgnoreQueryFilters().AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == activo.Ubicacion.IdSede, cancellationToken);
        }

        var estados = await _db.Estados.AsNoTracking().ToListAsync(cancellationToken);
        var nombreEstado = activo.IdEstado.HasValue
            ? estados.FirstOrDefault(e => e.Id == activo.IdEstado.Value)?.Nombre
            : null;

        string estadoOperativo;
        if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.Asignado))
        {
            estadoOperativo = "asignado";
        }
        else if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.EnMantenimiento))
        {
            estadoOperativo = "mantenimiento";
        }
        else if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.DadoDeBaja))
        {
            estadoOperativo = "baja";
        }
        else
        {
            estadoOperativo = "disponible";
        }

        string? nombreResponsable = null;
        string? nombreArea = null;
        if (estadoOperativo == "asignado")
        {
            var asignacionActiva = await _db.Asignaciones.IgnoreQueryFilters().AsNoTracking()
                .Where(a => a.IdActivo == activo.Id && a.Activa)
                .OrderByDescending(a => a.FechaAsignacion)
                .FirstOrDefaultAsync(cancellationToken);

            if (asignacionActiva is not null)
            {
                var responsable = await _db.Responsables.IgnoreQueryFilters().AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == asignacionActiva.IdResponsable, cancellationToken);
                if (responsable is not null)
                {
                    nombreResponsable = responsable.NombreCompleto;
                    var area = await _db.Areas.IgnoreQueryFilters().AsNoTracking()
                        .FirstOrDefaultAsync(a => a.Id == responsable.IdArea, cancellationToken);
                    nombreArea = area?.Nombre;
                }
            }
        }

        return new ConsultaActivoDto(
            activo.Id,
            activo.Nombre,
            activo.Descripcion,
            activo.Marca,
            activo.Modelo,
            activo.NumeroSerie,
            activo.CategoriaActivo?.Nombre,
            empresa?.Nombre,
            sede?.Nombre,
            activo.Ubicacion?.Nombre,
            nombreArea,
            nombreResponsable,
            estadoOperativo,
            ActivoEstadoOperativoNombreVisible(estadoOperativo),
            activo.FechaVencimientoGarantia);
    }

    private static string ActivoEstadoOperativoNombreVisible(string estado) => estado switch
    {
        "asignado" => "Asignado",
        "mantenimiento" => "En mantenimiento",
        "baja" => "Baja",
        _ => "Disponible"
    };
}
```

> Nota: escribí `ActivoEstadoOperativoNombreVisible` como método propio en
> vez de reusar `ActivoEstadoOperativo.NombreVisible` de `Features.Reportes`
> para no crear una dependencia cruzada entre `Consulta` y `Reportes` solo
> por 4 líneas -- funcionalmente es exactamente lo mismo. Si preferís
> reusar el de Reportes, es válido (es `internal`, pero accesible dentro
> del mismo ensamblado `SLCDM.Application`); a criterio del equipo.

## 9. `ConsultaController.cs` (nuevo, público)

`src/SLCDM.Api/Controllers/ConsultaController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SLCDM.Api.Extensions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.Consulta;
using SLCDM.Application.Features.Consulta.Queries;

namespace SLCDM.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/consulta")]
[Produces("application/json")]
public sealed class ConsultaController : ControllerBase
{
    private readonly IQueryHandler<GetConsultaActivoQuery, ConsultaActivoDto> _getActivo;

    public ConsultaController(IQueryHandler<GetConsultaActivoQuery, ConsultaActivoDto> getActivo)
    {
        _getActivo = getActivo;
    }

    [HttpGet("activos/{token}")]
    [EnableRateLimiting(RateLimitingExtensions.ConsultaPolicy)]
    [ProducesResponseType(typeof(ConsultaActivoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ConsultaActivoDto>> GetActivo(
        string token, CancellationToken cancellationToken) =>
        Ok(await _getActivo.HandleAsync(new GetConsultaActivoQuery(token), cancellationToken));
}
```

Este controller **no hereda de `ApiControllerBase`** (esa clase base
probablemente ya trae `[Authorize]` a nivel de clase para el resto del
sistema) -- se define standalone con `[AllowAnonymous]` explícito, igual
que hace el repo de prueba, para que quede clarísimo en el código que este
es el único rincón público de toda la Api.

## 10. `RateLimitingExtensions.cs` — agregar `ConsultaPolicy`

El archivo ya existe en el repo real con `AuthPolicy`. Agregar dentro de
`AddRateLimitingPolicies`, junto al que ya está:

```csharp
    public const string ConsultaPolicy = "ConsultaPolicy";
```

Y dentro de `services.AddRateLimiter(options => { ... })`, antes de
`options.OnRejected = ...`:

```csharp
            options.AddPolicy(ConsultaPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 40,
                        Window = TimeSpan.FromMinutes(1)
                    }));
```

(40 consultas por minuto por IP -- suficientemente holgado para uso normal
de alguien escaneando QRs uno por uno, pero corta un script probando
tokens al vuelo. `Program.cs` ya tiene `app.UseRateLimiter()`, no hace
falta tocarlo.)

## 11. `ActivosController.cs` — endpoint para que el personal descargue el QR

Este SÍ requiere login (es para que el personal de inventario lo
imprima/pegue en el equipo, no para el público). Agregar el campo `_qr`
(tipo `IQueryHandler<GetActivoQrQuery, ActivoQrFileDto>`), inyectarlo en el
constructor igual que los demás query handlers, y agregar:

```csharp
    [HttpGet("{id:int}/qr")]
    [Authorize(Roles = Roles.Lectura)]
    [Produces("image/png")]
    public async Task<IActionResult> GetQr(int id, CancellationToken cancellationToken)
    {
        var file = await _qr.HandleAsync(new GetActivoQrQuery(id), cancellationToken);
        return File(file.Content, "image/png", file.FileName);
    }
```

---

## Frontend — Consulta pública (reemplaza la nota de "no empezar" anterior)

Dos piezas nuevas, y son bien distintas entre sí -- una es pública, la
otra es para el personal interno.

**1. Página pública de consulta (`/consulta/:token`).** Es la pantalla que
se abre cuando alguien escanea el QR con la cámara del celular. No lleva
el menú ni el layout normal del sistema (la persona que escanea no tiene
ni necesita una cuenta) -- es una pantalla simple, tipo "ficha", con el
nombre del activo, marca, modelo, número de serie, categoría, empresa,
sede, ubicación, si está disponible/asignado/en mantenimiento/de baja, y
si está asignado, a quién y en qué área (sin mostrar costos, número de
factura ni nada financiero -- eso se queda solo para el personal
autenticado). Si el token no existe o el activo fue eliminado, mostrar un
mensaje simple de "no encontrado", no un error técnico. Esta ruta tiene
que registrarse en el router de React de forma que no pida login para
verla (a diferencia de todas las demás rutas del sistema).

**2. Botón "ver/descargar código QR" en la ficha de detalle del activo**
(la pantalla donde el personal ya ve/edita un activo existente). Al
presionarlo, se descarga o se muestra la imagen PNG del QR para ese
activo, lista para imprimir y pegar físicamente en el equipo. Esta parte
sí requiere que la persona tenga sesión iniciada, como el resto del
sistema.

El backend ya deja lista la URL exacta que hay que llamar para cada una
(`GET /api/consulta/activos/{token}` para la ficha pública,
`GET /api/activos/{id}/qr` para la imagen del QR) -- avisame cuando
Benjamín esté por conectar esta parte y le paso el detalle fino del
formato de respuesta.
