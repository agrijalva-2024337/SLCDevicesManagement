using SLCDM.Api.Authentication;
using SLCDM.Api.Extensions;
using SLCDM.Api.Middleware;
using SLCDM.Api.OpenApi;
using SLCDM.Application;
using SLCDM.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddDeviceTokenAuthentication();
builder.Services.AddRateLimitingPolicies();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddSwaggerWithBearer();
builder.Services.Configure<SLCDM.Application.Common.Options.DeviceTrackingOptions>(
    builder.Configuration.GetSection(SLCDM.Application.Common.Options.DeviceTrackingOptions.SectionName));
builder.Services.Configure<SLCDM.Application.Common.Options.SmtpOptions>(
    builder.Configuration.GetSection(SLCDM.Application.Common.Options.SmtpOptions.SectionName));
builder.Services.AddSingleton<SLCDM.Application.Common.Interfaces.IEmailSender, SLCDM.Api.Email.SmtpEmailSender>();
builder.Services.Configure<SLCDM.Application.Common.Options.DocumentIntegrityOptions>(
    builder.Configuration.GetSection(SLCDM.Application.Common.Options.DocumentIntegrityOptions.SectionName));
builder.Services.Configure<SLCDM.Application.Common.Options.BrandingOptions>(
    builder.Configuration.GetSection(SLCDM.Application.Common.Options.BrandingOptions.SectionName));
builder.Services.PostConfigure<SLCDM.Application.Common.Options.BrandingOptions>(options =>
{
    if (string.IsNullOrWhiteSpace(options.LetterheadPath))
    {
        options.LetterheadPath = Path.Combine(
            builder.Environment.ContentRootPath, "wwwroot", "branding", "banner.png");
    }
});


var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? ["http://localhost:5173", "https://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerWithBearer();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("ReactClient");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
