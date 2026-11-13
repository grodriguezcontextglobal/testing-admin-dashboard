# Inventario de solo lectura para el diagrama de red (preguntas a IT Masters).
# Ejecutar en PowerShell como administrador. No cambia nada: solo lee.
# Deja un .txt en el Escritorio. Contiene cuentas e IPs: no adjuntarlo tal cual.
# Uso en DEVITRACKAPP (Remote Desktop): git pull en el clon del repo, abrir
# PowerShell como Administrador en deploy\it y ejecutar:
#   powershell -ExecutionPolicy Bypass -File .\inventario-red-vm.ps1
# El pipeline de release NO lo ejecuta: el servidor solo descarga el build.

$out = Join-Path ([Environment]::GetFolderPath('Desktop')) ("inventario-{0}-{1}.txt" -f $env:COMPUTERNAME, (Get-Date -Format 'yyyyMMdd-HHmm'))
$since = (Get-Date).AddDays(-30)

function Section($t) { ''; "==== $t ====" }

& {
  Section 'P2 Equipo, SO e hipervisor'
  Get-CimInstance Win32_OperatingSystem | Select-Object CSName, Caption, Version, LastBootUpTime | Format-List
  Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer, Model, Domain, PartOfDomain | Format-List
  'Host fisico (solo si es Hyper-V):'
  Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Virtual Machine\Guest\Parameters' -ErrorAction SilentlyContinue |
    Select-Object PhysicalHostNameFullyQualified, HostName | Format-List

  Section 'P4/P5 Red: IP, mascara, gateway (LAN GTWY IP), DNS'
  Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } |
    Select-Object InterfaceAlias, IPAddress, PrefixLength | Format-Table -AutoSize
  Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Select-Object InterfaceAlias, NextHop | Format-Table -AutoSize
  Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses } |
    Select-Object InterfaceAlias, ServerAddresses | Format-Table -AutoSize
  'Vecinos en el mismo segmento (ARP): si aparecen muchos equipos, no hay DMZ/VLAN propia'
  Get-NetNeighbor -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.State -in 'Reachable', 'Stale', 'Permanent' -and $_.IPAddress -notmatch '^(224|239|255)\.' } |
    Select-Object IPAddress, LinkLayerAddress, State | Format-Table -AutoSize
  'Archivo hosts (sin comentarios):'
  Get-Content "$env:windir\System32\drivers\etc\hosts" | Where-Object { $_ -and $_ -notmatch '^\s*#' }

  Section 'P1/P7 Puertos en escucha'
  Get-NetTCPConnection -State Listen | Sort-Object LocalPort, LocalAddress |
    Select-Object LocalAddress, LocalPort, @{ n = 'Proceso'; e = { (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName } } |
    Format-Table -AutoSize

  Section 'P1 IIS / NGINX y certificados'
  if (Get-Module -ListAvailable WebAdministration) {
    Import-Module WebAdministration
    Get-Website | Select-Object Name, State, PhysicalPath,
      @{ n = 'Bindings'; e = { ($_.bindings.Collection | ForEach-Object { '{0} {1}' -f $_.protocol, $_.bindingInformation }) -join '; ' } } |
      Format-List
  } else { 'IIS no instalado' }
  'NGINX:'
  Get-Process nginx -ErrorAction SilentlyContinue | Select-Object Id, Path
  Get-Service | Where-Object { $_.Name -match 'nginx' -or $_.DisplayName -match 'nginx' } | Select-Object Name, Status
  'Certificados (My y WebHosting):'
  Get-ChildItem Cert:\LocalMachine\My, Cert:\LocalMachine\WebHosting -ErrorAction SilentlyContinue |
    Select-Object Subject, Issuer, NotAfter, Thumbprint | Format-Table -AutoSize
  'Tareas de renovacion de certificados:'
  Get-ScheduledTask | Where-Object { $_.TaskName -match 'acme|certify|letsencrypt|cert' } | Select-Object TaskName, State

  Section 'P6 RDP: puerto, NLA, alcance del firewall de Windows'
  Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server' | Select-Object fDenyTSConnections | Format-List
  Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' |
    Select-Object PortNumber, UserAuthentication, SecurityLayer | Format-List
  '(UserAuthentication=1 -> NLA activado)'
  Get-NetFirewallRule -Direction Inbound -Enabled True -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayGroup -match 'Remote Desktop|Escritorio remoto' } | ForEach-Object {
      [pscustomobject]@{ Regla = $_.DisplayName; Perfil = $_.Profile; Remoto = (($_ | Get-NetFirewallAddressFilter).RemoteAddress -join ',') }
    } | Format-Table -AutoSize
  'Perfiles del firewall de Windows:'
  Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction | Format-Table -AutoSize

  Section 'P6 Cuentas locales, grupos y politica'
  Get-LocalUser | Select-Object Name, Enabled, LastLogon, PasswordLastSet, PasswordExpires | Format-Table -AutoSize
  'Administradores:'
  Get-LocalGroupMember -SID 'S-1-5-32-544' -ErrorAction Continue | Select-Object Name, PrincipalSource | Format-Table -AutoSize
  'Usuarios de Escritorio remoto:'
  Get-LocalGroupMember -SID 'S-1-5-32-555' -ErrorAction Continue | Select-Object Name, PrincipalSource | Format-Table -AutoSize
  'Politica de contrasenas y bloqueo:'
  net accounts

  Section 'P6 Origen de las conexiones RDP (ultimos 30 dias)'
  'Autenticaciones RDP (evento 1149): IP de origen y usuario'
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational'; Id = 1149; StartTime = $since } -ErrorAction SilentlyContinue |
    ForEach-Object { [pscustomobject]@{ Usuario = $_.Properties[0].Value; IP = $_.Properties[2].Value } } |
    Group-Object IP, Usuario | Sort-Object Count -Descending | Select-Object Count, Name | Format-Table -AutoSize
  'Inicios de sesion fallidos (4625) por IP, top 20: IPs publicas desconocidas = RDP expuesto a internet'
  Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 4625; StartTime = $since } -MaxEvents 20000 -ErrorAction SilentlyContinue |
    ForEach-Object { $x = [xml]$_.ToXml(); ($x.Event.EventData.Data | Where-Object { $_.Name -eq 'IpAddress' }).'#text' } |
    Group-Object | Sort-Object Count -Descending | Select-Object -First 20 Count, Name | Format-Table -AutoSize

  Section 'P3/P4 Conexiones salientes establecidas (destino y proceso)'
  Get-NetTCPConnection -State Established |
    Where-Object { $_.RemoteAddress -notmatch '^(127\.|::1|0\.0\.0\.0)' } |
    Select-Object RemoteAddress, RemotePort, @{ n = 'Proceso'; e = { (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName } } |
    Group-Object Proceso, RemoteAddress, RemotePort | Sort-Object Count -Descending | Select-Object Count, Name | Format-Table -AutoSize

  Section 'P8/P9/P6 Agentes de respaldo, registros y MFA instalados'
  Get-Service | Where-Object { $_.DisplayName -match 'Veeam|Backup|Acronis|Datto|Altaro|Nakivo|Cohesity|Rubrik|nxlog|winlogbeat|Splunk|Wazuh|OSSEC|Datadog|Elastic|Sentinel|CrowdStrike|Duo|Okta|AuthLite|RSA' } |
    Select-Object DisplayName, Status | Format-Table -AutoSize
  'Respaldos de Windows Server Backup:'
  wbadmin get versions 2>&1 | Select-Object -First 15
  'Reenvio de eventos (WEF) configurado:'
  Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\EventLog\EventForwarding\SubscriptionManager' -ErrorAction SilentlyContinue
  'Tamano y retencion de los logs locales:'
  Get-WinEvent -ListLog Security, System, Application | Select-Object LogName, @{ n = 'MaxMB'; e = { [math]::Round($_.MaximumSizeInBytes / 1MB) } }, LogMode, RecordCount, OldestRecordNumber | Format-Table -AutoSize
} *>&1 | Out-File -FilePath $out -Encoding utf8 -Width 300

"Listo: $out"
