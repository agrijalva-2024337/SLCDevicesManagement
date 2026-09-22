using System.Diagnostics;

namespace SLCDM.Agent;

/// <summary>
/// Autoinstalación del agente: copia a %LOCALAPPDATA%\SLCDM y registra
/// la tarea programada (mismo comportamiento que instalar-tarea.ps1).
/// </summary>
public static class Instalador
{
    private const string NombreTarea = "SLCDM Agente de Rastreo";
    private const string NombreExe = "SLCDMAgente.exe";
    private const string NombreConfig = "appsettings.Production.json";

    public static int Ejecutar()
    {
        try
        {
            var origenDir = Path.GetDirectoryName(ObtenerRutaExeActual())
                ?? Directory.GetCurrentDirectory();
            var origenExe = Path.Combine(origenDir, NombreExe);
            var origenConfig = Path.Combine(origenDir, NombreConfig);

            // Si el proceso se llama distinto (debug), usar el exe en ejecución.
            var exeActual = ObtenerRutaExeActual();
            if (!File.Exists(origenExe) && File.Exists(exeActual))
            {
                origenExe = exeActual;
            }

            if (!File.Exists(origenConfig))
            {
                Console.WriteLine(
                    "Falta el archivo de configuración — descargá el instalador completo desde el link que te compartieron, no solo el .exe suelto.");
                return 1;
            }

            var installPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "SLCDM");
            Directory.CreateDirectory(installPath);

            var destinoExe = Path.Combine(installPath, NombreExe);
            var destinoConfig = Path.Combine(installPath, NombreConfig);

            // Si ya hay un agente corriendo, detenerlo para poder reemplazar el .exe.
            _ = EjecutarSchtasks($"/end /tn \"{NombreTarea}\"", out _, out _);
            Thread.Sleep(800);

            File.Copy(origenExe, destinoExe, overwrite: true);
            File.Copy(origenConfig, destinoConfig, overwrite: true);

            // schtasks /tr necesita la ruta entre comillas si tiene espacios.
            var tr = $"\"{destinoExe}\"";
            var createArgs =
                $"/create /tn \"{NombreTarea}\" /tr {tr} /sc onlogon /rl limited /f";

            var createCode = EjecutarSchtasks(createArgs, out var createOut, out var createErr);
            if (createCode != 0)
            {
                Console.WriteLine("No se pudo registrar la tarea programada del agente.");
                EscribirSalidaSchtasks(createOut, createErr);
                return createCode;
            }

            var runCode = EjecutarSchtasks($"/run /tn \"{NombreTarea}\"", out var runOut, out var runErr);
            if (runCode != 0)
            {
                Console.WriteLine(
                    "La tarea se registró, pero no se pudo arrancar ahora. Se intentará al próximo inicio de sesión.");
                EscribirSalidaSchtasks(runOut, runErr);
                return runCode;
            }

            Console.WriteLine("Agente instalado y activado correctamente. Podés cerrar esta ventana.");
            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine("No se pudo instalar el agente.");
            Console.WriteLine(ex.Message);
            return 1;
        }
    }

    private static string ObtenerRutaExeActual()
    {
        if (!string.IsNullOrWhiteSpace(Environment.ProcessPath))
        {
            return Environment.ProcessPath;
        }

        return Process.GetCurrentProcess().MainModule?.FileName
            ?? Path.Combine(AppContext.BaseDirectory, NombreExe);
    }

    private static int EjecutarSchtasks(string argumentos, out string stdout, out string stderr)
    {
        var psi = new ProcessStartInfo("schtasks.exe", argumentos)
        {
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var proceso = Process.Start(psi)
            ?? throw new InvalidOperationException("No se pudo iniciar schtasks.exe.");

        stdout = proceso.StandardOutput.ReadToEnd();
        stderr = proceso.StandardError.ReadToEnd();
        proceso.WaitForExit();
        return proceso.ExitCode;
    }

    private static void EscribirSalidaSchtasks(string stdout, string stderr)
    {
        if (!string.IsNullOrWhiteSpace(stdout))
        {
            Console.WriteLine(stdout.TrimEnd());
        }

        if (!string.IsNullOrWhiteSpace(stderr))
        {
            Console.WriteLine(stderr.TrimEnd());
        }
    }
}
