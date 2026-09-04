using SLCDM.Agent;

var builder = Host.CreateApplicationBuilder(args);

var backendUrl = builder.Configuration["Backend:BaseUrl"]
    ?? throw new InvalidOperationException("Falta Backend:BaseUrl en la configuracion.");
var installKey = builder.Configuration["Backend:InstallKey"]
    ?? throw new InvalidOperationException("Falta Backend:InstallKey en la configuracion.");

builder.Services.AddHttpClient<Worker>(client =>
{
    client.BaseAddress = new Uri(backendUrl);
});

builder.Services.AddHostedService<Worker>();

builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "SLCDM Agente de Rastreo";
});

var host = builder.Build();
host.Run();