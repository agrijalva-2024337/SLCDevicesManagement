using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace SLCDM.Agent;

/// <summary>
/// Obtiene la ubicación usando el mismo motor que el navegador (WebView2 /
/// Edge), en vez de la API vieja System.Device.Location. La primera vez
/// muestra una ventana chica para que la persona acepte el permiso del
/// navegador; ese permiso queda guardado en el perfil de WebView2 (carpeta
/// fija en disco), así que las siguientes veces se pide en silencio, sin
/// mostrar nada. Si WebView2 no está disponible en la máquina, devuelve
/// null y el llamador cae de respaldo a UbicacionEquipo.Leer().
/// </summary>
public static class UbicacionNavegador
{
    private const string HtmlGeolocalizacion = """
        <!DOCTYPE html><html><body>
        <script>
        navigator.geolocation.getCurrentPosition(
          (p) => window.chrome.webview.postMessage(JSON.stringify({
            ok: true, lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy })),
          (e) => window.chrome.webview.postMessage(JSON.stringify({ ok: false, error: e.message })),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        </script></body></html>
        """;

    private static string CarpetaPerfil => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "SLCDM", "WebView2Profile");

    private static string CarpetaHtml => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "SLCDM", "WebView2Html");

    private static string RutaMarcaPermisoPedido => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "SLCDM", "ubicacion-webview2-solicitada.flag");

    public static async Task<(decimal Lat, decimal Lng, double AccuracyMeters)?> LeerAsync()
    {
        var tcs = new TaskCompletionSource<(decimal, decimal, double)?>();
        var primeraVez = !File.Exists(RutaMarcaPermisoPedido);

        var hilo = new Thread(() =>
        {
            try
            {
                using var form = new System.Windows.Forms.Form
                {
                    Width = 420,
                    Height = 260,
                    Text = "SLC Devices Management — Ubicación",
                    StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen,
                    ShowInTaskbar = primeraVez,
                    Opacity = primeraVez ? 1 : 0,
                };
                if (!primeraVez)
                {
                    form.WindowState = System.Windows.Forms.FormWindowState.Minimized;
                }

                using var webView = new WebView2 { Dock = System.Windows.Forms.DockStyle.Fill };
                form.Controls.Add(webView);
                form.Show();

                _ = InicializarYPedirAsync(webView, tcs);

                System.Windows.Forms.Application.Run(form);
            }
            catch
            {
                tcs.TrySetResult(null);
            }
        });
        hilo.SetApartmentState(ApartmentState.STA);
        hilo.Start();

        var resultado = await Task.WhenAny(tcs.Task, Task.Delay(TimeSpan.FromSeconds(25)))
            == tcs.Task ? await tcs.Task : null;

        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(RutaMarcaPermisoPedido)!);
            File.WriteAllText(RutaMarcaPermisoPedido, DateTime.UtcNow.ToString("O"));
        }
        catch
        {
            // Si no se puede escribir, en el peor caso se vuelve a mostrar la ventana.
        }

        return resultado;
    }

    private static async Task InicializarYPedirAsync(
        WebView2 webView, TaskCompletionSource<(decimal, decimal, double)?> tcs)
    {
        try
        {
            Directory.CreateDirectory(CarpetaPerfil);
            var entorno = await CoreWebView2Environment.CreateAsync(userDataFolder: CarpetaPerfil);
            await webView.EnsureCoreWebView2Async(entorno);

            // IMPORTANTE: NavigateToString() carga el HTML en un origen "opaco"
            // (parecido a about:blank), y Chromium NO concede permisos de
            // geolocalizacion en ese tipo de origen -- por eso fallaba siempre.
            // Hay que escribir el HTML a un archivo real y navegar a traves del
            // host virtual, para que el permiso se pueda conceder y persistir.
            Directory.CreateDirectory(CarpetaHtml);
            var rutaHtml = Path.Combine(CarpetaHtml, "geo.html");
            if (!File.Exists(rutaHtml))
            {
                await File.WriteAllTextAsync(rutaHtml, HtmlGeolocalizacion);
            }

            webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "slcdm.local", CarpetaHtml, CoreWebView2HostResourceAccessKind.Allow);

            // Auto-conceder el permiso de ubicacion si el navegador ya lo tenia
            // guardado de una vez anterior (no vuelve a mostrar el popup).
            webView.CoreWebView2.PermissionRequested += (_, e) =>
            {
                if (e.PermissionKind == CoreWebView2PermissionKind.Geolocation)
                {
                    e.State = CoreWebView2PermissionState.Allow;
                }
            };

            webView.CoreWebView2.WebMessageReceived += (_, e) =>
            {
                try
                {
                    // WebMessageAsJson viene con comillas extra por ser un string JSON-encoded.
                    var texto = JsonSerializer.Deserialize<string>(e.WebMessageAsJson) ?? "{}";
                    var datos = JsonDocument.Parse(texto).RootElement;

                    if (datos.GetProperty("ok").GetBoolean())
                    {
                        var lat = (decimal)datos.GetProperty("lat").GetDouble();
                        var lng = (decimal)datos.GetProperty("lng").GetDouble();
                        var acc = datos.GetProperty("acc").GetDouble();
                        tcs.TrySetResult((lat, lng, acc));
                    }
                    else
                    {
                        Console.Error.WriteLine(
                            $"[UbicacionNavegador] navigator.geolocation devolvio error: {datos.GetProperty("error").GetString()}");
                        tcs.TrySetResult(null);
                    }
                }
                catch (Exception exMensaje)
                {
                    Console.Error.WriteLine($"[UbicacionNavegador] No se pudo parsear el mensaje del WebView2: {exMensaje}");
                    tcs.TrySetResult(null);
                }
                finally
                {
                    System.Windows.Forms.Application.Exit();
                }
            };

            // Navegar a traves del host virtual (origen real), no NavigateToString.
            webView.CoreWebView2.Navigate("https://slcdm.local/geo.html");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[UbicacionNavegador] Fallo al inicializar WebView2: {ex}");
            tcs.TrySetResult(null);
            System.Windows.Forms.Application.Exit();
        }
    }
}
