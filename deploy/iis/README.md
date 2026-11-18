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

## Dos hosts, un paquete

```
                         ┌─ sitio Admin ─ admin.devitrak.net ─ dashboard de clientes
C:\inetpub\devitrak-admin\current ─┤
                         └─ sitio Ops ─── ops.devitrak.net ─── Admin Console (/platform)
```

Los dos sitios apuntan a la **misma** junction. No hay segundo build, ni
segundo release, ni segunda tarea programada: al cambiar `current` cambian los
dos a la vez, y `state.json` sigue siendo uno solo.

El reparto lo hace `web.config`, que viaja dentro del paquete:

| Petición | Resultado |
|---|---|
| `ops.devitrak.net/` | 302 a `/platform` |
| `ops.devitrak.net/platform/...` | la consola |
| `admin.devitrak.net/platform/...` | 302 a `https://ops.devitrak.net/platform/...` |
| `admin.devitrak.net/...` | el dashboard de siempre |

Un host distinto es un **origen** distinto para el navegador, que es justo lo
que se busca (`DESIGN_platform_console.md` §4, opción B): la sesión, el
`localStorage` y el service worker de la consola no son los de la app de
clientes. Además la consola tiene grupo de aplicaciones y certificado propios,
así que se puede parar, restringir por IP o revocar sin tocar
`admin.devitrak.net`. El backend tiene ese origen como entrada aparte en su
lista de CORS por la misma razón.

**Publicarlo (una vez, por Remote Desktop, como Administrador):**

```powershell
.\Add-ConsoleSite.ps1
```

El sitio de `ops.devitrak.net` **ya existe**: se levantó con el build de
`testing-admin-vite` para probar DNS y SSL, y funciona. Así que el script no
crea nada — **busca el sitio por su binding, no por su nombre**, y solo le
cambia la ruta física a `current`, guardando la anterior en
`previous-ops-physical-path.txt`. Los bindings, el certificado y el grupo de
aplicaciones no se tocan: ya van bien, y cambiarlos es justo la forma de
romper un https que funcionaba. (Si algún día el sitio no existe, el script
sí lo crea, y ahí sí acepta `-CertThumbprint`.)

Desde ese momento el build de `testing-admin-vite` deja de servirse. Su
carpeta se queda donde está; si algo la sigue reconstruyendo, conviene
pararlo para no dejar dos cosas vivas que parecen la misma.

**Antes de reapuntar, el script comprueba que el paquete desplegado trae la
consola**, buscando la ruta `/platform` en los chunks. Un build al que no
llegó `VITE_APP_FEATURE_PLATFORM_CONSOLE` no la contiene — Vite pliega
`import.meta.env.*` a una constante y elimina la rama entera — y eso le pasó a
**todos** los releases hasta el #110, porque el flag no estaba en
`release.yml`. Reapuntar el host a un paquete así dejaría `ops.devitrak.net`
sirviendo un dashboard sin consola, que es peor que no haberlo movido. Por eso
se detiene y dice qué desplegar primero; `-Force` lo salta.

**El orden importa:** primero el despliegue del release nuevo, después el
reapuntado.

Dos cosas que conviene saber:

- **La redirección es 302, no 301.** Una permanente se queda cacheada en el
  navegador de los operadores y no hay forma de retirarla si la consola se
  mueve otra vez. `src/config/webConfigHosts.test.js` falla si alguien la
  "optimiza" a permanente, o si mueve las reglas por debajo del catch-all de
  React Router, que las dejaría sin efecto.
- **El bundle sigue siendo el mismo en los dos sitios.** El host separa los
  orígenes, no el código: `admin.devitrak.net` no sirve `/platform`, pero sus
  chunks siguen dentro del paquete. Separarlos de verdad es el segundo build
  (`platform.html` → `dist-platform/`) que describe el diseño, y no está hecho.
  Quien lea esto buscando esa garantía no la tiene todavía.

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
| Publicar la consola en su host | `.\Add-ConsoleSite.ps1 -CertThumbprint …` (una vez) |
| Cerrar solo la consola | `Stop-Website Ops` — `admin.devitrak.net` sigue arriba |

El servidor guarda las 5 últimas versiones y GitHub, las 15 últimas.

## Volver al esquema anterior

```powershell
Import-Module WebAdministration
$old = Get-Content C:\inetpub\devitrak-admin\previous-physical-path.txt
Set-ItemProperty "IIS:\Sites\Admin" -Name physicalPath -Value $old
Unregister-ScheduledTask "Devitrak Admin - Update from GitHub" -Confirm:$false
```
