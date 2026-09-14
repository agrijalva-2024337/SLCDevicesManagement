using Microsoft.AspNetCore.Hosting;

namespace SLCDM.Api.Middleware;

/// <summary>
/// Headers de seguridad HTTP para respuestas de la API fuera de Development.
/// Complementa HSTS frente a SSL stripping y endurece el transporte del login.
/// </summary>
public sealed class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _environment;

    public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment environment)
    {
        _next = next;
        _environment = environment;
    }

    public Task InvokeAsync(HttpContext context)
    {
        if (!_environment.IsDevelopment())
        {
            var headers = context.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
        }

        return _next(context);
    }
}
