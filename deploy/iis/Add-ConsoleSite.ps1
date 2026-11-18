#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Hace que ops.devitrak.net sirva el MISMO artefacto que ya despliega
  Update-AdminSite.ps1, en vez de un build propio.

.DESCRIPTION
  Hay dos situaciones y el script detecta sola cual es:

  1. El sitio YA EXISTE (es el caso hoy: ops.devitrak.net se levanto con el
     build de testing-admin-vite para probar DNS y SSL). Entonces NO se toca
     nada de lo que ya funciona -- ni los bindings, ni el certificado, ni el
     grupo de aplicaciones. Solo se cambia la ruta fisica a <Root>\current y
     se guarda la anterior para poder deshacerlo.

  2. El sitio no existe. Se crea, con grupo de aplicaciones propio y, si se
     pasa -CertThumbprint, su binding https.

  En los dos casos el resultado es el mismo:

      admin.devitrak.net  ->  C:\inetpub\devitrak-admin\current   (dashboard)
      ops.devitrak.net    ->  C:\inetpub\devitrak-admin\current   (consola)

  No hay segundo build, ni segundo release, ni segunda tarea programada: al
  cambiar la junction cambian los dos sitios a la vez. El reparto lo hace
  web.config, que viaja dentro del paquete: /platform solo se sirve en el host
  de la consola, y la raiz de ese host abre en /platform.
  Ver public/web.config y src/config/webConfigHosts.test.js.

  ANTES DE REAPUNTAR comprueba que el paquete desplegado trae la consola.
  La consola se compila fuera del bundle cuando VITE_APP_FEATURE_PLATFORM_CONSOLE
  no llega al build, que es lo que paso en TODOS los releases hasta el #110:
  el flag no estaba en release.yml. Reapuntar el host a un paquete asi deja
  ops.devitrak.net sirviendo un dashboard sin consola, que es peor que no
  haberlo movido. Se comprueba buscando la ruta "/platform" en los chunks.

.PARAMETER Force
  Reapunta aunque el paquete desplegado no traiga la consola.

.EXAMPLE
  .\Add-ConsoleSite.ps1
  .\Add-ConsoleSite.ps1 -WhatIf
  .\Add-ConsoleSite.ps1 -CertThumbprint A1B2C3...   # solo si hay que crearlo
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$HostName = "ops.devitrak.net",
  [string]$Root = "C:\inetpub\devitrak-admin",
  [string]$SiteName = "Ops",
  [string]$AppPoolName = "DevitrakOpsConsole",
  [string]$CertThumbprint,
  [int]$HttpPort = 80,
  [int]$HttpsPort = 443,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
Import-Module WebAdministration

$Current = Join-Path $Root "current"
$PreviousPathFile = Join-Path $Root "previous-ops-physical-path.txt"

if (-not (Test-Path $Current)) {
  throw "No existe $Current. Ejecuta antes Install-AdminSiteUpdater.ps1: la consola sirve el mismo artefacto que el dashboard."
}

# --- El paquete desplegado, trae la consola? --------------------------------
# Un build con el flag apagado no contiene la cadena: Vite pliega
# import.meta.env.* a una constante y elimina la rama entera.
function Test-ConsoleInBundle {
  $assets = Join-Path $Current "assets"
  if (-not (Test-Path $assets)) { return $false }
  $hit = Select-String -Path (Join-Path $assets "*.js") -SimpleMatch -Pattern '"/platform"' -List -ErrorAction SilentlyContinue |
    Select-Object -First 1
  return [bool]$hit
}

$state = $null
$stateFile = Join-Path $Root "state.json"
if (Test-Path $stateFile) { $state = Get-Content $stateFile -Raw | ConvertFrom-Json }
$deployed = if ($state) { $state.tag } else { "desconocido" }

if (-not (Test-ConsoleInBundle)) {
  $message = @"
El paquete desplegado ($deployed) no trae la consola: no aparece la ruta
"/platform" en $Current\assets. Es un release construido sin
VITE_APP_FEATURE_PLATFORM_CONSOLE, es decir anterior al #110.

Despliega primero un release nuevo (Start-ScheduledTask "Devitrak Admin - Update from GitHub")
y vuelve a ejecutar esto. Con -Force se reapunta igualmente, pero
$HostName servira un dashboard sin consola.
"@
  if (-not $Force) { throw $message }
  Write-Warning $message
}

# --- Buscar el sitio por su binding, no por su nombre -----------------------
# El sitio pudo crearse con cualquier nombre; lo que lo identifica es el host.
$hostPattern = ":{0}$" -f [regex]::Escape($HostName)
$site = Get-ChildItem "IIS:\Sites" | Where-Object {
  @($_.Bindings.Collection | Where-Object { $_.bindingInformation -match $hostPattern }).Count -gt 0
} | Select-Object -First 1

if ($site) {
  # --- Caso 1: ya existe. Solo la ruta fisica. ------------------------------
  Write-Host "Sitio encontrado por su binding: '$($site.Name)' (grupo de aplicaciones: $($site.applicationPool))"
  foreach ($b in $site.Bindings.Collection) {
    Write-Host ("  binding: {0} {1}" -f $b.protocol, $b.bindingInformation)
  }

  $previousPath = $site.physicalPath
  if ($previousPath -eq $Current) {
    Write-Host "Ya apunta a $Current. Nada que hacer."
  } else {
    if ($PSCmdlet.ShouldProcess($site.Name, "Apuntar a $Current")) {
      Set-Content -Path $PreviousPathFile -Value $previousPath -Encoding UTF8
      Set-ItemProperty "IIS:\Sites\$($site.Name)" -Name physicalPath -Value $Current
      Write-Host "'$($site.Name)': $previousPath -> $Current"
      Write-Host "Ruta anterior guardada en $PreviousPathFile"
    }
  }

  $pool = $site.applicationPool
  # Ni el grupo de aplicaciones, ni los bindings, ni el certificado se tocan:
  # ya funcionan, y cambiarlos es la forma de romper un https que iba bien.
  if ($CertThumbprint) {
    Write-Warning "-CertThumbprint se ignora: el sitio ya existe y su binding https no se toca."
  }
} else {
  # --- Caso 2: crearlo ------------------------------------------------------
  if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
    if ($PSCmdlet.ShouldProcess($AppPoolName, "Crear grupo de aplicaciones")) {
      New-WebAppPool -Name $AppPoolName | Out-Null
    }
  }
  # Contenido estatico: sin codigo gestionado que cargar.
  Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""

  if ($PSCmdlet.ShouldProcess($SiteName, "Crear sitio apuntando a $Current")) {
    New-Website -Name $SiteName -PhysicalPath $Current -ApplicationPool $AppPoolName `
      -HostHeader $HostName -Port $HttpPort -Force | Out-Null
    Write-Host "Sitio creado: $SiteName -> $Current"
  }

  if ($CertThumbprint) {
    $thumb = $CertThumbprint -replace "[^0-9A-Fa-f]", ""
    $cert = Get-Item "Cert:\LocalMachine\My\$thumb" -ErrorAction SilentlyContinue
    if (-not $cert) { throw "No hay certificado $thumb en Cert:\LocalMachine\My." }
    if ($PSCmdlet.ShouldProcess("https://${HostName}:$HttpsPort", "Anadir binding")) {
      # SNI (SslFlags 1): varios certificados en el mismo :443, uno por host.
      New-WebBinding -Name $SiteName -Protocol https -Port $HttpsPort -HostHeader $HostName -SslFlags 1
      $binding = Get-WebBinding -Name $SiteName -Protocol https |
        Where-Object { $_.bindingInformation -eq "*:${HttpsPort}:$HostName" }
      $binding.AddSslCertificate($thumb, "My")
      Write-Host "Binding https con el certificado $($cert.Subject)"
    }
  } else {
    Write-Warning "Sin -CertThumbprint: el sitio queda solo en http. No anuncies $HostName hasta tener https."
  }

  $pool = $AppPoolName
}

# --- Permisos de lectura -----------------------------------------------------
# Por SID, no por nombre: en un Windows en espanol los grupos integrados
# aparecen traducidos y un icacls por nombre falla (deploy/it, misma leccion).
# S-1-5-32-568 = IIS_IUSRS.
icacls $Root /grant "*S-1-5-32-568:(OI)(CI)RX" | Out-Null
icacls $Root /grant "IIS AppPool\${pool}:(OI)(CI)RX" | Out-Null

Write-Host ""
Write-Host "Listo. $HostName sirve el paquete $deployed, el mismo que admin.devitrak.net."
Write-Host "Nada que cambiar en la tarea programada: al cambiar la junction, cambian los dos sitios a la vez."
Write-Host ""
Write-Host "Comprueba:"
Write-Host "  https://$HostName/                  -> redirige a /platform"
Write-Host "  https://admin.devitrak.net/platform -> redirige a https://$HostName/platform"
Write-Host "  Version desplegada: $Root\state.json (hay una sola)"
Write-Host ""
Write-Host "Para deshacer:"
Write-Host "  Set-ItemProperty 'IIS:\Sites\<sitio>' -Name physicalPath -Value (Get-Content $PreviousPathFile)"
