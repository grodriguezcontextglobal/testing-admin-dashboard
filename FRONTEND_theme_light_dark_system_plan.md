# Plan — tema claro / oscuro / sistema

**Pedido:** estudiar la posibilidad de ofrecer los tres modos.
**Fecha:** 2026-09-04

**Veredicto: viable, y la base es buena.** Existe un archivo de paleta canónico
con 126 tokens sobre `:root`; un bloque oscuro que redefina esos tokens es
exactamente el mecanismo correcto, y vive en **un solo archivo**. El trabajo
real no es la paleta: es MUI, que no tiene tema, y la cola de colores que no
pasan por tokens.

> **Corrección de una versión previa de este plan.** La primera pasada midió
> solo `src/index.css` y concluyó que la capa de tokens era una fachada, que
> había ~86 tokens sin definir y que el asterisco de campo obligatorio no era
> rojo. **Las tres cosas eran falsas.** El archivo canónico es
> `src/styles/untitled-ui/tokens.css`, importado en `main.jsx:9`, y estaba
> fuera de la medición. Los números de abajo son los correctos. La lección
> quedó anotada en §7.

---

## 1. Dónde viven los tokens hoy

| Archivo | Tokens | Rol |
|---|---|---|
| `src/styles/untitled-ui/tokens.css` | **126** | **La paleta canónica.** Deep Blue de marca, azul de acción para CTAs, Ember Red, rampa de grises entibiada. Su cabecera dice que fue reconstruido tras perder el original en una falla de sincronización de OneDrive |
| `src/index.css` | 67 | Nombres heredados y alias (`--danger-action`, `--blue700`, `--disabled-*`) |
| `src/styles/untitled-ui/skin.css` | — | Capa de apariencia, importada después |
| Locales por componente | — | `dropdown.css` (`--ud-*`), `MultiSelectComponent.css` (`--text-color*`), `navbar/style.css` — todos con cadena de respaldo, buena práctica |
| **Total definidos en CSS** | **207** | |

Orden de import en `main.jsx`: `index.css` (8) → `tokens.css` (9) → `skin.css`
(10). El último gana, así que **`tokens.css` es la autoridad** sobre cualquier
nombre repetido en `index.css`.

## 2. Cuánto color ya pasa por tokens

| Medición | Valor |
|---|---|
| Hex en JSX (inline styles) | 1.545 — **971 son el respaldo** de un `var()` |
| Hex en CSS | 1.113 — **839 son respaldo** |
| Color ya manejado por tokens | **1.810 / 2.658 · 68 %** |
| Hex distintos en JSX | 177; los 12 más usados cubren la mitad |
| Tokens distintos referenciados | 149 |
| Archivos CSS | 82 |

Dos tercios del color de la app ya pasa por `var()`. Redefinir tokens los
cambia a todos, y por eso esto es viable.

## 3. Los respaldos azules son documentación muerta, no un conflicto

Muchos sitios escriben `var(--gray-600, #475467)` — el gris azulado de Untitled
UI — mientras `tokens.css` define `--gray-600: #5d615a`, el gris entibiado. **El
respaldo nunca se aplica**, porque el token está definido: hoy esos sitios ya
pintan el gris entibiado.

O sea que **no hay dos rampas compitiendo**. Hay una rampa canónica y ~450
respaldos obsoletos que sugieren la equivocada a quien lea el código. Eso no
bloquea nada del tema oscuro; es limpieza que conviene hacer *después*, cuando
sea puramente mecánica.

Corolario: **el asterisco de campo obligatorio sí es rojo.** `--error-700:
#9a3922` está definido, `--danger-action` resuelve, y el marcador se pinta en
Ember Red — no en el `#b42318` que puso el respaldo, pero rojo.

## 4. Bugs reales encontrados de paso · **arreglados**

Dos, de un carácter cada uno, y los dos hacían que una propiedad se descartara:

- `signatureVerificationDocuments/StaffMember.jsx:403` — `var(--danger-action`
  **sin cerrar el paréntesis**. El borde de error del campo de contraseña era
  una declaración inválida y no se pintaba.
- `consumers/components/UI/ExpandedLostButtons.jsx:218` —
  `var(--disabled0gray-button-text)`, un `0` donde va un `-`. El token correcto
  existe; el texto del botón deshabilitado heredaba en vez de atenuarse.

No hay más: **cero tokens usados sin respaldo que no estén definidos en algún
CSS.**

---

## 5. El trabajo que sí queda

### Fase 1 — el interruptor

- **`tokens.css` recibe el bloque oscuro.** La convención a respetar: `:root`
  mantiene la paleta clara completa; `@media (prefers-color-scheme: dark)`
  guardado como `:root:not([data-theme="light"])` redefine **solo tokens**; y
  `:root[data-theme="dark"]` los redefine otra vez para que la elección
  explícita gane en los dos sentidos. **"Sistema" es el estado sin atributo.**
- **`color-scheme`** en `index.css:12` dice hoy `light` con un comentario
  explicando que `light dark` daba controles oscuros del sistema en una app
  clara. Con tema real pasa a seguir al tema resuelto, y ese comentario deja de
  aplicar.
- **antd**: barato. `ConfigProvider` ya está en `main.jsx:91` y su `antdTheme`
  ya deriva de esta paleta (ver el comentario en `main.jsx:53`). antd v5 acepta
  `algorithm: theme.darkAlgorithm`.
- **MUI: el trabajo real.** No hay **ningún** `ThemeProvider` en el proyecto.
  Todo componente MUI —`OutlinedInput`, `Grid`, `Typography`— usa la paleta
  clara por defecto de MUI. Sin agregar uno con `mode` atado al tema resuelto,
  la mitad visible de los formularios queda clara mientras el resto se oscurece.
- Limpieza gratis: `@media (prefers-color-scheme: light)` en `index.css:204` es
  el sobrante de la plantilla de Vite (`#213547`, `#747bff`).

**Dónde se guarda la preferencia:** `localStorage`, porque es por dispositivo.
**No en `SESSION_STORAGE_KEYS`** (`src/api/sessionHeaders.js`) — esa lista se
borra en cada logout y el usuario elegiría el tema en cada entrada.

### Fase 2 — los valores oscuros hay que diseñarlos

126 tokens necesitan contraparte oscura **elegida**. Invertir el claro da grises
sucios y contrastes ilegibles, y acá el color carga significado: rojo =
faltante, verde = contado, ámbar = pendiente. Los tres tienen que seguir
leyéndose como lo que son sobre fondo oscuro, con contraste suficiente. Es
trabajo de diseño previo al código.

Un primer pase de ingeniería sirve para *evaluar* —ver la app oscura y reaccionar—
pero no es la paleta final.

### Fase 3 — `components/UX/` y después el barrido

Los ~848 hex que **no** son respaldo de un `var()` son la cola larga. Primero
`components/UX/` (`BaseTable`, `ModalUX`, botones, inputs, `ProfileShell`),
porque tokenizando el sistema de diseño la mayoría de las pantallas sigue sola.
Después por dominio, usando ese conteo como métrica de avance.

---

## 6. Guarda que conviene, decidan lo que decidan

Un test que **cuente los hex crudos y falle si crecen**, como este repo congela
`ALL_ROLES` y audita el contrato de API. Puede además fijar dos invariantes que
esta revisión estableció:

- **cero tokens usados sin respaldo que no estén definidos en algún CSS** — es
  la condición que atrapa los dos typos del §4 y cualquier futuro;
- **ningún alias de token sin respaldo** (`--x: var(--y)` a secas). Un alias a
  un token indefinido es peor que un literal: el alias está definido, así que
  el respaldo de todos sus consumidores queda desactivado y la propiedad
  computa inválida. Hoy hay cuatro alias así en `index.css` y funcionan solo
  porque su destino existe en `tokens.css`.

---

## 7. La lección de método

La primera pasada de este estudio midió `src/index.css` —lo que `CLAUDE.md`
nombra como el lugar de las variables CSS— y no buscó otros archivos de tokens.
Con eso concluyó que faltaban ~86 definiciones y que había un bug en el
asterisco. Ninguna de las dos cosas era cierta: `tokens.css` estaba ahí,
importado, con 126 definiciones.

Peor, actuó sobre esa conclusión: agregó 50 tokens a `index.css`, de los cuales
**41 ya existían** en `tokens.css` y **13 con valores distintos**, incluido
`--primary-600`, que el equipo había remapeado a propósito del violeta de
Untitled al azul de marca. No llegó a verse porque `tokens.css` se importa
después y gana — por orden de import, no por diseño. Está revertido.

**Antes de concluir que un símbolo no está definido, buscarlo en todo el árbol,
no en el archivo donde se supone que vive.** Es la misma regla que el repo ya
tiene escrita para Graphify —verificar qué resolvió antes de sacar
conclusiones— aplicada a CSS.

---

## 8. Orden y quién decide

| # | Qué | Quién | Estado |
|---|---|---|---|
| — | Los dos typos del §4 | frontend | ✅ hecho |
| 1 | Bloque oscuro en `tokens.css` + `data-theme` + antd + `ThemeProvider` de MUI + interruptor | frontend | siguiente |
| 2 | Paleta oscura definitiva de 126 tokens | **diseño** | espera ver la Fase 1 |
| 3 | `components/UX/` y barrido por dominio | frontend | espera 2 |
| — | Test de guarda de literales y alias | frontend | propuesto |
| — | Limpiar ~450 respaldos obsoletos que nombran la rampa vieja | frontend | mecánico, sin apuro |

Nada está bloqueado por una decisión de producto. La Fase 1 se puede construir
y mirar; la Fase 2 se decide **con la Fase 1 en pantalla**, que es la única
forma sensata de elegir 126 colores.
