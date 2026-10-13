<#
.SYNOPSIS
  Configura DEVITRACKAPP para desplegar solo el admin dashboard desde GitHub.
  Se ejecuta UNA vez, como Administrador, desde una sesión de Remote Desktop.

.DESCRIPTION
  1. Crea <Root> y copia Update-AdminSite.ps1 a <Root>\bin.
  2. Hace el primer despliegue del release "latest" de GitHub. Si falla, se
     detiene aquí y el sitio sigue sirviendo la carpeta de siempre.
  3. Da lectura sobre <Root> a la identidad del app pool del sitio.
  4. Guarda la ruta física actual del sitio (para deshacer) y apunta el sitio
     a <Root>\current.
  5. Registra la tarea programada que repite el paso 2 cada pocos minutos.

.PARAMETER TaskCredential
  Cuenta con la que corre la tarea. Sin ella, corre como SYSTEM. Mejor una
  cuenta local dedicada, sin escritorio remoto ni admin: el script solo
  necesita escribir en <Root> e ir a GitHub por HTTPS.

.EXAMPLE
  .\Install-AdminSiteUpdater.ps1
  .\Install-AdminSiteUpdater.ps1 -TaskCredential (Get-Credential DEVITRACKAPP\svc-devitrak-deploy)
#>
[CmdletBinding()]
param(
  [string]$SiteName = "Admin",
  [string]$Root = "C:\inetpub\devitrak-admin",
  [string]$Repo = "grodriguezcontextglobal/testing-admin-dashboard",
  [int]$IntervalMinutes = 5,
  [string]$TaskName = "Devitrak Admin - Update from GitHub",
  [pscredential]$TaskCredential
)

$ErrorActionPreference = "Stop"

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Ejecuta este script en una consola de PowerShell abierta como Administrador."
}

Import-Module WebAdministration
$site = Get-Item "IIS:\Sites\$SiteName" -ErrorAction SilentlyContinue
if (-not $site) { throw "No existe el sitio '$SiteName' en IIS." }

# 1. Carpetas y script
$bin = Join-Path $Root "bin"
New-Item -ItemType Directory -Force -Path $Root, $bin | Out-Null
Copy-Item -Path (Join-Path $PSScriptRoot "Update-AdminSite.ps1") -Destination $bin -Force
$updater = Join-Path $bin "Update-AdminSite.ps1"

# 2. Primer despliegue
Write-Host "Primer despliegue desde $Repo ..."
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $updater -Root $Root -Repo $Repo -Force
if ($LASTEXITCODE -ne 0) {
  throw "El primer despliegue falló (ver $Root\logs). El sitio no se ha tocado."
}

# 3. Lectura para IIS. La identidad del pool es la que lee los ficheros.
$pool = $site.applicationPool
icacls $Root /grant "IIS_IUSRS:(OI)(CI)RX" | Out-Null
icacls $Root /grant "IIS AppPool\${pool}:(OI)(CI)RX" | Out-Null

# 4. Apuntar el sitio a la junction, guardando la ruta anterior
$previousPath = $site.physicalPath
Set-Content -Path (Join-Path $Root "previous-physical-path.txt") -Value $previousPath
Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value (Join-Path $Root "current")
Write-Host "Sitio '$SiteName': $previousPath -> $(Join-Path $Root 'current')"

# 5. Tarea programada
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$updater`" -Root `"$Root`" -Repo `"$Repo`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -StartWhenAvailable

if ($TaskCredential) {
  icacls $Root /grant "$($TaskCredential.UserName):(OI)(CI)M" | Out-Null
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
    -User $TaskCredential.UserName -Password $TaskCredential.GetNetworkCredential().Password `
    -RunLevel Limited -Force | Out-Null
} else {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
    -User "NT AUTHORITY\SYSTEM" -RunLevel Highest -Force | Out-Null
}

Write-Host ""
Write-Host "Listo. Cada $IntervalMinutes minutos se despliega el último release de GitHub."
Write-Host "Logs: $Root\logs    Versión actual: $Root\state.json"
Write-Host "Para deshacer: ver deploy\iis\README.md, 'Volver al esquema anterior'."
