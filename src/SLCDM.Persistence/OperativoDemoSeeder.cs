using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Features.Asignaciones;
using SLCDM.Domain.Entities;
using SLCDM.Domain.Enums;

namespace SLCDM.Persistence;

/// <summary>
/// Semilla operativa sobre la organización ya existente (empresa con «Sistemas»
/// o la primera). No crea usuarios, sedes, áreas, ubicaciones, países ni redes.
/// Idempotente vía códigos internos INV-.
/// </summary>
internal static class OperativoDemoSeeder
{
    private const int ActivosCount = 50;
    private const string CodigoPrefix = "INV-";

    private static readonly (string Nombre, string Descripcion)[] CategoriasExtra =
    [
        ("Laptop corporativa", "Equipos portatiles de uso diario"),
        ("Monitor de escritorio", "Pantallas para estaciones de trabajo"),
        ("Impresora de oficina", "Impresion y multifuncionales"),
        ("Equipo de red", "Switches, APs y routers"),
        ("Periferico de entrada", "Teclados, mouse y lectores")
    ];

    private static readonly (string Nombre, string Descripcion)[] EstadosExtra =
    [
        ("En transito", "Activo en movimiento entre sedes"),
        ("Reservado", "Reservado para una entrega proxima"),
        ("En diagnostico", "En revision tecnica previa a mantenimiento"),
        ("Prestamo temporal", "Prestado por un periodo definido"),
        ("Pendiente de baja", "Marcado para baja, pendiente de autorizacion")
    ];

    private static readonly (string Nombre, string Descripcion)[] TiposAsignacionExtra =
    [
        ("Prestamo", "Entrega temporal con fecha de devolucion pactada"),
        ("Custodia", "Responsable custodia el activo sin uso exclusivo"),
        ("Comodato", "Uso autorizado sin transferencia de propiedad"),
        ("Resguardo", "Almacenamiento temporal bajo responsabilidad"),
        ("Inventario fisico", "Movimiento asociado a conteo de inventario")
    ];

    private static readonly (string Nombre, string Descripcion)[] TiposMantenimientoExtra =
    [
        ("Predictivo", "Basado en indicadores antes de la falla"),
        ("Calibracion", "Ajuste de precision de equipos"),
        ("Actualizacion de firmware", "Actualizacion de software embebido"),
        ("Limpieza profunda", "Mantenimiento de higiene tecnica"),
        ("Garantia de fabricante", "Atencion cubierta por garantia")
    ];

    private static readonly (string Nombre, string Descripcion)[] MotivosBajaExtra =
    [
        ("Obsolescencia", "Tecnologia fuera de soporte o ciclo de vida"),
        ("Falta de repuestos", "No hay partes disponibles para reparar"),
        ("Cambio de plataforma", "Migracion a otra linea de equipos"),
        ("Danio por liquido", "Exposicion a liquidos que inutiliza el equipo"),
        ("Fin de contrato", "Equipo devuelto o retirado al cerrar contrato")
    ];

    private static readonly (string Nombre, string Nit, string Contacto, string Correo)[] ProveedoresInventados =
    [
        ("Tecnología Quetzal, S.A.", "8791456-7", "Marlon Estrada", "ventas@tecnoquetzal.gt"),
        ("Distribuidora Atitlán Systems", "4523098-1", "Karla Méndez", "contacto@atitlansystems.gt"),
        ("Comercial Pacífico IT", "6638214-5", "Byron López", "info@pacificoit.gt"),
        ("Soluciones Petén Digital", "3189072-3", "Andrea Coy", "soporte@petendigital.gt"),
        ("Importadora Maya Soft", "7402561-9", "Luis Recinos", "compras@mayasoft.gt"),
        ("Redes y Cableado Xelajú", "5912034-8", "Sofía Cabrera", "redes@xelajunet.gt"),
        ("Ofimática Reforma", "2267845-2", "Pedro Samayoa", "hola@ofimaticareforma.gt"),
        ("Suministros Industriales Mixco", "8845120-6", "Elena Barrios", "ventas@suministrosmixco.gt"),
        ("Global Print Guatemala", "3371498-0", "Ricardo Palacios", "print@globalprint.gt"),
        ("Nube y Servidores Latam GT", "6098731-4", "Gabriela Ixcoy", "cloud@nubeservidores.gt"),
        ("Electrocomp Amatitlán", "1556089-7", "Héctor Ruano", "ventas@electrocomp.gt"),
        ("Seguridad Electrónica Antigua", "4729103-1", "Mónica Chacón", "seguridad@sea-antigua.gt")
    ];

    private static readonly (string NombreCompleto, string Cargo)[] ResponsablesInventados =
    [
        ("José Emilio Bolaños López", "Coordinador de TI"),
        ("Rosa Elena García Pérez", "Analista de inventario"),
        ("Miguel Ángel Soto Ramírez", "Supervisor de operaciones"),
        ("Lucía Fernanda Chávez Méndez", "Encargada de activos"),
        ("Pablo José Recinos Díaz", "Técnico de soporte"),
        ("Ana Isabel Morales Cruz", "Jefa de área administrativa"),
        ("Carlos Roberto Hernández Flores", "Operador de bodega"),
        ("María Fernanda López Aguilar", "Asistente de compras"),
        ("Diego Alejandro Ruiz Castillo", "Especialista de redes"),
        ("Carmen Lucía Gómez Torres", "Coordinadora de sedes"),
        ("Andrés Felipe Navarro Jiménez", "Técnico de mantenimiento"),
        ("Patricia Elena Vargas Rojas", "Analista de control interno"),
        ("Roberto Carlos Mendoza Silva", "Supervisor de logística"),
        ("Gabriela Marisol Pineda Ortiz", "Responsable de ayuda"),
        ("Fernando José Alvarado Campos", "Ingeniero de soporte"),
        ("Claudia Beatriz Escobar Medina", "Administradora de contratos"),
        ("Héctor Manuel Sandoval Mejía", "Técnico de campo"),
        ("Mónica Alejandra Barrios Cifuentes", "Coordinadora de inventario"),
        ("Raúl Estuardo Orellana Samayoa", "Operador de activos"),
        ("Andrea Sofía Ixcoy Pop", "Asistente de TI"),
        ("Oscar Daniel Cac Tuy", "Técnico de impresión"),
        ("Diana Paola Rivera Gómez", "Encargada de recepción"),
        ("Francisco Javier Díaz Morales", "Supervisor de turno"),
        ("Natalia Andrea Reyes Gutiérrez", "Analista de garantías"),
        ("Eduardo José Castillo Romero", "Técnico de cableado"),
        ("Valeria Michelle Aguilar Soto", "Coordinadora administrativa"),
        ("Alberto Luis Méndez Chávez", "Operador de almacén"),
        ("Camila Fernanda Ruiz López", "Asistente de operaciones"),
        ("Sergio David Torres Hernández", "Especialista de hardware"),
        ("Daniela María Flores García", "Responsable de documentación")
    ];

    private static readonly (string Nombre, string Marca, string Modelo, string CategoriaHint)[] ActivosPlantilla =
    [
        ("Laptop Latitude 5540", "Dell", "5540", "Laptop"),
        ("Laptop ThinkPad E14", "Lenovo", "E14 Gen 5", "Laptop"),
        ("Laptop EliteBook 840", "HP", "840 G10", "Laptop"),
        ("Monitor UltraSharp 27", "Dell", "U2722D", "Monitor"),
        ("Monitor P27h", "Lenovo", "P27h-20", "Monitor"),
        ("Monitor E27 G5", "HP", "E27 G5", "Monitor"),
        ("Impresora LaserJet Pro", "HP", "M404dn", "Impresora"),
        ("Impresora EcoTank L3250", "Epson", "L3250", "Impresora"),
        ("Multifuncional imageCLASS", "Canon", "MF445dw", "Impresora"),
        ("Switch Catalyst 2960", "Cisco", "WS-C2960X", "red"),
        ("Switch UniFi 24 PoE", "Ubiquiti", "USW-24-PoE", "red"),
        ("Access Point UniFi 6", "Ubiquiti", "U6-LR", "red"),
        ("Router ISR 4331", "Cisco", "ISR4331", "red"),
        ("Teclado MX Keys", "Logitech", "MX Keys", "Periferico"),
        ("Mouse MX Master 3S", "Logitech", "MX Master 3S", "Periferico"),
        ("Docking WD19S", "Dell", "WD19S", "Periferico"),
        ("UPS Smart-UPS 1500", "APC", "SMT1500", "UPS"),
        ("UPS Back-UPS 900", "APC", "BX900M", "UPS"),
        ("Tablet Galaxy Tab A9", "Samsung", "SM-X110", "Tablet"),
        ("iPad 10 gen", "Apple", "A2696", "Tablet"),
        ("Proyector PowerLite", "Epson", "2255U", "Proyector"),
        ("TV Crystal UHD 55", "Samsung", "UN55CU7000", "TV"),
        ("Webcam Brio 4K", "Logitech", "Brio", "Periferico"),
        ("Headset Zone Wired", "Logitech", "Zone Wired", "Periferico"),
        ("Teléfono IP 8841", "Cisco", "CP-8841", "Telefono"),
        ("Servidor PowerEdge R740", "Dell", "R740", "Servidor"),
        ("NAS Synology DS923+", "Synology", "DS923+", "NAS"),
        ("Disco externo 4TB", "Seagate", "Expansion 4TB", "Almacenamiento"),
        ("SSD portátil T7 1TB", "Samsung", "MU-PC1T0", "Almacenamiento"),
        ("Lector de código DS2208", "Zebra", "DS2208", "Periferico"),
        ("Impresora térmica ZD420", "Zebra", "ZD420", "Impresora"),
        ("Mini PC ThinkCentre", "Lenovo", "M70q Gen 3", "PC"),
        ("Thin Client t430", "HP", "t430", "PC"),
        ("Laptop Rugged 14", "Dell", "Latitude 5430 Rugged", "Laptop"),
        ("Cámara CCTV Dome", "Hikvision", "DS-2CD2143", "CCTV"),
        ("NVR 8 canales", "Hikvision", "DS-7608NI", "CCTV"),
        ("Control de acceso DS-K1T", "Hikvision", "DS-K1T671", "Acceso"),
        ("Reloj checador ZK", "ZKTeco", "K40", "Acceso"),
        ("Gabinete rack 42U", "Panduit", "Net-Access 42U", "Infraestructura"),
        ("PDU metered 30A", "APC", "AP8853", "Infraestructura"),
        ("Extensor PoE Gigabit", "TP-Link", "TL-POE160S", "red"),
        ("Antena omni 5 GHz", "Ubiquiti", "AMO-5G13", "red"),
        ("Plotter DesignJet T650", "HP", "T650 36", "Impresora"),
        ("Escáner ScanSnap", "Fujitsu", "iX1600", "Escanner"),
        ("Pizarra interactiva 75", "Promethean", "ActivPanel 9", "Aula"),
        ("Radio portátil VX", "Motorola", "VX-261", "Radio"),
        ("Modem LTE industrial", "Teltonika", "RUT241", "red"),
        ("KVM switch 8 puertos", "Aten", "CS1308", "Infraestructura"),
        ("Sensor ambiental", "APC", "AP9335T", "Infraestructura"),
        ("Cargador industrial 90W", "Dell", "LA90PM170", "Accesorio")
    ];

    public static async Task SeedAsync(ApplicationDbContext db)
    {
        if (await db.Activos.IgnoreQueryFilters()
                .AnyAsync(a => a.CodigoInterno != null && a.CodigoInterno.StartsWith(CodigoPrefix)))
        {
            return;
        }

        var empresa = await db.Empresas.IgnoreQueryFilters()
            .OrderBy(e => e.Id)
            .FirstOrDefaultAsync(e => e.Nombre.Contains("Sistemas"))
            ?? await db.Empresas.IgnoreQueryFilters().OrderBy(e => e.Id).FirstOrDefaultAsync();

        if (empresa is null)
        {
            return;
        }

        var idEmpresa = empresa.Id;

        var sedes = await db.Sedes.IgnoreQueryFilters()
            .Where(s => s.IdEmpresa == idEmpresa && s.Habilitado)
            .OrderBy(s => s.Id)
            .ToListAsync();
        var sedeIds = sedes.Select(s => s.Id).ToList();
        if (sedeIds.Count == 0)
        {
            return;
        }

        var areas = await db.Areas.IgnoreQueryFilters()
            .Where(a => sedeIds.Contains(a.IdSede) && a.Habilitado)
            .OrderBy(a => a.Id)
            .ToListAsync();
        var ubicaciones = await db.Ubicaciones.IgnoreQueryFilters()
            .Where(u => sedeIds.Contains(u.IdSede) && u.Habilitado)
            .OrderBy(u => u.Id)
            .ToListAsync();
        var usuarios = await db.Usuarios.IgnoreQueryFilters()
            .Where(u => u.Habilitado)
            .OrderBy(u => u.Id)
            .ToListAsync();

        if (areas.Count == 0 || ubicaciones.Count == 0 || usuarios.Count == 0)
        {
            return;
        }

        await using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            await AgregarCatalogosExtraAsync(db, idEmpresa);

            var estados = await db.Estados.IgnoreQueryFilters()
                .Where(e => e.IdEmpresa == idEmpresa)
                .ToListAsync();
            var tipos = await db.TiposAsignacion.IgnoreQueryFilters()
                .Where(t => t.IdEmpresa == idEmpresa)
                .ToListAsync();
            var tiposMant = await db.TiposMantenimiento.IgnoreQueryFilters().ToListAsync();
            var motivos = await db.MotivosBaja.IgnoreQueryFilters().ToListAsync();
            var categorias = await db.CategoriasActivo.IgnoreQueryFilters()
                .Where(c => c.IdEmpresa == idEmpresa && c.Habilitado)
                .OrderBy(c => c.Id)
                .ToListAsync();

            if (categorias.Count == 0)
            {
                await tx.RollbackAsync();
                return;
            }

            var idEstadoDisponible = IdEstado(estados, EstadoActivoNombres.Disponible);
            var idEstadoAsignado = IdEstado(estados, EstadoActivoNombres.Asignado);
            var idEstadoMant = IdEstado(estados, EstadoActivoNombres.EnMantenimiento);
            var idEstadoBaja = IdEstado(estados, EstadoActivoNombres.DadoDeBaja);
            var idTipoAsignacion = IdTipo(tipos, TipoAsignacionNombres.Asignacion);
            var idTipoTraslado = IdTipo(tipos, TipoAsignacionNombres.Traslado);
            var idTipoMant = IdTipo(tipos, TipoAsignacionNombres.Mantenimiento);
            var idTipoBaja = IdTipo(tipos, TipoAsignacionNombres.Baja);
            var idTipoMantPreventivo = tiposMant
                .First(t => TipoAsignacionNombres.EsNombre(t.Nombre, "Preventivo")).Id;
            var idMotivoBaja = motivos.First().Id;

            var proveedores = new List<Proveedor>();
            foreach (var p in ProveedoresInventados)
            {
                if (await db.Proveedores.IgnoreQueryFilters()
                        .AnyAsync(x => x.IdEmpresa == idEmpresa && (x.Nit == p.Nit || x.Nombre == p.Nombre)))
                {
                    continue;
                }

                proveedores.Add(new Proveedor
                {
                    IdEmpresa = idEmpresa,
                    Nombre = p.Nombre,
                    Nit = p.Nit,
                    NombreContacto = p.Contacto,
                    Telefono = "+502 2200 " + Random.Shared.Next(1000, 9999),
                    Correo = p.Correo,
                    Habilitado = true
                });
            }

            if (proveedores.Count > 0)
            {
                db.Proveedores.AddRange(proveedores);
                await db.SaveChangesAsync();
            }

            var proveedoresEmpresa = await db.Proveedores.IgnoreQueryFilters()
                .Where(p => p.IdEmpresa == idEmpresa && p.Habilitado)
                .OrderBy(p => p.Id)
                .ToListAsync();
            if (proveedoresEmpresa.Count == 0)
            {
                await tx.RollbackAsync();
                return;
            }

            var responsables = new List<Responsable>();
            for (var i = 0; i < ResponsablesInventados.Length; i++)
            {
                var r = ResponsablesInventados[i];
                var area = areas[i % areas.Count];
                var dpi = $"3{(i + 1):D12}";
                var correo = $"r{i + 1:D2}.{Slug(r.NombreCompleto)}@empresa.gt";
                if (await db.Responsables.IgnoreQueryFilters()
                        .AnyAsync(x => x.Dpi == dpi || (x.IdArea == area.Id && x.NombreCompleto == r.NombreCompleto)))
                {
                    continue;
                }

                responsables.Add(new Responsable
                {
                    IdArea = area.Id,
                    NombreCompleto = r.NombreCompleto,
                    Cargo = r.Cargo,
                    Correo = correo,
                    Telefono = $"+502 5{i + 1:D3}{1000 + i:D4}",
                    Dpi = dpi,
                    Habilitado = true
                });
            }

            if (responsables.Count > 0)
            {
                db.Responsables.AddRange(responsables);
                await db.SaveChangesAsync();
            }

            var responsablesEmpresa = await db.Responsables.IgnoreQueryFilters()
                .Where(r => areas.Select(a => a.Id).Contains(r.IdArea) && r.Habilitado)
                .OrderBy(r => r.Id)
                .ToListAsync();
            if (responsablesEmpresa.Count == 0)
            {
                await tx.RollbackAsync();
                return;
            }

            var activos = new List<Activo>(ActivosCount);
            for (var i = 0; i < ActivosCount; i++)
            {
                var plantilla = ActivosPlantilla[i % ActivosPlantilla.Length];
                var n = i + 1;
                var compra = new DateTime(2023, 3, 1, 0, 0, 0, DateTimeKind.Utc).AddDays(i * 5);
                var categoria = ElegirCategoria(categorias, plantilla.CategoriaHint, i);
                var proveedor = proveedoresEmpresa[i % proveedoresEmpresa.Count];
                var ubicacion = ubicaciones[i % ubicaciones.Count];

                activos.Add(new Activo
                {
                    IdCategoriaActivo = categoria.Id,
                    IdProveedor = proveedor.Id,
                    IdUbicacion = ubicacion.Id,
                    IdEstado = idEstadoDisponible,
                    Nombre = $"{plantilla.Nombre} ({n:D2})",
                    Descripcion = $"{plantilla.Marca} {plantilla.Modelo} para operación en Guatemala",
                    Marca = plantilla.Marca,
                    Modelo = plantilla.Modelo,
                    NumeroSerie = $"SN{compra:yy}{n:D6}",
                    CodigoInterno = $"{CodigoPrefix}{n:D4}",
                    FechaCompra = compra,
                    CostoAdquisicion = 850m + (i * 95m),
                    Moneda = "GTQ",
                    NumeroFactura = $"A-{compra:yyyy}-{n:D4}",
                    FechaVencimientoGarantia = compra.AddYears(2),
                    Observaciones = null,
                    TokenPublico = Guid.NewGuid().ToString("N")[..24],
                    EspecificacionesHardware = $"{plantilla.Marca} {plantilla.Modelo}",
                    Habilitado = true
                });
            }

            db.Activos.AddRange(activos);
            await db.SaveChangesAsync();

            var idUsuario = usuarios[0].Id;
            var asignaciones = new List<Asignacion>(ActivosCount);
            var detallesTraslado = new List<DetalleTraslado>();
            var detallesMant = new List<DetalleMantenimiento>();
            var detallesBaja = new List<DetalleBaja>();
            var historiales = new List<HistorialActivo>();

            for (var i = 0; i < ActivosCount; i++)
            {
                var activo = activos[i];
                var responsable = responsablesEmpresa[i % responsablesEmpresa.Count];
                var fecha = DateTime.UtcNow.AddDays(-(ActivosCount - i));
                var modo = i % 5;

                switch (modo)
                {
                    case 0:
                        activo.IdEstado = idEstadoAsignado;
                        asignaciones.Add(NuevaAsignacion(
                            activo.Id, idUsuario, responsable.Id, idEstadoAsignado, idTipoAsignacion,
                            fecha, true, null, $"Entrega de {activo.Nombre}"));
                        break;
                    case 1:
                        activo.IdEstado = idEstadoDisponible;
                        asignaciones.Add(NuevaAsignacion(
                            activo.Id, idUsuario, responsable.Id, idEstadoAsignado, idTipoAsignacion,
                            fecha, false, fecha.AddDays(12), $"Devolución de {activo.Nombre}"));
                        break;
                    case 2:
                        activo.IdEstado = idEstadoMant;
                        asignaciones.Add(NuevaAsignacion(
                            activo.Id, idUsuario, responsable.Id, idEstadoMant, idTipoMant,
                            fecha, true, null, $"Mantenimiento de {activo.Nombre}"));
                        break;
                    case 3:
                        activo.IdEstado = idEstadoBaja;
                        asignaciones.Add(NuevaAsignacion(
                            activo.Id, idUsuario, responsable.Id, idEstadoBaja, idTipoBaja,
                            fecha, true, null, $"Baja de {activo.Nombre}"));
                        break;
                    default:
                    {
                        var origen = ubicaciones[i % ubicaciones.Count];
                        var destino = ubicaciones[(i + 1) % ubicaciones.Count];
                        activo.IdUbicacion = destino.Id;
                        activo.IdEstado = idEstadoDisponible;
                        asignaciones.Add(NuevaAsignacion(
                            activo.Id, idUsuario, responsable.Id, idEstadoDisponible, idTipoTraslado,
                            fecha, false, fecha, $"Traslado {origen.Nombre} → {destino.Nombre}"));
                        break;
                    }
                }
            }

            db.Asignaciones.AddRange(asignaciones);
            await db.SaveChangesAsync();

            for (var i = 0; i < ActivosCount; i++)
            {
                var a = asignaciones[i];
                var modo = i % 5;
                historiales.Add(new HistorialActivo
                {
                    IdAsignacion = a.Id,
                    FechaHora = a.FechaAsignacion,
                    TipoOperacion = modo switch
                    {
                        0 => "Creacion",
                        1 => "Devolucion",
                        2 => "Mantenimiento",
                        3 => "Baja",
                        _ => "Traslado"
                    },
                    Descripcion = a.Observaciones,
                    InformacionNueva = a.Observaciones
                });

                if (modo == 2)
                {
                    detallesMant.Add(new DetalleMantenimiento
                    {
                        IdAsignacion = a.Id,
                        IdTipoMantenimiento = idTipoMantPreventivo,
                        DescripcionProblema = "Revisión preventiva programada",
                        TrabajoRealizado = "Diagnóstico, limpieza y pruebas de encendido",
                        Costo = 175m + i
                    });
                }
                else if (modo == 3)
                {
                    detallesBaja.Add(new DetalleBaja
                    {
                        IdAsignacion = a.Id,
                        IdMotivoBaja = idMotivoBaja,
                        IdAutorizadoPor = idUsuario
                    });
                }
                else if (modo == 4)
                {
                    var origen = ubicaciones[i % ubicaciones.Count];
                    var destino = ubicaciones[(i + 1) % ubicaciones.Count];
                    detallesTraslado.Add(new DetalleTraslado
                    {
                        IdAsignacion = a.Id,
                        IdUbicacionOrigen = origen.Id,
                        IdUbicacionDestino = destino.Id,
                        Motivo = "Reubicación operativa"
                    });
                }
            }

            db.DetallesMantenimiento.AddRange(detallesMant);
            db.DetallesBaja.AddRange(detallesBaja);
            db.DetallesTraslado.AddRange(detallesTraslado);
            db.HistorialActivos.AddRange(historiales);
            await db.SaveChangesAsync();

            var jornadas = new List<HistoricoInventario>();
            var maxJornadas = Math.Min(5, sedes.Count);
            for (var i = 0; i < maxJornadas; i++)
            {
                var cerrada = i % 2 == 0;
                var inicio = DateTime.UtcNow.AddDays(-(20 - i * 3));
                jornadas.Add(new HistoricoInventario
                {
                    IdSede = sedes[i].Id,
                    Responsable = responsablesEmpresa[i % responsablesEmpresa.Count].NombreCompleto,
                    FechaInicio = inicio,
                    Cerrado = cerrada,
                    FechaCierre = cerrada ? inicio.AddHours(5) : null,
                    Observaciones = cerrada ? "Conteo cerrado" : "Conteo en curso"
                });
            }

            if (jornadas.Count > 0)
            {
                db.HistoricosInventario.AddRange(jornadas);
                await db.SaveChangesAsync();

                var detallesJornada = new List<DetalleActivo>();
                for (var i = 0; i < jornadas.Count; i++)
                {
                    var activosDeSede = activos
                        .Where(a =>
                        {
                            var ubi = ubicaciones.FirstOrDefault(u => u.Id == a.IdUbicacion);
                            return ubi != null && ubi.IdSede == jornadas[i].IdSede;
                        })
                        .Take(5)
                        .ToList();

                    foreach (var activo in activosDeSede)
                    {
                        detallesJornada.Add(new DetalleActivo
                        {
                            IdHistoricoInventario = jornadas[i].Id,
                            IdActivo = activo.Id,
                            Encontrado = true,
                            BuenEstado = activo.Id % 3 != 0,
                            FechaVerificacion = jornadas[i].FechaInicio.AddHours(1),
                            Observaciones = "Verificado en jornada"
                        });
                    }
                }

                if (detallesJornada.Count > 0)
                {
                    db.DetallesActivos.AddRange(detallesJornada);
                    await db.SaveChangesAsync();
                }
            }

            var bitacoras = new List<Bitacora>();
            var entidades = new[] { "Activo", "Asignacion", "Responsable", "Proveedor", "CategoriaActivo" };
            for (var i = 0; i < 40; i++)
            {
                bitacoras.Add(new Bitacora
                {
                    IdUsuario = usuarios[i % usuarios.Count].Id,
                    IdEmpresa = idEmpresa,
                    FechaHora = DateTime.UtcNow.AddHours(-(40 - i)),
                    TipoOperacion = (TipoOperacionBitacora)(i % 3),
                    EntidadAfectada = entidades[i % entidades.Length],
                    Descripcion = $"{(TipoOperacionBitacora)(i % 3)} de {entidades[i % entidades.Length]}",
                    InformacionNueva = $"{{\"indice\":{i + 1}}}"
                });
            }

            db.Bitacoras.AddRange(bitacoras);
            await db.SaveChangesAsync();

            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private static async Task AgregarCatalogosExtraAsync(ApplicationDbContext db, int idEmpresa)
    {
        var cats = await db.CategoriasActivo.IgnoreQueryFilters()
            .Where(c => c.IdEmpresa == idEmpresa)
            .Select(c => c.Nombre)
            .ToListAsync();
        foreach (var (nombre, descripcion) in CategoriasExtra)
        {
            if (cats.Any(n => string.Equals(n, nombre, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            db.CategoriasActivo.Add(new CategoriaActivo
            {
                IdEmpresa = idEmpresa,
                Nombre = nombre,
                Descripcion = descripcion,
                Habilitado = true
            });
        }

        var estados = await db.Estados.IgnoreQueryFilters()
            .Where(e => e.IdEmpresa == idEmpresa)
            .Select(e => e.Nombre)
            .ToListAsync();
        foreach (var (nombre, descripcion) in EstadosExtra)
        {
            if (estados.Any(n => TipoAsignacionNombres.EsNombre(n, nombre)))
            {
                continue;
            }

            db.Estados.Add(new Estado
            {
                IdEmpresa = idEmpresa,
                Nombre = nombre,
                Descripcion = descripcion
            });
        }

        var tipos = await db.TiposAsignacion.IgnoreQueryFilters()
            .Where(t => t.IdEmpresa == idEmpresa)
            .Select(t => t.Nombre)
            .ToListAsync();
        foreach (var (nombre, descripcion) in TiposAsignacionExtra)
        {
            if (tipos.Any(n => TipoAsignacionNombres.EsNombre(n, nombre)))
            {
                continue;
            }

            db.TiposAsignacion.Add(new TipoAsignacion
            {
                IdEmpresa = idEmpresa,
                Nombre = nombre,
                Descripcion = descripcion
            });
        }

        var tiposMant = await db.TiposMantenimiento.IgnoreQueryFilters()
            .Select(t => t.Nombre)
            .ToListAsync();
        foreach (var (nombre, descripcion) in TiposMantenimientoExtra)
        {
            if (tiposMant.Any(n => TipoAsignacionNombres.EsNombre(n, nombre)))
            {
                continue;
            }

            db.TiposMantenimiento.Add(new TipoMantenimiento
            {
                Nombre = nombre,
                Descripcion = descripcion
            });
        }

        var motivos = await db.MotivosBaja.IgnoreQueryFilters()
            .Select(m => m.Nombre)
            .ToListAsync();
        foreach (var (nombre, descripcion) in MotivosBajaExtra)
        {
            if (motivos.Any(n => TipoAsignacionNombres.EsNombre(n, nombre)))
            {
                continue;
            }

            db.MotivosBaja.Add(new MotivoBaja
            {
                Nombre = nombre,
                Descripcion = descripcion
            });
        }

        await db.SaveChangesAsync();
    }

    private static CategoriaActivo ElegirCategoria(
        IReadOnlyList<CategoriaActivo> categorias,
        string hint,
        int index)
    {
        var match = categorias.FirstOrDefault(c =>
            c.Nombre.Contains(hint, StringComparison.OrdinalIgnoreCase));
        return match ?? categorias[index % categorias.Count];
    }

    private static Asignacion NuevaAsignacion(
        int idActivo,
        int idUsuario,
        int idResponsable,
        int idEstado,
        int idTipo,
        DateTime fecha,
        bool activa,
        DateTime? fechaDevolucion,
        string? observaciones) =>
        new()
        {
            IdActivo = idActivo,
            IdUsuario = idUsuario,
            IdResponsable = idResponsable,
            IdEstado = idEstado,
            IdTipoAsignacion = idTipo,
            FechaAsignacion = fecha,
            Activa = activa,
            FechaDevolucion = fechaDevolucion,
            Observaciones = observaciones
        };

    private static int IdEstado(IReadOnlyList<Estado> estados, string nombre) =>
        estados.First(e => TipoAsignacionNombres.EsNombre(e.Nombre, nombre)).Id;

    private static int IdTipo(IReadOnlyList<TipoAsignacion> tipos, string nombre) =>
        tipos.First(t => TipoAsignacionNombres.EsNombre(t.Nombre, nombre)).Id;

    private static string Slug(string nombreCompleto)
    {
        var parts = nombreCompleto.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var first = parts.Length > 0 ? parts[0] : "user";
        var last = parts.Length > 1 ? parts[^1] : "gt";
        return $"{first}.{last}".ToLowerInvariant()
            .Replace("á", "a").Replace("é", "e").Replace("í", "i")
            .Replace("ó", "o").Replace("ú", "u").Replace("ñ", "n");
    }
}
