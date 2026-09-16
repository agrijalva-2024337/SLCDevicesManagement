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
COPY --from=build /app .


ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["/bin/sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} dotnet SLCDM.Api.dll"]