<#
.SYNOPSIS
  Informe de endurecimiento de esta maquina (GovRAMP CM-6, CM-7, SC-8, AC-7, AU-2).
  Solo lee, salvo que se pasen -RemoveExpiredCerts y -Apply juntos.

.DESCRIPTION
  Cuatro secciones:

    1. Certificados   todos los de LocalMachine\My y \WebHosting, si estan
                      vencidos y si algun binding de IIS los sigue usando.
                      Los vencidos y sin usar son peso muerto (POA&M IM-2026-007).
    2. Componentes    software que no pinta nada en un servidor de produccion:
                      Memurai, agente de Figma, WSL, Docker, adaptadores de
                      Hyper-V, cola de impresion (CM-7, POA&M APP-2026-009).
    3. Cuentas        politica de net accounts, administradores locales y la
                      politica de auditoria de Windows (AC-7, IA-5, AU-2).
    4. CIS L1         una veintena de ajustes clave del CIS Windows Server 2019
                      Nivel 1, cada uno OK o REVIEW. NO es el benchmark
                      completo: para eso hace falta CIS-CAT Lite o Microsoft
                      Policy Analyzer (POA&M APP-2026-008).

  Viene de scripts/vm-hardening-report.ps1 del repo del servidor
  (grodriguezcontextglobal/server-testing, PR #63, commit 9f091ac). Tres
  diferencias, todas a proposito:

    1. el informe va siempre al Escritorio, porque este repo no tiene carpeta
       logs\evidence y el informe NO debe acabar versionado;
    2. IA5-02: avisa de las cuentas activas cuya contrasena nunca caduca. En
       DEVITRACKDB la politica dice 42 dias y hay contrasenas de 1551 dias,
       asi que la politica no se les aplica;
    3. AU2-02: avisa si no se audita la creacion de procesos (evento 4688).
       En DEVITRACKDB no se audita, asi que un incidente no se puede
       reconstruir.
    4. nada se busca por su nombre en ingles. La VM tiene Windows en espanol:
       el grupo es "Administradores", y "net accounts" y "auditpol" imprimen
       sus etiquetas traducidas. Por eso el grupo y la cuenta de invitado se
       buscan por SID, la politica de contrasenas sale de "secedit /export" y
       la de auditoria de "auditpol /backup", que dan claves y numeros iguales
       en cualquier idioma. Es el mismo arreglo que necesito
       inventario-red-vm.ps1 en la PR #99.

  Las comprobaciones 2 y 3 hay que llevarlas tambien al repo del servidor para
  que los dos informes sigan siendo comparables.

  El informe nombra cuentas y direcciones IP. No enviarlo tal cual.

.PARAMETER RemoveExpiredCerts
  Con -Apply, borra los certificados que estan vencidos Y ademas no los usa
  ningun binding de IIS. Antes exporta cada uno (solo la parte publica) a la
  carpeta de salida, asi que el borrado se puede deshacer y se puede ensenar
  a un evaluador. Sin -Apply solo ensena el plan.

.PARAMETER OutDir
  Donde escribir el informe. Por defecto, el Escritorio de quien lo ejecuta.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\endurecimiento-vm.ps1

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\endurecimiento-vm.ps1 -RemoveExpiredCerts
  powershell -NoProfile -ExecutionPolicy Bypass -File .\endurecimiento-vm.ps1 -RemoveExpiredCerts -Apply

.NOTES
  Uso en la VM (Remote Desktop): git pull en el clon del repo, abrir PowerShell
  como Administrador en deploy\it y ejecutar:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\endurecimiento-vm.ps1

  El pipeline de release NO lo ejecuta: DEVITRACKAPP solo descarga el zip del
  build. Se corre a mano.

  ASCII puro a proposito: Windows PowerShell 5.1 lee un archivo sin BOM como
  ANSI, y un caracter no ASCII rompe el parser.
#>

[CmdletBinding()]
param(
    [switch] $RemoveExpiredCerts,
    [switch] $Apply,
    [string] $OutDir = ''
)

$ErrorActionPreference = 'Stop'

if (-not $OutDir) {
    $OutDir = [Environment]::GetFolderPath('Desktop')
}
New-Item -ItemType Directory -Force $OutDir | Out-Null
$reportPath = Join-Path $OutDir ("hardening-{0}-{1}.txt" -f $env:COMPUTERNAME, (Get-Date -Format 'yyyyMMdd-HHmm'))
Start-Transcript -Path $reportPath | Out-Null

$script:checks = @()

function Add-Check([string] $Id, [string] $Name, [object] $Pass, [string] $Found, [string] $Want) {
    $status = 'REVIEW'
    if ($Pass -eq $true) { $status = 'OK' }
    $script:checks += [pscustomobject]@{ Id = $Id; Name = $Name; Status = $status; Found = $Found; Want = $Want }
}

function Get-RegValue([string] $Path, [string] $Name) {
    try { return (Get-ItemProperty -Path $Path -Name $Name -ErrorAction Stop).$Name } catch { return $null }
}

function Show-Value($v) {
    if ($null -eq $v) { return '(not set)' }
    return "$v"
}

try {
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
        ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) { throw "run this script in an elevated (Administrator) PowerShell." }

    $now = Get-Date
    $os = Get-CimInstance Win32_OperatingSystem
    Write-Host "==> Machine" -ForegroundColor Cyan
    Write-Host ("    {0}  {1} (build {2})" -f $os.CSName, $os.Caption, $os.Version)
    Write-Host ("    last boot {0:yyyy-MM-dd HH:mm}  report {1:yyyy-MM-dd HH:mm}" -f $os.LastBootUpTime, $now)

    # ------------------------------------------------------------------ 1. Certificates
    Write-Host "==> 1. Certificates in LocalMachine\My and \WebHosting" -ForegroundColor Cyan

    $boundHashes = @()
    $iisAvailable = $false
    if (Get-Module -ListAvailable WebAdministration) {
        Import-Module WebAdministration
        $iisAvailable = $true
        foreach ($site in (Get-ChildItem IIS:\Sites)) {
            foreach ($b in ($site.Bindings.Collection | Where-Object { $_.protocol -eq 'https' })) {
                $h = "$($b.certificateHash)"
                if ($h) { $boundHashes += $h.ToUpper() }
            }
        }
    } else {
        Write-Host "    IIS is not installed on this machine" -ForegroundColor DarkGray
    }

    $certs = @()
    foreach ($store in @('My', 'WebHosting')) {
        $items = @(Get-ChildItem "Cert:\LocalMachine\$store" -ErrorAction SilentlyContinue)
        foreach ($c in $items) {
            $expired = $c.NotAfter -lt $now
            $inUse = $boundHashes -contains $c.Thumbprint.ToUpper()
            $certs += [pscustomobject]@{
                Store = $store; Thumbprint = $c.Thumbprint; Subject = $c.Subject
                NotAfter = $c.NotAfter; Expired = $expired; InUse = $inUse; Cert = $c
            }
        }
    }

    if (-not $certs.Count) {
        Write-Host "    no certificate in either store"
    }
    foreach ($c in ($certs | Sort-Object NotAfter)) {
        $state = 'OK'
        $color = 'Green'
        if ($c.Expired -and $c.InUse) { $state = 'EXPIRED AND IN USE'; $color = 'Red' }
        elseif ($c.Expired) { $state = 'EXPIRED, UNUSED'; $color = 'Yellow' }
        elseif (($c.NotAfter - $now).TotalDays -lt 30) { $state = 'EXPIRES SOON'; $color = 'Yellow' }
        Write-Host ("    [{0}] {1}  {2:yyyy-MM-dd}  {3}" -f $state, $c.Store, $c.NotAfter, $c.Subject) -ForegroundColor $color
        Write-Host ("        thumbprint {0}" -f $c.Thumbprint) -ForegroundColor DarkGray
    }

    $deletable = @($certs | Where-Object { $_.Expired -and -not $_.InUse })
    $expiredInUse = @($certs | Where-Object { $_.Expired -and $_.InUse })
    Write-Host ("    {0} certificate(s), {1} expired and unused, {2} expired and still bound" -f $certs.Count, $deletable.Count, $expiredInUse.Count)
    Add-Check 'CERT-01' 'No expired certificate bound in IIS' ($expiredInUse.Count -eq 0) "$($expiredInUse.Count) bound" '0'
    Add-Check 'CERT-02' 'No expired certificate left in the stores' ($deletable.Count -eq 0) "$($deletable.Count) unused" '0'

    if ($RemoveExpiredCerts) {
        if (-not $deletable.Count) {
            Write-Host "    nothing to delete" -ForegroundColor DarkGray
        } elseif (-not $Apply) {
            Write-Host "    Plan (nothing changed, add -Apply):" -ForegroundColor Yellow
            foreach ($c in $deletable) { Write-Host ("        delete {0}\{1}  {2}" -f $c.Store, $c.Thumbprint, $c.Subject) }
        } else {
            foreach ($c in $deletable) {
                $backup = Join-Path $OutDir ("cert-{0}-{1}.cer" -f $c.Store, $c.Thumbprint)
                Export-Certificate -Cert $c.Cert -FilePath $backup -Type CERT | Out-Null
                Remove-Item -Path ("Cert:\LocalMachine\{0}\{1}" -f $c.Store, $c.Thumbprint) -Force
                Write-Host ("    deleted {0}\{1} (exported to {2})" -f $c.Store, $c.Thumbprint, $backup) -ForegroundColor Green
            }
        }
    } elseif ($deletable.Count) {
        Write-Host "    Add -RemoveExpiredCerts to see the deletion plan." -ForegroundColor Yellow
    }

    # ------------------------------------------------------------------ 2. Components
    Write-Host "==> 2. Components that do not belong on a production server (CM-7)" -ForegroundColor Cyan

    $unwanted = @(
        @{ Name = 'Memurai (Redis for Windows)'; Service = 'Memurai*'; Hint = 'Uninstall from Programs and Features; the app uses Redis Cloud' },
        @{ Name = 'Figma agent'; Service = 'figma*'; Process = 'figma_agent'; Hint = 'Uninstall the Figma desktop app' },
        @{ Name = 'Docker'; Service = 'docker*'; Hint = 'Uninstall Docker Desktop or the engine' },
        @{ Name = 'WSL'; Service = 'LxssManager'; Hint = 'Disable the Windows Subsystem for Linux feature' },
        @{ Name = 'Hyper-V'; Service = 'vmms'; Hint = 'Only needed to host VMs; this machine is a guest' },
        @{ Name = 'Print spooler'; Service = 'Spooler'; Hint = 'CIS L1 asks to disable it on a server that does not print' }
    )
    $found = 0
    foreach ($u in $unwanted) {
        $svc = @(Get-Service -Name $u.Service -ErrorAction SilentlyContinue)
        $proc = @()
        if ($u.Process) { $proc = @(Get-Process -Name $u.Process -ErrorAction SilentlyContinue) }
        if ($svc.Count -or $proc.Count) {
            $found++
            $detail = ($svc | ForEach-Object { "$($_.Name)=$($_.Status)" }) -join ', '
            if ($proc.Count -and -not $detail) { $detail = "process running" }
            Write-Host ("    [PRESENT] {0}: {1}" -f $u.Name, $detail) -ForegroundColor Yellow
            Write-Host ("              {0}" -f $u.Hint) -ForegroundColor DarkGray
        } else {
            Write-Host ("    [absent]  {0}" -f $u.Name) -ForegroundColor DarkGray
        }
    }
    Add-Check 'CM7-01' 'No software outside the production role' ($found -eq 0) "$found present" '0'

    Write-Host "    Virtual network adapters (WSL, Docker and Hyper-V create these):"
    $virt = @(Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'vEthernet|WSL|Docker' })
    if ($virt.Count) {
        foreach ($a in $virt) { Write-Host ("        [PRESENT] {0}  {1}" -f $a.Name, $a.Status) -ForegroundColor Yellow }
    } else {
        Write-Host "        none" -ForegroundColor DarkGray
    }
    Add-Check 'CM7-02' 'No virtual network adapter' ($virt.Count -eq 0) "$($virt.Count) adapter(s)" '0'

    # ------------------------------------------------------------------ 3. Accounts
    Write-Host "==> 3. Accounts, password policy and audit policy" -ForegroundColor Cyan
    Write-Host ((net accounts) -join "`n")

    # The numbers come from secedit, not from what `net accounts` prints: this
    # VM runs Windows in Spanish, so matching English labels left both checks
    # at REVIEW whatever the policy said. The .inf keys are the same in every
    # language.
    $lockout = $null
    $minLen = $null
    $secInf = Join-Path $env:TEMP ("secpol-{0}.inf" -f [guid]::NewGuid())
    try {
        secedit /export /areas SECURITYPOLICY /cfg $secInf /quiet | Out-Null
        foreach ($line in (Get-Content -LiteralPath $secInf)) {
            if ($line -match '^\s*LockoutBadCount\s*=\s*(\d+)') { $lockout = [int]$Matches[1] }
            if ($line -match '^\s*MinimumPasswordLength\s*=\s*(\d+)') { $minLen = [int]$Matches[1] }
        }
    } catch {
        Write-Host ("    could not read the security policy: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    } finally {
        Remove-Item -LiteralPath $secInf -Force -ErrorAction SilentlyContinue
    }

    $lockoutOk = ($null -ne $lockout -and $lockout -ge 1 -and $lockout -le 10)
    $lockoutFound = '(not read)'
    if ($null -ne $lockout) { $lockoutFound = if ($lockout -eq 0) { '0 (never locks out)' } else { "$lockout" } }
    Add-Check 'AC7-01' 'Account lockout threshold set (10 or fewer)' $lockoutOk $lockoutFound '1 to 10'
    $minLenOk = ($null -ne $minLen -and $minLen -ge 12)
    Add-Check 'IA5-01' 'Minimum password length 12 or more' $minLenOk (Show-Value $minLen) '12 or more'

    # By SID, never by name: this group is "Administradores" on the VM.
    Write-Host "    Local administrators (S-1-5-32-544):"
    Get-LocalGroupMember -SID 'S-1-5-32-544' -ErrorAction SilentlyContinue |
        ForEach-Object { Write-Host ("        {0}  ({1})" -f $_.Name, $_.PrincipalSource) }

    Write-Host "    Local accounts, password age and expiry:"
    Get-LocalUser | Sort-Object Name | ForEach-Object {
        $age = '(never set)'
        if ($_.PasswordLastSet) { $age = "{0:yyyy-MM-dd} ({1} days)" -f $_.PasswordLastSet, [int]($now - $_.PasswordLastSet).TotalDays }
        $expires = '(never expires)'
        if ($_.PasswordExpires) { $expires = "{0:yyyy-MM-dd}" -f $_.PasswordExpires }
        Write-Host ("        {0,-20} enabled={1,-5} password {2}  expires {3}" -f $_.Name, $_.Enabled, $age, $expires)
    }
    $neverExpire = @(Get-LocalUser | Where-Object { $_.Enabled -and -not $_.PasswordExpires })
    Add-Check 'IA5-02' 'No enabled account with a password that never expires' ($neverExpire.Count -eq 0) "$($neverExpire.Count) account(s)" '0'
    # The built-in guest account is "Invitado" here; its SID always ends -501.
    $guest = @(Get-LocalUser | Where-Object { $_.SID.Value -like '*-501' })[0]
    $guestFound = 'not present'
    if ($guest) { $guestFound = "$($guest.Name) enabled=$($guest.Enabled)" }
    Add-Check 'AC2-01' 'Guest account disabled' ($guest -and -not $guest.Enabled) $guestFound 'disabled'

    Write-Host "    Audit policy:"
    Write-Host (auditpol /get /category:* | Out-String)

    # Same reason as the password policy: what auditpol prints is translated,
    # but `auditpol /backup` writes a CSV whose last column is the setting as a
    # number (0 none, 1 success, 2 failure, 3 both), and the subcategory GUIDs
    # are the same on every Windows.
    $auditSettings = @{}
    $auditCsv = Join-Path $env:TEMP ("auditpol-{0}.csv" -f [guid]::NewGuid())
    try {
        auditpol /backup /file:$auditCsv | Out-Null
        # auditpol writes UTF-16. Get-Content follows the BOM; if the file has
        # none, the first read is mojibake and no GUID shows up, so read again.
        $auditLines = @(Get-Content -LiteralPath $auditCsv)
        if (-not ($auditLines -match '\{[0-9A-Fa-f-]{36}\}')) {
            $auditLines = @(Get-Content -LiteralPath $auditCsv -Encoding Unicode)
        }
        foreach ($line in $auditLines) {
            if ($line -match '(\{[0-9A-Fa-f-]{36}\}).*,(\d+)\s*$') {
                $auditSettings[$Matches[1].ToUpper()] = [int]$Matches[2]
            }
        }
    } catch {
        Write-Host ("    could not read the audit policy: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    } finally {
        Remove-Item -LiteralPath $auditCsv -Force -ErrorAction SilentlyContinue
    }
    $auditName = @{ 0 = 'No Auditing'; 1 = 'Success'; 2 = 'Failure'; 3 = 'Success and Failure' }
    $logonSetting = $auditSettings['{0CCE9215-69AE-11D9-BED3-505054503030}']
    $logonFound = '(not read)'
    if ($null -ne $logonSetting) { $logonFound = $auditName[$logonSetting] }
    Add-Check 'AU2-01' 'Logon events audited for success and failure' ($logonSetting -eq 3) $logonFound 'Success and Failure'
    $procSetting = $auditSettings['{0CCE922B-69AE-11D9-BED3-505054503030}']
    $procFound = '(not read)'
    if ($null -ne $procSetting) { $procFound = $auditName[$procSetting] }
    Add-Check 'AU2-02' 'Process creation audited (event 4688)' ($null -ne $procSetting -and ($procSetting -band 1) -eq 1) $procFound 'Success'

    # ------------------------------------------------------------------ 4. CIS L1
    Write-Host "==> 4. CIS Windows Server 2019 Level 1: key settings" -ForegroundColor Cyan

    $lsa = 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa'
    $srv = 'HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters'
    $wks = 'HKLM:\SYSTEM\CurrentControlSet\Services\LanmanWorkstation\Parameters'
    $rdp = 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp'
    $pol = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System'

    $smb1 = Get-RegValue $srv 'SMB1'
    $smb1Feature = $null
    try { $smb1Feature = (Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -ErrorAction Stop).State } catch { }
    Add-Check 'CIS-01' 'SMBv1 disabled' (($smb1 -eq 0) -or ($smb1Feature -eq 'Disabled')) ("SMB1=" + (Show-Value $smb1) + " feature=" + (Show-Value $smb1Feature)) 'SMB1=0 or feature Disabled'

    $sign = Get-RegValue $srv 'RequireSecuritySignature'
    Add-Check 'CIS-02' 'SMB signing required (server)' ($sign -eq 1) (Show-Value $sign) '1'
    $signW = Get-RegValue $wks 'RequireSecuritySignature'
    Add-Check 'CIS-03' 'SMB signing required (client)' ($signW -eq 1) (Show-Value $signW) '1'

    $llmnr = Get-RegValue 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient' 'EnableMulticast'
    Add-Check 'CIS-04' 'LLMNR disabled' ($llmnr -eq 0) (Show-Value $llmnr) '0'

    $lmc = Get-RegValue $lsa 'LmCompatibilityLevel'
    Add-Check 'CIS-05' 'NTLMv2 only, LM and NTLM refused' ($lmc -ge 5) (Show-Value $lmc) '5'

    $ra = Get-RegValue $lsa 'RestrictAnonymous'
    Add-Check 'CIS-06' 'Anonymous enumeration of shares blocked' ($ra -eq 1) (Show-Value $ra) '1'
    $ras = Get-RegValue $lsa 'RestrictAnonymousSAM'
    Add-Check 'CIS-07' 'Anonymous enumeration of SAM accounts blocked' ($ras -eq 1) (Show-Value $ras) '1'

    $ppl = Get-RegValue $lsa 'RunAsPPL'
    Add-Check 'CIS-08' 'LSA protection enabled' ($ppl -eq 1) (Show-Value $ppl) '1'

    $wdigest = Get-RegValue 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest' 'UseLogonCredential'
    Add-Check 'CIS-09' 'WDigest does not cache plaintext credentials' (($null -eq $wdigest) -or ($wdigest -eq 0)) (Show-Value $wdigest) '0 or not set'

    $cached = Get-RegValue 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon' 'CachedLogonsCount'
    Add-Check 'CIS-10' 'Cached logons 4 or fewer' (($null -ne $cached) -and ([int]$cached -le 4)) (Show-Value $cached) '4 or fewer'

    $lua = Get-RegValue $pol 'EnableLUA'
    Add-Check 'CIS-11' 'UAC enabled' ($lua -eq 1) (Show-Value $lua) '1'
    $consent = Get-RegValue $pol 'ConsentPromptBehaviorAdmin'
    Add-Check 'CIS-12' 'UAC prompts administrators for consent' (($consent -eq 1) -or ($consent -eq 2)) (Show-Value $consent) '1 or 2'

    $aie = Get-RegValue 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Installer' 'AlwaysInstallElevated'
    Add-Check 'CIS-13' 'Windows Installer does not always install elevated' (($null -eq $aie) -or ($aie -eq 0)) (Show-Value $aie) '0 or not set'

    $autorun = Get-RegValue 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer' 'NoDriveTypeAutoRun'
    Add-Check 'CIS-14' 'Autorun disabled on every drive' ($autorun -eq 255) (Show-Value $autorun) '255'

    $nla = Get-RegValue $rdp 'UserAuthentication'
    Add-Check 'CIS-15' 'RDP requires Network Level Authentication' ($nla -eq 1) (Show-Value $nla) '1'
    $enc = Get-RegValue $rdp 'MinEncryptionLevel'
    Add-Check 'CIS-16' 'RDP encryption level High' ($enc -ge 3) (Show-Value $enc) '3'

    $profiles = @(Get-NetFirewallProfile)
    $fwOn = @($profiles | Where-Object { -not $_.Enabled }).Count -eq 0
    Add-Check 'CIS-17' 'Windows firewall enabled on all profiles' $fwOn (($profiles | ForEach-Object { "$($_.Name)=$($_.Enabled)" }) -join ' ') 'all True'
    # NotConfigured is not a hole: Windows blocks inbound by default. CIS still
    # wants it set explicitly, so it is reported, with the difference spelled out.
    $fwBlock = @($profiles | Where-Object { $_.DefaultInboundAction -ne 'Block' }).Count -eq 0
    Add-Check 'CIS-18' 'Firewall blocks inbound by default' $fwBlock (($profiles | ForEach-Object { "$($_.Name)=$($_.DefaultInboundAction)" }) -join ' ') 'Block set explicitly; NotConfigured already blocks, but CIS asks for it to be set'

    $secLog = Get-WinEvent -ListLog Security
    $secMb = [math]::Round($secLog.MaximumSizeInBytes / 1MB)
    Add-Check 'CIS-19' 'Security log 192 MB or larger' ($secLog.MaximumSizeInBytes -ge 201326592) "$secMb MB, $($secLog.LogMode)" '192 MB or more'

    $sbl = Get-RegValue 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' 'EnableScriptBlockLogging'
    Add-Check 'CIS-20' 'PowerShell script block logging enabled' ($sbl -eq 1) (Show-Value $sbl) '1'

    # ------------------------------------------------------------------ Summary
    Write-Host "==> Summary" -ForegroundColor Cyan
    foreach ($c in $script:checks) {
        $color = 'Green'
        if ($c.Status -ne 'OK') { $color = 'Yellow' }
        Write-Host ("    [{0,-6}] {1}  {2}" -f $c.Status, $c.Id, $c.Name) -ForegroundColor $color
        if ($c.Status -ne 'OK') { Write-Host ("             found: {0}   want: {1}" -f $c.Found, $c.Want) -ForegroundColor DarkGray }
    }
    $ok = @($script:checks | Where-Object { $_.Status -eq 'OK' }).Count
    $review = @($script:checks | Where-Object { $_.Status -ne 'OK' }).Count
    Write-Host ""
    Write-Host ("    {0} OK, {1} to review, out of {2}" -f $ok, $review, $script:checks.Count)
    Write-Host "    Every REVIEW line is a candidate entry for the POA&M (docs/POAM.md in the server repo, APP-2026-008)."
    Write-Host "    This is a subset of CIS L1. The full benchmark needs CIS-CAT Lite or Microsoft Policy Analyzer."
    Write-Host ("    Report saved to {0}" -f $reportPath)
} finally {
    Stop-Transcript | Out-Null
}
