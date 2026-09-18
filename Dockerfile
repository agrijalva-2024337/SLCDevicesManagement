FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src


COPY src/SLCDM.Domain/SLCDM.Domain.csproj src/SLCDM.Domain/
COPY src/SLCDM.Application/SLCDM.Application.csproj src/SLCDM.Application/
COPY src/SLCDM.Persistence/SLCDM.Persistence.csproj src/SLCDM.Persistence/
COPY src/SLCDM.Api/SLCDM.Api.csproj src/SLCDM.Api/
RUN dotnet restore src/SLCDM.Api/SLCDM.Api.csproj

COPY src/ src/
RUN dotnet publish src/SLCDM.Api/SLCDM.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# curl no viene en la imagen aspnet; hace falta para HEALTHCHECK.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1
ENTRYPOINT ["/bin/sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} dotnet SLCDM.Api.dll"]
