#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Publica la Admin Console en su propio host (ops.devitrak.net) sirviendo el
  MISMO artefacto que ya despliega Update-AdminSite.ps1.

.DESCRIPTION
  No hay un segundo build, ni un segundo release, ni una segunda tarea
  programada. Este script solo crea un sitio de IIS mas que apunta a la misma
  junction <Root>\current:

      admin.devitrak.net  ->  C:\inetpub\devitrak-admin\current   (sitio Admin)
      ops.devitrak.net    ->  C:\inetpub\devitrak-admin\current   (sitio Ops)

  El reparto entre los dos lo hace web.config, que viaja dentro del paquete:
  /platform solo se sirve en el host de la consola, y la raiz de ese host abre
  en /platform. Ver public/web.config y src/config/webConfigHosts.test.js.

  Lo que gana la consola al tener host propio, y por lo que no basta con
  anadir un binding al sitio Admin:

    - Origen de navegador distinto: sesion, localStorage y service worker
      separados de la app de clientes.
    - Grupo de aplicaciones propio: se puede parar, reciclar o restringir por
      IP sin tocar admin.devitrak.net.
    - Certificado propio: revocarlo no deja sin servicio a los clientes.
    - Es el origen que el backend tiene en su lista de CORS como entrada
      aparte, por la misma razon.

  El script es idempotente: ejecutarlo dos veces deja el mismo estado.

.PARAMETER CertThumbprint
  Huella del certificado para el binding https. Sin ella se crea solo el
  binding http y el script dice que falta; el sitio queda creado pero no se
  debe anunciar hasta que tenga https (HSTS ya se envia en las cabeceras).

.EXAMPLE
  .\Add-ConsoleSite.ps1 -CertThumbprint A1B2C3...
  .\Add-ConsoleSite.ps1 -HostName ops.devitrak.net -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$SiteName = "Ops",
  [string]$HostName = "ops.devitrak.net",
  [string]$Root = "C:\inetpub\devitrak-admin",
  [string]$AppPoolName = "DevitrakOpsConsole",
  [string]$CertThumbprint,
  [int]$HttpPort = 80,
  [int]$HttpsPort = 443
)

$ErrorActionPreference = "Stop"
Import-Module WebAdministration

$Current = Join-Path $Root "current"
if (-not (Test-Path $Current)) {
  throw "No existe $Current. Ejecuta antes Install-AdminSiteUpdater.ps1: la consola sirve el mismo artefacto que el dashboard."
}

# --- Grupo de aplicaciones propio -------------------------------------------
if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
  if ($PSCmdlet.ShouldProcess($AppPoolName, "Crear grupo de aplicaciones")) {
    New-WebAppPool -Name $AppPoolName | Out-Null
    Write-Host "Grupo de aplicaciones creado: $AppPoolName"
  }
} else {
  Write-Host "Grupo de aplicaciones ya existente: $AppPoolName"
}
# Contenido estatico: sin codigo gestionado que cargar.
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""

# --- Sitio -------------------------------------------------------------------
$site = Get-Item "IIS:\Sites\$SiteName" -ErrorAction SilentlyContinue
if (-not $site) {
  if ($PSCmdlet.ShouldProcess($SiteName, "Crear sitio apuntando a $Current")) {
    New-Website -Name $SiteName -PhysicalPath $Current -ApplicationPool $AppPoolName `
      -HostHeader $HostName -Port $HttpPort -Force | Out-Null
    Write-Host "Sitio creado: $SiteName -> $Current"
  }
} else {
  Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $Current
  Set-ItemProperty "IIS:\Sites\$SiteName" -Name applicationPool -Value $AppPoolName
  Write-Host "Sitio ya existente: $SiteName -> $Current"
}

# --- Bindings ----------------------------------------------------------------
function Set-Binding([string]$Protocol, [int]$Port) {
  $existing = Get-WebBinding -Name $SiteName -Protocol $Protocol -ErrorAction SilentlyContinue |
    Where-Object { $_.bindingInformation -eq "*:${Port}:$HostName" }
  if ($existing) { return $false }
  if ($PSCmdlet.ShouldProcess("$Protocol`://${HostName}:$Port", "Anadir binding")) {
    if ($Protocol -eq "https") {
      New-WebBinding -Name $SiteName -Protocol https -Port $Port -HostHeader $HostName -SslFlags 1
    } else {
      New-WebBinding -Name $SiteName -Protocol http -Port $Port -HostHeader $HostName
    }
  }
  return $true
}

Set-Binding "http" $HttpPort | Out-Null

if ($CertThumbprint) {
  $thumb = $CertThumbprint -replace "[^0-9A-Fa-f]", ""
  $cert = Get-Item "Cert:\LocalMachine\My\$thumb" -ErrorAction SilentlyContinue
  if (-not $cert) { throw "No hay certificado $thumb en Cert:\LocalMachine\My." }
  if (Set-Binding "https" $HttpsPort) {
    # SNI (SslFlags 1): varios certificados en el mismo :443, uno por host.
    $binding = Get-WebBinding -Name $SiteName -Protocol https |
      Where-Object { $_.bindingInformation -eq "*:${HttpsPort}:$HostName" }
    $binding.AddSslCertificate($thumb, "My")
    Write-Host "Binding https con el certificado $($cert.Subject)"
  } else {
    Write-Host "Binding https ya existente; el certificado no se toca."
  }
} else {
  Write-Warning "Sin -CertThumbprint: el sitio queda solo en http. No anuncies $HostName hasta tener https."
}

# --- Permisos de lectura -----------------------------------------------------
# Por SID, no por nombre: en un Windows en espanol los grupos integrados
# aparecen traducidos y un icacls por nombre falla (deploy/it, misma leccion).
# S-1-5-32-568 = IIS_IUSRS.
icacls $Root /grant "*S-1-5-32-568:(OI)(CI)RX" | Out-Null
icacls $Root /grant "IIS AppPool\${AppPoolName}:(OI)(CI)RX" | Out-Null

Write-Host ""
Write-Host "Listo. $HostName sirve el mismo paquete que admin.devitrak.net."
Write-Host "Nada que cambiar en la tarea programada: al cambiar la junction, cambian los dos sitios a la vez."
Write-Host ""
Write-Host "Comprueba:"
Write-Host "  https://$HostName/                 -> redirige a /platform"
Write-Host "  https://admin.devitrak.net/platform -> redirige a https://$HostName/platform"
Write-Host "  Las dos versiones: $Root\state.json (hay una sola)"
