# Las 125 alertas de Dependabot: qué son y en qué orden se cierran

> **Fecha:** 2026-09-23
> **Origen:** aviso de GitHub al hacer push a `main` — *"125 vulnerabilities (54
> high, 62 moderate, 9 low)"*.
> **Datos:** `npm audit` dentro del contenedor (`node 20.19.5`, `npm 10.8.2`),
> sobre el `package-lock.json` de este commit. La lista exacta de Dependabot no
> se pudo leer: el token de `gh` tiene `repo` pero no `security_events`, y la
> API contesta 403. Se arregla con
> `gh auth refresh -h github.com -s security_events`.
> **Estado:** actualizado 2026-09-24 — dos tandas hechas, **128 → 67**.

---

## 0. Dónde va esto

| Tanda | Estado | Advisories | Commit |
|---|---|---|---|
| 1a — directos del navegador, en rango | **hecha** | 55 | `fd6a95ed` |
| 1b — `postcss`, `vitest`, `@vitest/coverage-v8` | **hecha** | 6 | `a1cb0e62` |
| 1b — los 13 transitivos que faltan | **bloqueada**, ver §2 | 49 | |
| 2 — `xlsx` + `react-quill-new` | pendiente, **ahora va primero** | 2 | |
| 3 — `override` de `uuid` | pendiente | 1 | |
| 4 — las majors | pendiente | 15 | |

Las dos hechas se verificaron contra una línea base tomada antes de tocar
nada: 207 ficheros, 4036 tests, build en 4m34s con 8273 KiB de precache.
Después: los mismos 4036 en verde y el build en pie.

Lo que sigue abierto y llega al navegador son 6 advisories: 2 de
`react-router` que solo cierra la v7, 1 de `xlsx`, 1 de `quill`, 1 de `uuid`
y 1 de `echarts`.

## 1. No son 125 cosas. Son 41

| | |
|---|---|
| Alertas que cuenta Dependabot | 125 |
| Advisories distintos que ve `npm audit` | 128 |
| **Paquetes vulnerables** | **41** |
| De ellos, declarados directamente en `package.json` | 16 |

Dependabot abre **una alerta por advisory**; `npm audit` agrupa por paquete. Por
eso 125 y 41 describen lo mismo. La diferencia de 128 contra 125 son advisories
que Dependabot todavía no ha ingerido o alertas ya descartadas en la interfaz —
no cambia nada del plan.

Dos paquetes explican casi la mitad del número: **axios (28 advisories)** y
**dompurify (18)**. Los dos se arreglan subiendo dentro del rango que ya tiene
`package.json`. El titular de 125 es, en buena parte, dos `npm install`.

---

## 2. El obstáculo, y por qué reordena el plan

**`npm update` y `npm audit fix` no corren en este repositorio.**

```
npm error Cannot read properties of null (reading 'edgesOut')
```

Comprobado 2026-09-24, y ya no es una hipótesis. Quitando del manifiesto la
única entrada rara:

```json
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz"
```

el mismo comando funciona:

```
change minimatch 3.1.2 => 3.1.5
added 104 packages, removed 1 package, and changed 8 packages in 5s
```

Con el tarball por URL, npm no sabe resolver el árbol. Sin él, sí.

`npm install` **no** está afectado, que es como se hicieron las dos tandas ya
cerradas. Lo que queda bloqueado son los transitivos: no se pueden subir con un
`install` sin convertirlos en dependencias directas, y la alternativa es llenar
`package.json` de `overrides`.

**Consecuencia para el plan:** `xlsx` estaba en la tanda 2 por su propio ReDoS.
Resulta que además es la llave de los 49 advisories que quedan en rango. **Pasa
a ir primero.**

## 3. Lo que llega al navegador y lo que no

Esto es una SPA. Lo que se compila al bundle y lo que solo corre en la máquina
que construye o prueba no son el mismo riesgo, y el número de GitHub los mezcla.

| | Paquetes | Advisories |
|---|---|---|
| **Llegan al navegador** | 14 | **61** |
| Solo build y test | 27 | 67 |

**Llegan al navegador** (comprobado por los imports que hay en `src/`):

| Paquete | Sev | Advisories | Dónde se usa |
|---|---|---|---|
| `axios` | high | 28 | 3 ficheros, vía `devitrakApi.jsx` |
| `dompurify` | moderate | 18 | `posts/components/DisplayArticle.jsx` |
| `react-router-dom` → `react-router`, `@remix-run/router` | high | 6 | 197 ficheros |
| `lodash` | high | 3 | 58 ficheros |
| `echarts` + `echarts-for-react` | moderate | 1 | 9 ficheros |
| `xlsx` | high | 1 | 11 ficheros |
| `react-quill` → `quill` | moderate | 1 | `NewPost.jsx`, `EditPost.jsx` |
| `exceljs` → `uuid` | moderate | 1 | 3 ficheros, con `import()` dinámico |
| `nanoid` | high | 2 | transitivo |

**Solo build y test** — `vite`, `vite-plugin-pwa`, `postcss`, `esbuild`,
`cypress`, `vitest`, `@babel/core`, `undici` (13), `brace-expansion` (10),
`minimatch` (6), `fast-uri` (6), `js-yaml` (5), `qs` (4), `browserslist`,
`extract-zip`, `sharp`, `tmp`, `form-data`, `follow-redirects`, `flatted`,
`ajv`, `yaml`, `baseline-browser-mapping`.

No son irrelevantes: quien compila esto es una máquina con credenciales de
despliegue, y varias de esas son ejecución de código o lectura de ficheros
arbitrarios. Pero no son lo que un usuario del dashboard puede tocar, y por eso
van después.

Dos matices, para no exagerar el 61:

- De los 28 de **axios**, buena parte son del adaptador de Node —proxies,
  `NO_PROXY`, redirecciones— que en el navegador no se usa. Los de prototype
  pollution sí aplican. Da igual para el plan: un bump los cierra todos.
- **`follow-redirects`** entra por axios, pero solo por su camino de Node. En el
  navegador axios usa XHR y ese paquete no se ejecuta.

---

## 4. Tres trampas en la salida de `npm audit`

Hay que leerlas antes de aplicar nada de lo que sugiere.

### `npm audit` propone dos *downgrades* disfrazados de arreglo

```
exceljs       instalado ^4.4.0   "fix" exceljs@3.4.0   ← es bajar una major
react-quill   instalado ^2.0.0   "fix" react-quill@0.0.2 ← es bajar a la prehistoria
```

npm imprime la versión más nueva **sin advisory**, y cuando la última publicada
está afectada, eso es una versión vieja. Aplicarlos con `--force` sería cambiar
una vulnerabilidad por una regresión. Los dos necesitan otra salida: la tanda 2
y la tanda 3 de §5.

### `xlsx` dice `fixAvailable: false`, y sí hay arreglo

No lo ve porque no viene de npm. SheetJS se fue del registro; el paquete está
clavado en el tarball `0.20.1` de su CDN. El ReDoS (`GHSA-5pgg-2g8v-p4x9`) está
corregido aguas arriba. **El arreglo es cambiar la URL a la versión actual**, no
existe ningún `npm update` que lo haga.

### El manifiesto llama "producción" a la cadena de build

`vite`, `vite-plugin-pwa` y `@vitejs/plugin-react` están en `dependencies`, no en
`devDependencies` — 55 dependencias de runtime contra 15 de desarrollo. Eso hace
que `npm ls --omit=dev` arrastre `esbuild`, `browserslist`, `sharp` y compañía, y
que Dependabot las cuente como dependencias de producción. No es una
vulnerabilidad; es la razón por la que la cifra asusta más de lo que debe.

---

## 5. Plan de acción

La forma del problema, antes de las tandas:

| | Paquetes | Advisories |
|---|---|---|
| **Se arreglan dentro del rango que ya permite `package.json`** | 26 | **112** |
| Necesitan un cambio de major | 14 | 15 |
| Sin versión que arregle en npm (`xlsx`) | 1 | 1 |

**112 de 128 no necesitan decidir nada.** Son versiones que el `^` del
manifiesto ya autoriza y que el lockfile tiene congeladas en una anterior. Eso
es lo que normalmente haría `npm audit fix`, y es justo lo que aquí no corre
(§2), así que se hace a mano.

Cuatro tandas, un commit cada una, y la suite entre tanda y tanda: lo que rompe
un bump lo rompe en los tests, no en la revisión del diff. Todo dentro del
contenedor, y **cada tanda que toque `package.json` pide reconstruir la imagen**
(`Dockerfile.dev`; `node_modules` vive en un volumen anónimo).

### Tanda 1a — los directos, dentro de rango. 57 advisories, todos del navegador

```bash
docker compose exec devitrak-client npm install \
  axios@^1.20.0 \
  dompurify@^3.4.16 \
  lodash@^4.18.1 \
  react-router-dom@^6 \
  echarts-for-react@latest
```

Cierra los 28 de axios, los 18 de dompurify, los 6 de la cadena de
`react-router`, los 3 de lodash y los 2 de nanoid. Ninguno cambia de major.
`react-router-dom` se queda en 6: hay parche dentro de la major instalada, y
saltar a 7 es otra conversación.

`npm run build` y la suite completa. Aquí es donde acaba lo que un usuario del
dashboard puede alcanzar por esta vía.

### Tanda 1b — los transitivos, dentro de rango. 55 advisories de build

```bash
docker compose exec devitrak-client npm update
docker compose exec devitrak-client npm audit
```

`undici` (13), `brace-expansion` (10), `minimatch` (6), `fast-uri` (6),
`js-yaml` (5), `postcss`, `browserslist`, `form-data`, `tmp`, `flatted`, `ajv`,
`yaml`, `vitest`, `@babel/core`. Nadie los importa desde `src/`: entran por la
cadena de compilación y prueba. `npm update` respeta los rangos, así que es un
cambio de lockfile, no de manifiesto — pero es el que más líneas mueve, y por eso
va en su propio commit.

### Tanda 2 — los dos que no se arreglan con un número

Van juntos porque tocan código, no el manifiesto.

1. **`xlsx`**: subir la URL del CDN de SheetJS a la versión vigente. 11 ficheros
   la importan; la API no cambió entre 0.20.x, así que el riesgo es de
   instalación, no de código.
2. **`react-quill` → `react-quill-new@^3.8.3`**: el fork mantenido, sobre Quill
   2. `react-quill` sigue clavado en 2.0.0 con `quill@^1.3.7` y no se mueve desde
   hace años. Son dos ficheros, `NewPost.jsx` y `EditPost.jsx`, y hay que mirar
   los estilos: Quill 2 cambió algunas clases del tema `snow`.

### Tanda 3 — `exceljs` y `uuid`, con `overrides`

`exceljs@4.4.0` es la última publicada y arrastra el `uuid` afectado. No hay
versión a la que subir. La salida es forzar el transitivo:

```jsonc
"overrides": { "exceljs": { "uuid": "^11" } }
```

Se usa con `import()` dinámico en tres ficheros de inventario, así que la
verificación es exportar un XLSX y abrirlo. Si `uuid@11` rompe `exceljs`, la
alternativa honesta es dejarlo documentado y esperar: el advisory es un `buf`
sin comprobar en `v3/v5/v6`, y `exceljs` no lo llama con `buf`.

### Tanda 4 — las majors. 13 advisories, todas de la máquina que compila

```
vite            5 → 8    la que más arrastra (esbuild, rollup)
vite-plugin-pwa 0.20 → 1 acoplada a la de vite, y con ella sharp
cypress         13 → 15  solo E2E; se lleva extract-zip y qs
echarts         5 → 6    9 ficheros — revisar la API de series
```

Van al final porque ninguna la alcanza un usuario del dashboard, y porque
`vite` 5→8 es el único cambio de esta lista capaz de tumbar el build un día
entero. Sola, con la suite y un `npm run build` delante.

### Y de paso, gratis

Mover `vite`, `vite-plugin-pwa` y `@vitejs/plugin-react` a `devDependencies`.
No cierra ninguna alerta, pero deja de contar como producción lo que no lo es, y
la próxima vez el número de GitHub querrá decir algo.

## 6. Qué queda abierto después de las cuatro tandas

- **El scope de `gh`.** Sin `security_events` no se puede leer la lista real de
  Dependabot ni comprobar que las 125 bajaron. Este documento está construido
  sobre `npm audit`, que mira el mismo lockfile pero cuenta distinto.
- **Nada de esto se ha ejecutado.** El informe es de lectura: `npm audit`,
  `npm view` y los imports de `src/`. Ninguna dependencia se tocó.
- **La hipótesis de `edgesOut`** (§2), que decide si `npm audit fix` vuelve a
  ser una herramienta usable aquí.

---

## 7. Resumen en una tabla

| Tanda | Qué | Advisories | Riesgo del cambio |
|---|---|---|---|
| 1a | Bumps directos dentro de rango | 57 | bajo |
| 1b | `npm update` de transitivos | 55 | bajo, mucho lockfile |
| 2 | `xlsx` (CDN) + `react-quill-new` | 2 | medio, toca código |
| 3 | `override` de `uuid` en `exceljs` | 1 | bajo, verificar export |
| 4 | `vite`, `cypress`, `echarts`, PWA | 13 | alto, pero no lo ve un usuario |

**128 de 128.** Y lo que un usuario del dashboard puede alcanzar se cierra en la
1a y la 2 — 59 advisories, ningún cambio de major, un día de trabajo. Las 68 que
quedan son de la máquina que compila y prueba, y ese es el orden correcto aunque
el contador de GitHub sugiera lo contrario.
