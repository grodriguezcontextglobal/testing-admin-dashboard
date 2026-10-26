# Reporte de fases — frontend, al 2026-09-18

> **Alcance:** todas las iniciativas del dashboard que se planificaron por fases.
> **Corte:** último commit en `main` — `68a67552` (2026-09-17).
> **Qué NO cubre:** las fases que viven en el repo `server-testing`. Donde una
> iniciativa tiene mitad backend y mitad frontend, aquí sólo se reporta nuestra
> mitad, y se dice explícitamente.

---

## 0. Cómo leer este reporte

Tres estados, y la diferencia entre el segundo y el tercero es la que importa
en la reunión:

| Marca | Significa |
|---|---|
| ✅ **En producción** | Hecho, desplegado y visible para el usuario hoy. |
| 🟦 **Hecho, detrás de flag** | Código terminado, probado y en `main`. El usuario **no lo ve** porque el feature flag está apagado, casi siempre esperando un despliegue de backend. |
| ⬜ **Pendiente** | No empezado o empezado sin cerrar. |

El grueso del trabajo de las últimas cuatro semanas está en 🟦, no en ✅. No es
trabajo a medias: es trabajo terminado esperando a que el backend publique los
endpoints que consume. Esa es la lectura principal del reporte.

---

## 1. Resumen ejecutivo

| # | Iniciativa | Fases cerradas | Pendientes | Estado |
|---|---|---|---|---|
| 1 | Paginación de inventario en servidor | 5 de 8 | 6, 6b, 7 | 🟦 flag OFF |
| 2 | Roles con alcance (location / category) | A, B, C | R3 (reconciliación) | 🟦 flag OFF |
| 3 | Cola de tareas — contrato `202 + jobId` | 1–3 absorbidas | — | ✅ producción |
| 4 | Vertical escolar | 1 (parcial), 2 (B3) | B1, B2, Fase 3 | mixto |
| 5 | Migración fuera del endpoint raw-SQL | 1–4 (inferido) | 5, 6 | ✅ parcial |
| 6 | Conteo de cierre por identificador (RFID) | lado cliente | fases backend | 🟦 |
| 7 | Tema claro / oscuro / sistema | 1 | 2, 3 | 🟦 flag OFF |
| 8 | Despliegue coordinado con backend | Tandas 1 y 3 | Tanda 2 | en curso |

**Volumen del período:** 472 commits desde el 2026-07-01 (219 en julio, 188 en
agosto, 65 en septiembre a día 17). Suite unitaria: **194 archivos, 3.851 tests,
todos en verde** *(ejecución real en el contenedor, 2026-09-18)*.

---

## 2. Paginación de inventario en servidor

**Documento:** `FRONTEND_inventory_pagination_migration_plan.md`
**Flag:** `VITE_APP_FEATURE_INVENTORY_SERVER_PAGINATION` — OFF por defecto.

| Fase | Qué era | Estado |
|---|---|---|
| 1 | Borrar el camino legacy | ✅ hecha (independiente del deploy) |
| 2 | Contrato puro y claves de caché (`inventoryPageContract.js`) | ✅ hecha |
| 3 | El camino nuevo detrás de un flag | ✅ hecha |
| 4 | Filtros y búsqueda al servidor | ✅ hecha, detrás del flag |
| 5 | Columnas (`serverSorted`, `sortBy`, `sortDir`) | ✅ hecha, detrás del flag |
| 6 | Quitar el scope del cliente (`allowedLocations`, categoría) | ⬜ |
| 6b | El export XLSX como job de cola | ⬜ |
| 7 | Limpieza post-deploy (quitar flag y rama vieja) | ⬜ |

**Por qué el flag sigue apagado:** los tres endpoints que consume —
`inventory-page`, `inventory-facets`, `serial-suggest` — responden 404 en
producción hoy. El flag es justamente lo que permitió que toda la migración
aterrizara en `main` sin que la pantalla dependa de un despliegue que no
controlamos.

**Lo entregado además de las fases**, en la misma tanda de trabajo:

- Export del inventario completo mientras el servidor pagina la tabla (`13dff7b6`).
- Diez filas por página en la tabla y en la tarjeta de Locaciones / Sub-locaciones
  (`a828ff9d`, `fe0c4ae0`).
- La espera de cada tabla usa la animación de marca, no el spinner de antd
  (`e67e57bc`, `cf5b9a38`).
- El filtro de Estado tenía su propio diccionario y estaba incompleto (`2d6aa61f`);
  los estados del artículo no son los del evento (`5c2774e3`); "in-idle" pasa a
  llamarse "At event", el nombre que usa el resto de la aplicación (`308f1785`).

---

## 3. Roles con alcance (location / category)

**Documentos:** `FRONTEND_scoped_roles_phaseA_plan.md`,
`FRONTEND_INTEGRATION_scoped_roles.md`, `FRONTEND_location_category_roles.md`
**Flag:** `VITE_APP_FEATURE_SCOPED_ROLES` — OFF por defecto.

| Fase | Qué era | Estado |
|---|---|---|
| A | Groundwork de frontend, flag OFF | ✅ cerrada y en `main` |
| B | Wire-up contra el backend (§5.3 / §5.4) | ✅ cerrada |
| C | Lanzamiento (requiere enforcement backend en vivo) | ✅ código cerrado |

Lo que entró en Fase A y sostiene el resto: cuatro `roleType` nuevos
(`inventory_location_manager`, `inventory_location_assistant`, `category_manager`,
`category_assistant`), `ROLE_SCOPE` / `getRoleScopeDimension`,
`ScopeAssignmentSelect` con guardia *fail-closed* de ≥1 selección, el hook
`useCompanyCategories`, y la capa de reconocimiento (etiquetas, grupos
renombrables, bloqueo de la pestaña Roles para staff con alcance).

**Protección arquitectónica a no perder:** `ALL_ROLES` en `src/config/roles.js`
es un array explícito de 12 strings congelado con `Object.freeze` y con un test
que lo fija. No puede volver a ser `Object.values(ROLE_TYPES)` — si vuelve, los
roles con alcance heredan en silencio todos los permisos generales.

**Lo que queda abierto:** R3, qué almacén de locación manda para los roles 6/7
— el `preference.managerLocation` heredado en Mongo o el scope nuevo en SQL.
`c995425f` ya hace que el cliente respete el scope que la pantalla de asignación
escribe de verdad, y `adcf1c24` deja escrito que R3 es una condición para
encender el flag, no un detalle de implementación.

**Nota operativa:** el flag de producción es una variable de entorno del pipeline
de build, no un default en código. Encenderlo exige setearla ahí y volver a
desplegar.

---

## 4. Cola de tareas — contrato `202 + jobId`

**Documento:** `FRONTEND_task_queue_changes.md` (Fases 1–3 del backend).
**Estado: ✅ absorbido, en producción.**

El backend movió ~37 endpoints de `201` síncrono a `202 Accepted` con `jobId` y
sondeo. La infraestructura compartida que lo resuelve —
`store/slices/backgroundJobsSlice.js` + `components/backgroundJobs/BackgroundJobsTracker.jsx`,
montado globalmente en `App.jsx` — sondea `GET /jobs/owned/:jobId` cada 3 s hasta
`done | failed | dead`.

| Sección | Veredicto |
|---|---|
| §1 Aceptación global del 202 | ✅ sin comprobaciones estrictas `=== 201` en `src` |
| §2 Emails | ✅ copy "queued" ya en su sitio |
| §3 Logs | ✅ sin lectores de la respuesta síncrona |
| §4 Subida de PDF (`/document/upload`) | ✅ **arreglado** — sondeo local, `0db88893` |
| §6 Import XLSX | ✅ ya usaba el patrón de cola |
| §7 Stripe | ✅ nada que cambiar por contrato |
| §10.1 / §10.2 Bulk edits | ✅ ambos usan `jobId` + tracker |

---

## 5. Vertical escolar

**Documento:** `FRONTEND_school_vertical_plan.md`
**Flag (fees):** `VITE_APP_FEATURE_MEMBER_FEES` — OFF por defecto.

| Fase | Ítem | Estado |
|---|---|---|
| 1 | A1 · módulo de miembros dirigido por perfil de industria | 🟡 parcial |
| 1 | A2 · borrar `Lost.jsx` muerto | 🟡 |
| 1 | A3 · persistencia de `roleLabels`, upsert de staff por email | 🧱 pendiente backend |
| 2 | B1 · cobros por pérdida / daño en la devolución | 🟦 detrás de flag |
| 2 | B2 · log de auditoría real | 🔴 |
| 2 | B3 · devolución masiva de fin de curso | ✅ **ya existía** |

B3 es el hallazgo del período: `OverdueDevicesTable.jsx` ya ofrecía el panel de
préstamos vencidos con filtro por grado, recordatorios al tutor por fila y en
bloque, y devolución masiva de fin de trimestre vía `POST /db_member/bulk-return`.
No hacía falta construirlo.

**Fase 3 (estructura escolar y acceso por alcance) — sin empezar:** periodo
académico como entidad de primera clase, scope por aula/grado reutilizando la
infraestructura de las Fases B/C de roles, y reportes por grado/aula/periodo.

**Entregado en el período aunque fuera de la numeración de fases:** borrar un
miembro desde su propia ficha (`9932b19d`), la píldora de consentimiento dejó de
acusar a compañías que no piden consentimiento (`f207a7fc`), recibos con logo y
firmas y recordatorios que dicen quién los envió (`97f9ac3a`), y una escritura
rechazada dejó de pasar por entrega completada (`0a70a3bd`).

---

## 6. Migración fuera del endpoint raw-SQL

**Documentos:** `FRONTEND_inventory_migration_plan.md` (ejecución),
`FRONTEND_raw_sql_endpoint_migration.md` (contratos).

El endpoint `/db_event/inventory-based-on-submitted-parameters` ejecuta SQL
crudo recibido en el body. Se retira por fases, sin día D: el endpoint viejo
sigue funcionando todo el tiempo.

**Quedan 4 call sites en 3 archivos:**

- `src/pages/staff/components/DownLoadReportButton.jsx` → Fase 5 (staff)
- `src/pages/consumers/action/ModalReturnItem.jsx` → Fase 6 (devolución de evento)
- `src/pages/events/.../useInsertDeviceIntoEventTableRecord.jsx` → Fase 6

> **Advertencia de método:** las Fases 1–4 se dan por migradas *porque no queda
> ningún call site suyo*, no porque el plan lleve marca de cerrado. Es una
> inferencia sólida pero es una inferencia; si el reporte se usa para cerrar las
> fases formalmente, conviene confirmarlo call site por call site.

---

## 7. Conteo de cierre por identificador (RFID OR2505)

**Documentos:** `DESIGN_rfid_event_count.md`, `FRONTEND_rfid_event_count_*.md`

Las fases numeradas (0 a 5) son **del backend**, en el repo `server-testing`, y
no se reportan aquí. Al 2026-09-02 ese plan tenía las fases 2, 3 y 4
implementadas y la migración `item_identifier` escrita pero sin aplicar.

**Nuestra mitad está cerrada:** el lado cliente del contrato de conteo
(`f7aeb697`), el evento se cuenta antes de permitir cerrarlo (`40701e6d`), leer
un volcado de escáner masivo venga con la forma que venga (`e25f4b0d`), y el
intercambio de diseño que fijó la estrategia quedó escrito (`099a199d`).

---

## 8. Tema claro / oscuro / sistema

**Documento:** `FRONTEND_theme_light_dark_system_plan.md`
**Flag:** `VITE_APP_FEATURE_THEME_SWITCH` — OFF por defecto.

| Fase | Qué era | Estado |
|---|---|---|
| 1 | El interruptor + bloque oscuro en `tokens.css` | 🟦 hecha, aparcada tras el flag (`51254740`) |
| 2 | Diseñar los 126 tokens oscuros | ⬜ |
| 3 | `components/UX/` y después el barrido de ~848 hex | ⬜ |

La Fase 2 no es trabajo de código sino de diseño: invertir la paleta clara da
grises sucios y contrastes ilegibles, y aquí el color carga significado.

Con el flag apagado el conmutador no se renderiza **y** el tema resuelto se
fuerza a claro. Eso último importa más de lo que parece: quien probó el modo
oscuro antes de aparcarlo tiene `"dark"` guardado en su `localStorage`, y ocultar
sólo el botón lo dejaría atrapado en un tema a medio hacer sin forma de volver.

De paso entró la deuda que lo hacía posible: los colores pasan por tokens y la
tinta se nombra por su función (`db8a8e48`), más dos typos de un carácter que
tiraban una propiedad en silencio (`5c3f1860`).

---

## 9. Despliegue coordinado con backend

**Documento:** `FRONTEND_deploy_readiness_2026-09-17.md`

| Tanda | Contenido | Estado |
|---|---|---|
| 1 | Las tres rutas nuevas de inventario | ✅ desbloqueada — no pedimos nada |
| 2 | Cambios de ruptura | ⏳ **esperando nuestra precondición** |
| 3 | Pagos | ✅ desbloqueada 2026-09-17 |

**Tanda 2 — lo único que bloquea:** el build de producción del dashboard con
`2b1cbe93` tiene que estar publicado. El código está en `main`; falta publicarlo.
En cuanto esté, el backend despliega cuando quiera y nosotros corremos un smoke
test de quince minutos el mismo día: renombrar locación y sub-locación, repetir
**después de cambiar de compañía** (ese era exactamente el caso que producía el
400 nuevo), borrar un path de sub-locación, y abrir un consumidor con su fila
desplegada.

**Tanda 3 se cerró con dos hallazgos que valen la pena en la reunión:**

1. El 409 sí nos llega, y `21896b77` era el arreglo correcto: un 409 significa
   que el cargo sigue decidiéndose, no que falló.
2. La mentira del modal **ya ocurre hoy** — una captura duplicada llega a Stripe,
   que la rechaza por PI ya capturado, y la pantalla dice que no se cobró cuando
   la primera sí cobró. Es un bug vivo, no uno que traiga su despliegue.
   `47cb253f` lo cierra con `Idempotency-Key` por `<operación>:<paymentIntent>`
   en captura, liberación y reembolso completo. El reembolso parcial va sin clave
   **a propósito**: dos dispositivos perdidos de la misma transacción son dos
   reembolsos legítimos del mismo importe.

---

## 10. Riesgos y cabos abiertos

1. **Casi todo lo terminado está invisible.** Cuatro flags apagados
   (paginación, roles con alcance, fees de miembros, tema). El valor entregado no
   se convierte en valor percibido hasta que el backend despliegue y se enciendan.
2. **R3 sigue sin respuesta** y es la condición para encender los roles con
   alcance: qué almacén manda para la locación, el Mongo heredado o el SQL nuevo.
3. **D1 — SQL ↔ NoSQL sin fuente única de verdad.** Es la raíz de los problemas
   de `roleType` en login, staff duplicado y persistencia de `roleLabels`. El
   riesgo más alto a largo plazo dado que hay datos de menores de por medio.
4. **Fase 2 del tema está bloqueada por diseño, no por desarrollo.** Necesita que
   alguien elija 126 valores.
5. **B2 — log de auditoría real** sigue sin empezar, y es lo que un colegio
   pregunta primero.

---

## 11. Un defecto encontrado al preparar este reporte — ✅ corregido

`.env.dev.example` declaraba el mismo flag dos veces, con valores opuestos:

```
línea 58:  VITE_APP_FEATURE_INVENTORY_SERVER_PAGINATION=false
línea 61:  VITE_APP_FEATURE_INVENTORY_SERVER_PAGINATION=true
```

Ganaba la última, así que la plantilla que copia todo el equipo entregaba el flag
de paginación **encendido**, contra tres endpoints que responden 404 en
producción. Contradecía directamente lo que documenta `featureFlags.js`: quien
clonara el repo y siguiera el onboarding arrancaba con la tabla de inventario
rota y sin causa evidente.

**Corregido el 2026-09-18** (en el árbol de trabajo, sin commitear): se eliminó
el bloque duplicado — la declaración de la línea 61 y sus dos líneas de
comentario, que si no quedaban describiendo una variable inexistente. Queda una
sola declaración, `=false`, con su comentario canónico.

`dotenv` toma en silencio la última clave duplicada, así que este tipo de fallo
no avisa. Vale la pena mirarlo si se vuelven a añadir flags a la plantilla.
