# Instalacion anterior (servicio LocalSystem). Ya no se usa:
# el GPS de Windows no funciona bajo LocalSystem.
# Usar instalar-tarea.ps1 para registrar el agente en la sesion del usuario.
param(
    [Parameter(Mandatory=$true)][string]$BackendUrl,
    [Parameter(Mandatory=$true)][string]$InstallKey
)

& "$PSScriptRoot\instalar-tarea.ps1" -BackendUrl $BackendUrl -InstallKey $InstallKey
