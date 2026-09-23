using System.Diagnostics;

namespace SLCDM.Agent;

/// <summary>
/// Le avisa una sola vez al usuario que active el servicio de Ubicación de
/// Windows, si UbicacionEquipo.Leer() no pudo resolver nada. No es un
/// permiso "de sesión" -- Windows no tiene diálogo de consentimiento para
/// la API legacy System.Device.Location que ya usa el proyecto, así que
/// esto es un aviso propio de la app, mostrado una sola vez por
/// instalación (se guarda una marca en disco para no volver a molestar).
/// De ahí en adelante, el ping de cada 15 minutos (ya en Worker.cs) sigue
/// intentando leer la ubicación en silencio, sin mostrar nada más.
/// </summary>
public static class PermisoUbicacionPrompt
{
    private static string RutaMarca => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "SLCDM", "ubicacion-prompt-mostrado.flag");

    public static bool YaSeMostro() => File.Exists(RutaMarca);

    public static void MostrarSiHaceFalta()
    {
        if (YaSeMostro())
        {
            return;
        }

        // WinForms exige un hilo STA propio. No bloquea el resto del Worker:
        // el ciclo de ping sigue su curso normal aunque la ventana quede abierta.
        var hilo = new Thread(() =>
        {
            using var form = new AvisoUbicacionForm();
            System.Windows.Forms.Application.Run(form);
        });
        hilo.SetApartmentState(ApartmentState.STA);
        hilo.Start();
        hilo.Join(TimeSpan.FromMinutes(5)); // limite razonable si lo dejan abierto sin tocar

        MarcarComoMostrado();
    }

    private static void MarcarComoMostrado()
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(RutaMarca)!);
            File.WriteAllText(RutaMarca, DateTime.UtcNow.ToString("O"));
        }
        catch
        {
            // Si no se puede escribir la marca, en el peor caso se vuelve a
            // mostrar el aviso la próxima vez que falte ubicación -- molesto
            // pero no rompe el rastreo, que sigue funcionando igual.
        }
    }
}

internal sealed class AvisoUbicacionForm : System.Windows.Forms.Form
{
    public AvisoUbicacionForm()
    {
        Text = "SLC Devices Management — Ubicación";
        Width = 460;
        Height = 220;
        FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
        StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
        MaximizeBox = false;
        MinimizeBox = false;
        TopMost = true;

        var etiqueta = new System.Windows.Forms.Label
        {
            Text = "Para que este equipo reporte su ubicación con mejor precisión, activá el " +
                   "servicio de Ubicación de Windows.\n\n" +
                   "Esto es para el rastreo del equipo como activo de la empresa, no de la " +
                   "persona. Solo hace falta activarlo una vez — este aviso no vuelve a salir.",
            Left = 20,
            Top = 20,
            Width = 410,
            Height = 100,
        };

        var botonConfig = new System.Windows.Forms.Button
        {
            Text = "Abrir configuración de Windows",
            Left = 20,
            Top = 130,
            Width = 220,
            Height = 32,
        };
        botonConfig.Click += (_, _) =>
        {
            try
            {
                Process.Start(new ProcessStartInfo("ms-settings:privacy-location") { UseShellExecute = true });
            }
            catch
            {
                // Si el deep link falla (versión vieja de Windows), no hay más que hacer desde acá.
            }
        };

        var botonCerrar = new System.Windows.Forms.Button
        {
            Text = "Entendido",
            Left = 250,
            Top = 130,
            Width = 180,
            Height = 32,
        };
        botonCerrar.Click += (_, _) => Close();

        Controls.Add(etiqueta);
        Controls.Add(botonConfig);
        Controls.Add(botonCerrar);
    }
}
