param(
    [Parameter(Mandatory=$true)][string]$BackendUrl,
    [Parameter(Mandatory=$true)][string]$InstallKey
)

$installPath = "$env:LOCALAPPDATA\SLCDM"
New-Item -ItemType Directory -Force -Path $installPath | Out-Null
Copy-Item -Path ".\publish\*" -Destination $installPath -Recurse -Force

$config = @{
    "Backend" = @{
        "BaseUrl" = $BackendUrl
        "InstallKey" = $InstallKey
    }
} | ConvertTo-Json
Set-Content -Path "$installPath\appsettings.Production.json" -Value $config

$action = New-ScheduledTaskAction -Execute "$installPath\SLCDMAgente.exe"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName "SLCDM Agente de Rastreo" `
  -Action $action -Trigger $trigger -Settings $settings `
  -RunLevel Limited `
  -Description "Reporta la ubicacion real del equipo al backend de inventario." `
  -Force

Start-ScheduledTask -TaskName "SLCDM Agente de Rastreo"
Get-ScheduledTask -TaskName "SLCDM Agente de Rastreo" | Select-Object TaskName, State
Write-Host "Revisa que 'State' diga Running. Si no arranca, entra a Configuracion > Privacidad y seguridad > Ubicacion y confirma que este activado 'Permitir que las apps de escritorio accedan a tu ubicacion'."
