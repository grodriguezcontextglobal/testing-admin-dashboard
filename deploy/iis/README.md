# Despliegue del admin dashboard en IIS (DEVITRACKAPP)

## Cómo funciona

```
push a main ─► GitHub Actions (.github/workflows/release.yml)
                 CI (lint, tests, build) ─► build de producción ─► GitHub Release
                                                                   admin-dist.zip + .sha256
                                                                         ▲
DEVITRACKAPP ─ tarea programada cada 5 min ─ Update-AdminSite.ps1 ───────┘
                 ¿release nuevo? → descarga → verifica sha256 → releases\<tag> → current
```

- **Nada entra al servidor.** Es el servidor el que pregunta a GitHub. No hay
  puertos abiertos ni credenciales del servidor en GitHub.
- **El servidor no compila.** No necesita Node ni `npm install`. El build se
  hace en Linux, que además detecta los imports con mayúsculas mal puestas.
- **No hay runner self-hosted** porque el repo es público: un PR de un fork
  podría ejecutar su propio workflow en el servidor.
- **Cambio sin cortes.** IIS sirve `C:\inetpub\devitrak-admin\current`, una
  junction que pasa de una versión completa a otra en un rename.

## Configuración en GitHub (una vez)

1. **Settings → Environments → New environment →** `production`.
2. En ese environment, en **Environment variables**, añade los valores de
   producción:

   | Variable | Obligatoria |
   |---|---|
   | `VITE_APP_DEVITRACK_API` | sí |
   | `VITE_APP_PUBLIC_STRIPE_KEY` | sí (`pk_live_…`, nunca `sk_`) |
   | `VITE_APP_DEVITRACK_API_BACKUP` | no |
   | `VITE_APP_FEATURE_SCOPED_ROLES` | no (`true`/`false`) |
   | `VITE_APP_FEATURE_MEMBER_FEES` | no |
   | `VITE_APP_FEATURE_THEME_SWITCH` | no |
   | `VITE_APP_FEATURE_INVENTORY_SERVER_PAGINATION` | no |

   Son las mismas que hoy tiene el `.env` de la máquina de despliegue. Van como
   *variables*, no como *secrets*: acaban dentro del bundle público de todos
   modos. Si falta una obligatoria o la clave de Stripe es secreta, el build
   falla (`src/config/envValidation.js`) y no se publica nada.
3. Opcional: en el mismo environment, en **Required reviewers**, añade a quien
   deba aprobar cada despliegue. Sin revisores, todo push a main que pase la CI
   llega a producción unos 5 minutos después.
4. **Actions → Release (IIS) → Run workflow** para publicar el primer release.
   Comprueba que en **Releases** aparece `admin-…` con `admin-dist.zip`.

## Configuración en DEVITRACKAPP (una vez, por Remote Desktop)

1. Copia la carpeta `deploy\iis` del repo al servidor, por ejemplo con
   `git pull` en el clon que ya existe.
2. Abre **PowerShell como Administrador** en esa carpeta y ejecuta:

   ```powershell
   .\Install-AdminSiteUpdater.ps1
   ```

   Con una cuenta dedicada en vez de SYSTEM (recomendado):

   ```powershell
   .\Install-AdminSiteUpdater.ps1 -TaskCredential (Get-Credential DEVITRACKAPP\svc-devitrak-deploy)
   ```

3. Comprueba el sitio en el navegador. El instalador ha apuntado el sitio
   `Admin` a `C:\inetpub\devitrak-admin\current` y ha guardado la ruta anterior
   (`C:\Users\CGAdmin\Documents\GitHub\…\dist`) en `previous-physical-path.txt`.

Desde ese momento ya no hace falta `git pull`, `npm install` ni `npm run build`
en el servidor, ni que la carpeta del sitio esté bajo `Documents`, donde
OneDrive bloqueaba `node_modules`.

## Día a día

| Quiero… | Cómo |
|---|---|
| Desplegar | Push a main. Unos 5 min después de que termine el workflow. |
| Ver qué versión hay | `C:\inetpub\devitrak-admin\state.json` |
| Ver qué ha pasado | `C:\inetpub\devitrak-admin\logs\update-AAAA-MM.log` |
| Desplegar ya, sin esperar | En el servidor: `Start-ScheduledTask "Devitrak Admin - Update from GitHub"` |
| Volver a la versión anterior | En GitHub, en el release anterior: **Edit → Set as the latest release**. O, en el servidor: `C:\inetpub\devitrak-admin\bin\Update-AdminSite.ps1 -Tag admin-…` |
| Parar los despliegues | `Disable-ScheduledTask "Devitrak Admin - Update from GitHub"` |

El servidor guarda las 5 últimas versiones y GitHub, las 15 últimas.

## Volver al esquema anterior

```powershell
Import-Module WebAdministration
$old = Get-Content C:\inetpub\devitrak-admin\previous-physical-path.txt
Set-ItemProperty "IIS:\Sites\Admin" -Name physicalPath -Value $old
Unregister-ScheduledTask "Devitrak Admin - Update from GitHub" -Confirm:$false
```
