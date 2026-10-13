<#
.SYNOPSIS
  Despliega en IIS el último release del admin dashboard publicado en GitHub.

.DESCRIPTION
  Lo ejecuta una tarea programada cada pocos minutos en DEVITRACKAPP
  (Install-AdminSiteUpdater.ps1 la registra). Si el release marcado como
  "latest" en GitHub es distinto del desplegado:

    1. descarga admin-dist.zip y su .sha256, y compara el hash;
    2. lo extrae en <Root>\releases\<tag>, y comprueba index.html y web.config;
    3. apunta la junction <Root>\current a esa carpeta. El sitio de IIS sirve
       <Root>\current, así que el cambio es un rename, no una copia a medias;
    4. guarda las últimas $Keep versiones para volver atrás.

  El servidor no ejecuta nada que venga de GitHub: solo descarga un zip de
  ficheros estáticos y verifica su hash. No necesita ningún puerto de entrada.

.PARAMETER Tag
  Despliega ese release en vez del "latest" (para volver atrás a mano).

.PARAMETER PackagePath
  Despliega un zip local en vez de descargarlo. Con -Tag para nombrarlo.

.PARAMETER Force
  Vuelve a desplegar aunque el tag ya sea el actual.

.EXAMPLE
  .\Update-AdminSite.ps1
  .\Update-AdminSite.ps1 -Tag admin-20261012-180000-cf05d97
#>
[CmdletBinding()]
param(
  [string]$Repo = "grodriguezcontextglobal/testing-admin-dashboard",
  [string]$Root = "C:\inetpub\devitrak-admin",
  [int]$Keep = 5,
  [string]$Tag,
  [string]$PackagePath,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$AssetName = "admin-dist.zip"

$Releases = Join-Path $Root "releases"
$Downloads = Join-Path $Root "downloads"
$Logs = Join-Path $Root "logs"
$Current = Join-Path $Root "current"
$StateFile = Join-Path $Root "state.json"
$LockFile = Join-Path $Root "update.lock"

foreach ($dir in @($Root, $Releases, $Downloads, $Logs)) {
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
}

$LogFile = Join-Path $Logs ("update-{0}.log" -f (Get-Date -Format "yyyy-MM"))
function Write-Log([string]$Message) {
  $line = "{0}  {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $LogFile -Value $line
  Write-Host $line
}

function Read-State {
  if (Test-Path $StateFile) { return Get-Content $StateFile -Raw | ConvertFrom-Json }
  return $null
}

# Una junction se borra con rmdir. Remove-Item en PowerShell 5.1 puede
# recorrerla y borrar el contenido de la carpeta a la que apunta.
function Remove-Junction([string]$Path) {
  if (Test-Path $Path) { cmd /c rmdir "$Path" | Out-Null }
}

function Get-Release([string]$WantedTag) {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $url = if ($WantedTag) {
    "https://api.github.com/repos/$Repo/releases/tags/$WantedTag"
  } else {
    "https://api.github.com/repos/$Repo/releases/latest"
  }
  return Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "devitrak-iis-updater" }
}

function Get-Package($Release) {
  $zipAsset = $Release.assets | Where-Object { $_.name -eq $AssetName }
  $shaAsset = $Release.assets | Where-Object { $_.name -eq "$AssetName.sha256" }
  if (-not $zipAsset -or -not $shaAsset) {
    throw "El release $($Release.tag_name) no trae $AssetName y su .sha256."
  }

  $zipPath = Join-Path $Downloads "$($Release.tag_name).zip"
  $headers = @{ "User-Agent" = "devitrak-iis-updater" }
  Invoke-WebRequest -Uri $zipAsset.browser_download_url -OutFile $zipPath -Headers $headers -UseBasicParsing
  $expected = (Invoke-WebRequest -Uri $shaAsset.browser_download_url -Headers $headers -UseBasicParsing).Content
  if ($expected -is [byte[]]) { $expected = [Text.Encoding]::ASCII.GetString($expected) }
  $expected = $expected.Trim().ToLowerInvariant()

  $actual = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) {
    Remove-Item $zipPath -Force
    throw "El hash de $AssetName no coincide (esperado $expected, recibido $actual). No se despliega."
  }
  return $zipPath
}

function Expand-Release([string]$ZipPath, [string]$ReleaseTag) {
  $target = Join-Path $Releases $ReleaseTag
  if (Test-Path $target) { return $target }

  $partial = "$target.partial"
  if (Test-Path $partial) { Remove-Item $partial -Recurse -Force }
  Expand-Archive -Path $ZipPath -DestinationPath $partial

  # Sin index.html no hay app, y sin web.config IIS devuelve 404 en cualquier
  # ruta de la SPA que no sea la raíz.
  foreach ($required in @("index.html", "web.config")) {
    if (-not (Test-Path (Join-Path $partial $required))) {
      Remove-Item $partial -Recurse -Force
      throw "El paquete $ReleaseTag no trae $required. No se despliega."
    }
  }
  Rename-Item -Path $partial -NewName (Split-Path $target -Leaf)
  return $target
}

# Prepara la junction nueva al lado y la cambia con dos renames: el sitio pasa
# de una versión completa a otra sin servir nunca una carpeta a medias.
function Switch-Current([string]$Target) {
  $next = "$Current.next"
  $previous = "$Current.prev"
  Remove-Junction $next
  Remove-Junction $previous
  cmd /c mklink /J "$next" "$Target" | Out-Null
  if (Test-Path $Current) { Rename-Item -Path $Current -NewName (Split-Path $previous -Leaf) }
  Rename-Item -Path $next -NewName (Split-Path $Current -Leaf)
  Remove-Junction $previous
}

function Remove-OldReleases([string]$KeepTag) {
  Get-ChildItem $Releases -Directory |
    Where-Object { $_.Name -ne $KeepTag -and $_.Name -notlike "*.partial" } |
    Sort-Object CreationTime -Descending |
    Select-Object -Skip ([Math]::Max($Keep - 1, 0)) |
    ForEach-Object { Remove-Item $_.FullName -Recurse -Force }

  Get-ChildItem $Downloads -File |
    Where-Object { $_.BaseName -ne $KeepTag } |
    ForEach-Object { Remove-Item $_.FullName -Force }
}

# Una sola ejecución a la vez: la tarea corre cada pocos minutos y una
# descarga lenta no debe solaparse con la siguiente.
$lock = $null
try {
  $lock = [IO.File]::Open($LockFile, "OpenOrCreate", "ReadWrite", "None")
} catch {
  Write-Host "Otra actualización está en curso; se omite esta pasada."
  exit 0
}

try {
  $state = Read-State

  if ($PackagePath) {
    if (-not $Tag) { $Tag = "local-" + (Get-Date -Format "yyyyMMdd-HHmmss") }
    $releaseTag = $Tag
    $zipPath = (Resolve-Path $PackagePath).Path
  } else {
    $release = Get-Release $Tag
    $releaseTag = $release.tag_name
  }

  # Lo normal: nada nuevo. Sin línea en el log, o crecería cada 5 minutos.
  if (-not $Force -and $state -and $state.tag -eq $releaseTag -and (Test-Path $Current)) {
    exit 0
  }

  Write-Log "Desplegando $releaseTag (actual: $(if ($state) { $state.tag } else { 'ninguno' }))"
  if (-not $PackagePath) { $zipPath = Get-Package $release }
  $target = Expand-Release $zipPath $releaseTag
  Switch-Current $target

  @{
    tag = $releaseTag
    previous = if ($state) { $state.tag } else { $null }
    deployedAt = (Get-Date).ToString("o")
  } | ConvertTo-Json | Set-Content -Path $StateFile -Encoding UTF8

  Remove-OldReleases $releaseTag
  Write-Log "OK: $Current -> $target"
  exit 0
} catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
} finally {
  if ($lock) { $lock.Dispose() }
}
