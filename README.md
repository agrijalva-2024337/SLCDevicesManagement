# SLCDevicesManagement

Sistema de control e inventario de activos con funcionamiento multiempresa, desarrollado para
**Sistemas Logísticos y Corporativos, S.A. (SLC)**. Producto: **DERCAS**.

Permite administrar el ciclo de vida completo de un activo (equipo de cómputo, mobiliario,
etc.) — alta, asignación a un responsable, traslado entre sedes, mantenimiento y baja — con
aislamiento de datos por empresa, roles diferenciados, actas en PDF con firma y QR, reportes
operativos y una consulta pública por código QR.

## Stack

| Capa | Tecnología |
| --- | --- |
| Backend | .NET 10, Clean Architecture (Domain / Application / Persistence / Api), Entity Framework Core, SQL Server |
| Frontend | React 19 + Vite, Tailwind CSS, React Router, Axios |
| Autenticación | JWT + Argon2id para hash de contraseñas |
| Documentos | QuestPDF (actas de entrega/baja/traslado con QR y firma) |
| Correo | SMTP (notificaciones de credenciales, actas) |
| Despliegue | Docker (backend) + Railway / hosting estático (frontend) |

## Estructura del repositorio

| Ruta | Qué es |
| --- | --- |
| `src/SLCDM.Domain` | Entidades y enums del dominio |
| `src/SLCDM.Application` | Casos de uso (Commands/Queries por feature), reglas de negocio, validaciones |
| `src/SLCDM.Persistence` | `DbContext`, configuraciones de EF Core, migraciones, seeders |
| `src/SLCDM.Api` | Controllers REST, autenticación, rate limiting, `Program.cs` |
| `frontend/` | Interfaz web (React + Vite) — ver [`frontend/README.md`](frontend/README.md) |
| `agent/` | Agente de rastreo instalable en Windows (huella de hardware, ubicación por red conocida) |
| `Scripts/` | Scripts SQL sueltos de apoyo (parches puntuales fuera de las migraciones de EF) |
| `docs/` | Documentación complementaria (p. ej. matriz de permisos por perfil) |
| `Dockerfile` | Imagen de producción del backend (publica también el agente Windows) |

## Backend

Requisitos: [.NET 10 SDK](https://dotnet.microsoft.com/download) y una instancia de SQL Server
accesible (local, contenedor Docker, o remota — ver más abajo).

```bash
# 1. Configuración: copiar la plantilla y completar los valores reales.
#    Este archivo NUNCA se commitea (está en .gitignore).
cp src/SLCDM.Api/appsettings.example src/SLCDM.Api/appsettings.json
# Editar appsettings.json: connection string, JwtSettings.SecretKey,
# DocumentIntegrity.Pepper, credenciales SMTP, etc.

# 2. Herramienta de EF Core (una sola vez por máquina)
dotnet tool install --global dotnet-ef

# 3. Aplicar migraciones (crea la base de datos si no existe)
dotnet ef database update --project src/SLCDM.Persistence --startup-project src/SLCDM.Api

# 4. Levantar la API
dotnet run --project src/SLCDM.Api
```

La API queda en `http://localhost:5139` (`https://localhost:7062` en el perfil HTTPS).

Claves más importantes de `appsettings.json` (ver `appsettings.example` para la lista completa):

| Clave | Para qué |
| --- | --- |
| `ConnectionStrings:DefaultConnection` | Cadena de conexión a SQL Server |
| `JwtSettings:SecretKey` | Firma de los tokens JWT (mínimo 32 caracteres aleatorios) |
| `Cors:Origins` | Orígenes permitidos (URL del frontend en desarrollo y producción) |
| `DocumentIntegrity:Pepper` | Pepper usado para el hash de integridad de los PDFs generados |
| `Smtp:*` | Envío de correo (credenciales de usuario, notificaciones) |
| `Frontend:PublicUrl` | URL pública del frontend, usada para generar los links de los QR |

## Frontend

Ver la guía completa en [`frontend/README.md`](frontend/README.md) (stack, sistema de diseño,
variables de entorno).

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

La app queda en [http://localhost:5173](http://localhost:5173). `/` es la landing pública,
`/login` inicia sesión contra la API (o el mock local si `VITE_USE_API_MOCK=true`), y `/app`
es el panel protegido.

## Despliegue

El `Dockerfile` en la raíz construye la imagen de producción del backend (multi-stage,
`.NET 10 SDK` → `aspnet` runtime) e incluye el ejecutable del agente de Windows, que debe
publicarse antes por separado:

```bash
dotnet publish agent/SLCDM.Agent.csproj -c Release -r win-x64 --self-contained true -o agent/publish
docker build -t slcdm-api .
```

El contenedor expone el puerto `8080` (o el que indique la variable `PORT`) y responde en
`/health` para el healthcheck. El frontend se puede desplegar como sitio estático en cualquier
proveedor (Vercel, Netlify, etc.), apuntando `VITE_API_URL` a la URL pública del backend.

## Documentación adicional

- [`docs/permisos-por-perfil.md`](docs/permisos-por-perfil.md) — matriz cruzada de qué puede
  hacer cada rol, backend vs. frontend.
