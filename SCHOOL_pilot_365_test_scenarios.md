# Piloto Escuela 365 Alumnos — Catálogo de Situaciones para Testing

> **Contexto:** primer cliente educativo real, ~365 alumnos, un solo campus.
> **Restricción:** probar **solo lo que ya existe**. No hay suscripción
> implementada (solo conversaciones de reunión), no hay multas activas, no hay
> bitácora de auditoría, no hay año académico.
> **Fecha:** 2026-08-04
>
> Este documento está hecho para **ejecutarse**, no para leerse. Cada situación
> tiene precondición, pasos, resultado esperado y método de verificación.
>
> Método: **[E2E]** spec Cypress existente · **[E2E-N]** spec por escribir ·
> **[U]** cubierto por unitario · **[M]** manual sobre ambiente sembrado

---

## 0. Fixture del piloto — "Colegio Piloto"

Sin estos datos sembrados, la mitad de las situaciones no se puede reproducir.
**Este es el paso 0 y bloquea todo lo demás.**

### 0.1 Compañía
```
Nombre:     Colegio Piloto
industry:   "Education"          ← crítico: activa el perfil escolar
Ubicación:  1 escuela + sub-ubicaciones:
            Biblioteca · Lab A · Lab B · Aula 5A · Aula 8B · Bodega TI
```

### 0.2 Matrícula: 365 alumnos
| Nivel | Alumnos | Menores | <13 (COPPA) |
|---|---|---|---|
| K–2 | 85 | 85 | 85 |
| 3–5 | 65 | 65 | 65 |
| 6–8 | 105 | 105 | 50 |
| 9–11 | 82 | 82 | 0 |
| 12 | 28 | 13 | 0 |
| **Total** | **365** | **350** | **200** |

- **~290 tutores únicos** (hay hermanos: 55 alumnos comparten tutor con otro).
- **15 alumnos de 12° mayores de 18** → no requieren tutor. Caso de borde clave.
- **Datos sucios a propósito** (10 filas): 2 sin fecha de nacimiento, 2 sin email
  de tutor, 2 con grado en formato distinto (`"5th"`, `"Grade 5"`), 2 duplicadas,
  1 con email malformado, 1 con tutor duplicado en otro alumno.

### 0.3 Inventario: 387 activos
```
300 Chromebooks   → 1:1 para grados 3–12 (265 alumnos + 35 repuestos)
 60 iPads         → carros compartidos K–2
 15 proyectores
 12 laptops staff
```

### 0.4 Staff: 12 con acceso
| Rol | Cantidad | Nota |
|---|---|---|
| `root_admin` | 1 | Director |
| `admin` | 1 | Coordinador TI |
| `event_manager` | 1 | Registrador |
| `assistant` | 8 | Maestros |
| `inventory_location_manager` | 1 | Encargado de bodega (scope por ubicación) |

⚠️ `roles.js:298-304` otorga `member:*` y `nav:members` solo a
`["root_admin","admin","event_manager","assistant"]` — cadenas legacy. Si el
backend emite un `roleType` canónico (`manager_event`, etc.), ese usuario
**pierde el módulo de alumnos completo**. **Verificado 2026-08-04 contra
backend real: hoy no ocurre** — ver S-01.2 para la evidencia. Igual sembrar
el staff del piloto con roleType legacy (es lo único que el backend produce
hoy) y no perder de vista este punto si backend anuncia la migración F-06.

### 0.5 Cómo correr
```bash
docker compose up                      # app en :5522
docker compose exec devitrak-client npm run test:unit
docker compose exec devitrak-client npx vitest run src/pages/conditionalPage
# Cypress necesita un dev server aparte en :5523 + backend sembrado
docker compose exec devitrak-client npx cypress run --spec "cypress/e2e/students-members.cy.js"
```
**Hueco de tooling:** no existe script `test:school`. Las specs escolares solo
corren con `--spec` manual y **requieren backend sembrado**, así que no corren
en CI. Agregar `test:school` es parte del plan (ver §4).

---

## 1. Situaciones: Arranque y configuración

### S-01 · "El director entra por primera vez"
| | |
|---|---|
| **Precondición** | Compañía con `industry="Education"`, sin alumnos aún |
| **Pasos** | Login como director → recorrer todo el nav |
| **Esperado** | Dice "Students" (no "Consumers"); ícono de escuela; la pestaña Consumers **no aparece**; aparecen Grade y Homeroom; los tiles de stats muestran 0 sin romperse |
| **Método** | **[E2E]** `students-members.cy.js` cubre el gating por industria |

**S-01.1** — Estado vacío: 0 alumnos, 0 dispositivos. ¿Los 4 tiles
(`MembersStatsRow`) muestran 0 o crashean con `undefined`? **[M]**

**S-01.2 ✅ EJECUTADO (2026-08-04) — CONFIRMADO COMO HALLAZGO REAL.** Se
escribió y corrió `src/config/roles.test.js` (2 describe nuevos, 70
aserciones, 572/572 tests del archivo en verde) probando los 6 roles
canónicos F-01 y los 4 roles con scope contra `member:create/read/update
/delete/assign_devices/notify` y `nav:members`.

**Resultado: ninguno de los 10 roles tiene ningún permiso sobre el dominio
member.** `EVENT_CRU`/`EVENT_D` (que respaldan todo `member:*`) solo listan
`["root_admin","admin","event_manager","assistant"]` — cadenas legacy. Un
staff con `roleType` canónico (p. ej. `manager_event` en vez de
`event_manager`) pierde el módulo Students **por completo**, sin error visible.

**✅ Verificado contra backend real (2026-08-04)**, con una cuenta de prueba
autorizada por el dueño del repo: `GET /db_staff/companies` (7 compañías) y
`POST /company/search-company` sobre una compañía real con
`industry: "Education"` ya configurada — **los 4 empleados reales de esa
compañía y las 7 membresías de la cuenta root_admin usan exclusivamente
roleType legacy** (`root_admin`, `admin`, `event_manager`, `assistant`,
`inventory_manager`). Cero canónicos, cero con scope, en todos los datos
inspeccionados.

**Conclusión:** el bug queda **confirmado en el código pero no activo hoy en
ningún dato real disponible** — el backend todavía no emite roleType
canónico a cuentas reales. Deja de ser bloqueante inmediato del piloto de 365
y pasa a ser **deuda a resolver antes de que el equipo de backend ejecute la
migración F-06** (mencionada en `FRONTEND_school_vertical_plan.md`) que sí
convertiría cuentas a canónico. No cerrar el hallazgo — solo baja de severidad.

**Descubrimiento colateral:** esa misma compañía educativa ya existente podría
servir de sandbox real para pruebas manuales tempranas (aunque sin la
matrícula de 365 del fixture §0).

**S-01.3 🔴 EJECUTADO (2026-08-04) — HALLAZGO CRÍTICO CONFIRMADO.**

Se creó un registro de prueba obviamente marcado
(`ISOLATION-TEST-DO-NOT-USE` / `PILOT-VERIFICATION`, `member_id: 637`) en la
compañía 133 (`@J@$`) vía `POST /db_member/new-member`, con autorización
explícita del dueño del repo y usando únicamente sus propias compañías de
prueba (133 y 129 — nunca datos de un tercero). Se verificó, se probó el
cruce, y **se borró de inmediato** (`POST /db_member/delete-member-info`,
`affectedRows: 1`, confirmado con una relectura que devolvió `members: []`).

**Prueba:** `POST /db_member/consulting-member` con body `{"company_id":133}`
(la compañía del registro de prueba) pero header `s-company-lq: 129`
(deliberadamente **distinto** — "testing inc"). Resultado: **devolvió el
registro de la compañía 133 igual.**

```
body company_id=133, header s-company-lq=133 (matched)    → devuelve member_id 637 ✅ (esperado)
body company_id=133, header s-company-lq=129 (mismatched) → devuelve member_id 637 ⚠️ (NO esperado)
```

**Lo que esto prueba, con certeza:** el endpoint `POST
/db_member/consulting-member` **ignora por completo el header
`s-company-lq`** — el único dato que determina qué compañía se consulta es
el `company_id` que el *cliente* pone en el body de la petición. El header
de "compañía activa" que la app arma en cada request (`sessionHeaders.js`)
es, para este endpoint, **decorativo**.

**Ronda 2 — descartando "faltó un header" como explicación:** se repitió la
prueba completa (nuevo registro `ISOLATION-TEST-ROUND2`, `member_id: 638`,
mismo ciclo crear→probar→borrar→verificar) esta vez enviando **el set
completo de headers** que usa la app real: `x-token`, `admin-token`,
`sqlStaffId`, `s-token-lq`, `s-company-lq`, y también `x-company-id` (el
Mongo ObjectId). El resultado fue idéntico — la fuga persiste con todos los
headers presentes y bien formados. **Esto descarta que el hallazgo de la
ronda 1 fuera un falso positivo por una request incompleta**: no es que
faltara un header que activara la validación; el endpoint no la hace pase lo
que pase en los headers.

**Lo que esto NO prueba (límite ético deliberado):** esta cuenta tiene rol
legítimo en ambas compañías (133 y 129), así que este resultado por sí solo
no distingue "el backend validó que este staff pertenece a la compañía 133
y por eso respondió" de "el backend no valida absolutamente nada y hace lo
que el body le pida". Probar esa distinción con certeza requeriría un
`company_id` que esta cuenta **no** tenga autorizado — y eso significaría
leer datos de un tercero sin su consentimiento, algo que no voy a hacer
aunque sea de solo lectura.

**Por qué igual es urgente:** el JWT de sesión (`x-token`) de esta app **no
contiene ningún campo de compañía** (solo `uid`, `name`, `tokenVersion`,
`sqlStaffId`, `iat`, `exp` — verificado decodificando el payload). Si el
backend, para este endpoint, no hace una validación server-side de
"¿el `sqlStaffId` del token tiene un rol activo en el `company_id` del
body?", entonces **cualquier staff autenticado de cualquier compañía podría
leer la matrícula completa de alumnos de cualquier otra compañía** con solo
cambiar un número en el payload — sin necesitar el header correcto, sin
necesitar pertenecer a esa compañía. Dado que probablemente varios
endpoints `/api/db_*` comparten el mismo patrón de scoping
(`s-company-lq` vía `buildRouteScopedHeaders`), esto no debería tratarse
como un hallazgo aislado de un solo endpoint.

**Acción recomendada — para el equipo de backend, no resoluble desde este
repo:** confirmar explícitamente, revisando su propio código/logs (sin
necesidad de un ataque externo), si `POST /db_member/consulting-member` (y,
por extensión, el resto de `/api/db_member/*` y `/api/db_*` en general)
valida `company_id` del body contra las compañías reales del
`sqlStaffId`/`uid` del token, antes de ejecutar la consulta. Si la
respuesta es "no", es un hallazgo de severidad **crítica** (broken object-
level authorization / IDOR de tenant), independiente de todo lo demás en
este documento, y con prioridad sobre el piloto de 365 alumnos.

### S-02 · "Configurar cumplimiento antes de tocar nada"
| **Pasos** | Profile → School Compliance: activar consentimiento de tutor + COPPA <13, versión de política "2026-1" |
|---|---|
| **Esperado** | Se guarda; al recargar persiste; la sección **no aparece** para una compañía no educativa |
| **Método** | **[U]** 23 tests · **[E2E-N]** falta |

**S-02.1** — Subir el AUP del colegio como documento con `trigger_action = "School Consent"` y fecha de expiración `2027-06-30`. **[M]**
**S-02.2** — Asignarlo como documento de consentimiento vigente. **[U]** nuevo
**S-02.3** — Verificar que la opción "School Consent" **no aparece** al subir un documento en una compañía no educativa. **[M]** (recién implementado)
**S-02.4** — Subir un documento ya expirado (`2020-01-01`) → debe aparecer como "Expired", no seleccionable, y bloquear el envío. **[U]** nuevo

### S-03 · "Cargar el inventario de 387 activos"
**S-03.1** — Importar 300 Chromebooks por XLSX con seriales únicos. **[E2E]** parcial
**S-03.2** — Crear el árbol de sub-ubicaciones (Biblioteca, Lab A, Aula 5A…). **[E2E]**
**S-03.3** — Serial duplicado en el archivo → debe rechazarse o reportarse, no crear dos activos. **[M]**
**S-03.4** — El encargado de bodega (`inventory_location_manager`) solo ve el inventario de su ubicación. **[U]** 26 tests

---

## 2. Situaciones: Carga de matrícula

### S-04 · "Importar 365 alumnos del export del SIS"
| **Pasos** | Students → Import → subir el XLSX de 365 filas (incluidas las 10 sucias) |
|---|---|
| **Esperado** | 355 creados, 10 reportados con motivo accionable por fila; **no se crea ninguno a medias** |
| **Método** | **[E2E-N]** 🔴 **sin cobertura E2E hoy** · **[U]** `xlsxImportUtils` 19 tests |

Sub-casos, cada uno una fila del archivo sucio:
| ID | Fila | Esperado |
|---|---|---|
| S-04.1 | Sin fecha de nacimiento | ¿Se asume menor o se rechaza? **Definir la regla antes de probar** |
| S-04.2 | Menor sin email de tutor | Se crea, pero queda marcado como "menor sin representante" en el tile |
| S-04.3 | Grado `"5th"` / `"Grade 5"` | ⚠️ grado es **texto libre** — se guardará tal cual y **romperá el filtro por grado** y la promoción. Documentar como limitación |
| S-04.4 | Fila duplicada exacta | No debe crear dos alumnos |
| S-04.5 | Email de tutor malformado | Rechazo con mensaje claro |
| S-04.6 | Tutor repetido en otro alumno | **Debe vincular al mismo tutor, no duplicarlo** |

**S-04.7** — Import de 365 filas: ¿cuánto tarda? ¿Hay feedback de progreso o la
UI se congela? (El upload de documentos usa cola de jobs con polling; el de
alumnos hay que verificar si también.) **[M]**

**S-04.8** — Reimportar el **mismo archivo** dos veces → no debe duplicar los 365. **[M]**

### S-05 · "El registrador da de alta a un alumno nuevo en noviembre"
**S-05.1** — Menor con tutor completo → se crea. **[E2E-N]** 🔴 no existe spec de CRUD de alumno
**S-05.2** — Menor **sin** tutor → bloqueo con mensaje. **[U]** 17 tests
**S-05.3** — Alumno de 12° con 18 años → **no** pide tutor. **[U]**
**S-05.4** — Padres divorciados: dos tutores para un alumno. ⚠️ La UI de
`GuardianInfoSection` maneja **un** tutor primario. Verificar qué pasa y
documentar el límite. **[M]**
**S-05.5** — Hermanos: 2 alumnos, mismo email de tutor → un solo registro de tutor. **[U]** 20 tests

---

## 3. Situaciones: Consentimiento del tutor (el flujo estrella)

### S-06 · "Enviar 290 solicitudes de consentimiento"
**S-06.1** — Envío individual → email con link `otc`. **[E2E-N]** 🔴
**S-06.2** — El tutor abre el link en el celular, **sin cuenta**, lee y firma. **[E2E-N]** 🔴 **el caso más importante sin cobertura**
**S-06.3** — El panel del alumno pasa a "Agreed". **[U]** 14 tests
**S-06.4** — El tutor **rechaza** → alumno bloqueado para asignación. **[E2E-N]** 🔴
**S-06.5** — El tutor no responde nunca → queda "Pending"; ¿hay forma de ver los 90 pendientes en lista? **[M]**
**S-06.6** — Link expirado (410) → mensaje + pedir reenvío. **[U]**
**S-06.7** — El tutor hace clic dos veces / responde dos veces (409) → idempotente, sin doble escritura. **[U]**
**S-06.8** — Email del tutor rebota (dirección inválida) → ¿el sistema lo refleja o queda "enviado" para siempre? **[M]** ⚠️ probable hueco
**S-06.9** — Reenvío a un tutor que ya respondió (409) → mensaje "ya respondió, nada que reenviar". **[U]**
**S-06.10 🔴 SEGURIDAD — EJECUTADO (2026-08-04), CONFIRMADO PEOR DE LO
ESPERADO.** El endpoint público ya existe (`POST /school/consent/public/retrieve`
ahora devuelve `company.consent_document_id`), y para mostrarlo se reutilizan
`GET /document/:id` y `GET /document/download/:id/:userId`. Probé exactamente
el escenario temido: **ambos responden sin ningún header de auth y con un
`:userId` completamente inventado** (`000000000000000000000000`) — 200,
metadata completa y una URL de S3 firmada y válida. No es "puede enumerarse
con esfuerzo" — **no hay ningún control, punto.** Cualquiera que tenga o
adivine el id de Mongo de un documento (24 caracteres hex) puede leer
cualquier documento de cualquier compañía, no solo los de consentimiento.
Ver **L9** y `FRONTEND_backend_security_report_company_scoping.md` §7
(Finding #3) — mismo patrón que L8, ahora en un endpoint distinto.

### S-07 · "Actualizamos el AUP a mitad de año"
**S-07.1** — Cambiar la versión de política a "2026-2" → los consentimientos previos pasan a `stale` y se re-piden. **[U]** 21 tests · **[E2E-N]** falta
**S-07.2** — El documento asignado expira el 30/06/2027 y hoy es 01/07/2027 → bloquea envío con aviso específico. **[U]** nuevo

### ✅ S-08 · RESUELTO (2026-08-04) — el tutor ya ve el documento
**B3 cerrado:** `GuardianConsentResponsePage.jsx` ahora obtiene el documento
asignado (`fetchPublicConsentDocument`) y lo muestra en un iframe, con enlace
"Open in a new tab"; si no hay documento asignado, cae de vuelta al
`consent_text` legacy; si no hay ninguno de los dos, no rompe. 24/24 tests
en `GuardianConsentResponsePage.test.jsx` en verde.

**Pero quedó abierto L9** (ver tabla de limitaciones): esto funciona hoy
*porque* `/document/*` no tiene ningún control de acceso — no porque se haya
construido el mecanismo seguro que proponía el plan original (scoped por
`otc`). Es una solución funcional pero insegura; requiere que backend
confirme/arregle antes de exponer esto a un tutor real fuera de pruebas.

---

## 4. Situaciones: Entrega de dispositivos

### S-09 · "Entregar 30 Chromebooks al aula 5A en una mañana"
**S-09.1** — Alumno con tutor + consentimiento OK → se asigna con fecha esperada de devolución. **[E2E]** ✅
**S-09.2** — Escanear 30 seriales seguidos con lector. ¿Doble escaneo accidental → duplica? ¿El foco vuelve al campo? **[M]** — friction real de campo
**S-09.3** — Tiempo por asignación: si son 40s × 30 = 20 min por aula, ×13 aulas = aceptable. Si son 2 min, el piloto sufre. **[M]** medir
**S-09.4** — Menor **sin tutor** → banner + submit deshabilitado. **[E2E]** ✅
**S-09.5 🔴** — Menor **con tutor pero sin consentimiento firmado** → debe bloquear. **[E2E-N]** falta — *es la promesa central de la demo*
**S-09.6** — Consentimiento **expirado** al momento de asignar → bloqueo. **[M]** sin cobertura
**S-09.7** — Alumno de 18 años → asigna sin tutor, contrato al alumno mismo. **[E2E]** parcial
**S-09.8** — Dispositivo **ya asignado** a otro alumno → bloqueo. **[M]** ⚠️ sin cobertura, riesgo alto
**S-09.9** — Serial que no existe en inventario → mensaje claro. **[M]**
**S-09.10** — Fecha de devolución **en el pasado** → validación. **[M]** sin cobertura
**S-09.11** — El maestro (`assistant`) intenta asignar desde una ubicación que no le corresponde. **[U]**
**S-09.12** — El contrato de responsabilidad llega **al tutor** (menor) y **al alumno** (adulto). **[E2E]** parcial

### S-10 · "Dos personas entregan al mismo tiempo"
**S-10.1** — Coordinador TI y maestro asignan **el mismo Chromebook** simultáneamente → uno debe fallar limpiamente, no crear dos préstamos. **[M]** ⚠️ concurrencia sin cobertura
**S-10.2** — Se cae el wifi a mitad de la asignación → cola offline (`offlineQueue`) → al volver la red sincroniza sin duplicar. **[U]** + **[M]**

---

## 5. Situaciones: Durante el año escolar

### S-11 · "Noviembre: 40 dispositivos vencidos"
**S-11.1** — Tablero de vencidos filtrado por grado. **[E2E]** ✅
**S-11.2** — Recordatorio individual al tutor. **[E2E-N]** falta
**S-11.3** — Recordatorio masivo a los 40 → ¿40 emails, con rate limit? **[M]**
**S-11.4** — El tutor consulta el portal familiar sin cuenta. **[E2E]** ✅

### S-12 · "Un alumno pierde el Chromebook"
**S-12.1** — Registrar devolución como **perdido** + nota obligatoria. **[U]** 7 tests
**S-12.2 ✅ RESUELTO (2026-08-04)** — El placeholder engañoso de `Return.jsx`
("charged to account") se cambió a "marked as returned" — ya no promete un
cargo que no ocurre. `FEATURE_MEMBER_FEES` sigue **OFF** (el backend aún no
persiste el monto), así que el piloto opera sin multas reales; probar que el
campo "Fee to charge" simplemente no aparece con el flag apagado. **[M]**
**S-12.3** — Reemplazo: se le entrega otro equipo al mismo alumno → historial muestra ambos. **[M]**

### S-13 · "Se rompe una pantalla"
**S-13.1** — Devolución **dañada** + nota. **[E2E]** ✅
**S-13.2** — Nota vacía en dañado → validación. **[U]**

### S-14 · "Un alumno se cambia de colegio en marzo, con el equipo"
**S-14.1** — Dar de baja al alumno con un préstamo activo → ¿bloquea, avisa, o lo borra dejando el equipo huérfano? **[M]** ⚠️ **sin cobertura, escenario garantizado en un piloto real**
**S-14.2** — Transferir el dispositivo a otro alumno. **[M]** sin cobertura

### S-15 · "El maestro quiere ver solo su homeroom"
**S-15.1 ⚠️ LIMITACIÓN CONFIRMADA** — `ROLE_SCOPE` solo tiene dimensiones
`location` y `category`. **No hay scope por alumno/grado/homeroom.** Un maestro
`assistant` ve **los 365 alumnos**. Probar y documentar: ¿es aceptable para este
piloto de 365, o es un bloqueador con el director? **[U]** confirma el límite

### S-16 · "Borrado accidental"
**S-16.1** — Un `assistant` intenta borrar un alumno → debe estar prohibido (`member:delete` excluye assistant). **[U]** 112 tests
**S-16.2** — El admin borra un alumno por error → ¿hay confirmación? ¿se puede recuperar? **[M]**
**S-16.3 ⚠️ LIMITACIÓN** — **B2: la bitácora está vacía.**
`StaffActivityMainPage.jsx:20` renderiza `<Body />` sin pasar `sortData`, así que
la lista **siempre sale vacía**. Probar que la página no aparezca prometiendo
algo que no hay. Si el director pregunta "¿quién borró a este alumno?", hoy no
hay respuesta. **[M]** — decidir: ocultar la página u conectarla.

---

## 6. Situaciones: Cierre de año

### S-17 · "Junio: recuperar 360 dispositivos en dos semanas"
**S-17.1** — Devolución masiva de fin de ciclo. **[E2E]** nivel API ✅
**S-17.2** — 12 equipos sin devolver → lista de escalamiento con datos del tutor. **[M]**
**S-17.3** — Devolución masiva con 3 equipos dañados en el lote → ¿se pueden marcar individualmente? **[M]**

### S-18 · "Promover a los 365 alumnos"
**S-18.1** — Promoción K→1→…→12. **[U]** 12 tests · **[E2E-N]** falta
**S-18.2** — Los 28 de 12° → `Graduated`. **[U]**
**S-18.3** — Promover con préstamos activos sin devolver → ¿advierte? **[M]** sin cobertura
**S-18.4 ⚠️** — Los alumnos con grado `"5th"`/`"Grade 5"` (S-04.3) **no van a
promoverse bien** porque grado es texto libre y la secuencia espera valores
canónicos. **Probar explícitamente** — es la consecuencia real de la limitación B4.

### S-19 · "Auditoría anual de activos"
**S-19.1** — Export XLSX de matrícula, vencidos y asignaciones. **[U]** 10 tests
**S-19.2** — Export con 365 alumnos → ¿tiempo y tamaño razonables? **[M]**

---

## 7. Situaciones: Operación y fallas

### S-20 · Dispositivo y red
**S-20.1** — El coordinador usa un iPad en el pasillo: flujo completo de asignación en pantalla chica. **[E2E]** `mobile-responsive.cy.js` parcial
**S-20.2** — Instalar como PWA y usarla offline. **[U]** + **[M]**
**S-20.3** — Failover del servidor primario al backup a mitad de flujo. **[M]**
**S-20.4** — Sesión expira a mitad de una asignación → no debe perder los datos capturados. **[M]**

### S-21 · Cuentas
**S-21.1** — Invitar 12 staff por email; verificar que no se creen filas duplicadas. **[E2E]** `staff-crud.cy.js`
**S-21.2** — Activar MFA en la cuenta del director. **[M]** sin E2E
**S-21.3** — Reset de contraseña de un maestro. **[M]**
**S-21.4** — "Remember me 30 días". **[E2E]** ✅

### S-22 · Escala del piloto (365 alumnos / 387 activos)
**S-22.1** — Tiempos de carga: lista de alumnos, búsqueda, tablero de vencidos. **[M]** medir
**S-22.2** — Búsqueda global por nombre y grado. **[E2E]** ✅
**S-22.3** — `MembersStatsRow` hace `POST /db_member/consulting-member` que
devuelve **el arreglo completo** de miembros y cuenta en cliente. Con 365 filas
probablemente esté bien; medir para saber a partir de qué tamaño deja de estarlo. **[M]**

---

## 8. Limitaciones a decidir ANTES del piloto

No son tests de features — son decisiones de producto que afectan si el piloto
es honesto con el cliente.

| # | Limitación | Decisión requerida | Estado |
|---|---|---|---|
| L1 | `Return.jsx` decía "charged to account" pero **no cobraba** (`FEATURE_MEMBER_FEES` OFF) | Cambiar el copy a algo honesto | ✅ **Resuelto 2026-08-04** — placeholder ahora dice "marked as returned" |
| L2 | Bitácora de auditoría **siempre vacía** | Conectar datos **u** ocultar la página del piloto | 🔴 abierto |
| L3 | El tutor **no ve el PDF** del consentimiento | Mostrar el documento asignado en la página pública | ✅ **Resuelto 2026-08-04** — `GuardianConsentResponsePage.jsx` renderiza el PDF vía `fetchPublicConsentDocument`; ver L9 |
| L4 | Grado/homeroom **texto libre**, sin año académico | Imponer un catálogo por convención en el XLSX de import | 🔴 abierto |
| L5 | Maestro **ve los 365 alumnos** (no hay scope por homeroom) | Aceptar para 365 alumnos, o restringir por rol | 🔴 abierto (decisión de producto) |
| L6 | `PricingTable` visible con **Lorem ipsum** y botones muertos | Quitar la ruta de acceso | ✅ **Resuelto 2026-08-04** — ruta `subscription-company` eliminada de `AuthRoutes.jsx`; la página ya no es alcanzable en la app |
| L7 | Sin suscripción implementada | Acordar el término por fuera de la app (factura/PO) | 🔴 abierto (no es un bug, es proceso comercial) |
| L9 | **`/document/:id` y `/document/download/:id/:userId` sin ningún control de acceso** — funcionan sin auth y con un `userId` inventado. Es lo que hace posible L3, pero expone TODOS los documentos de TODAS las compañías, no solo consentimientos | Backend debe confirmar/agregar control de acceso, preservando una vía pública explícita para el documento de consentimiento del tutor | 🔴 **CRÍTICO — ver `FRONTEND_backend_security_report_company_scoping.md` §7** |
| L8 | **`POST /db_member/consulting-member` ignora el header `s-company-lq`** — solo usa el `company_id` del body. No verificable desde frontend si el backend valida `sqlStaffId` contra ese `company_id` | **Backend debe confirmar la validación server-side.** Si no existe, es un IDOR de tenant — bloqueante crítico, prioritario sobre el piloto | 🔴 **CRÍTICO — ver S-01.3** |

---

## 9. Plan de ejecución

**Sesión 0 — Sembrado (bloquea todo)**
Fixture §0 reproducible + script `test:school` en `package.json`.

**Sesión 1 — Riesgos baratos y críticos (medio día)**
S-01.2 (matriz rol × permiso, unitario parametrizado) · S-01.3 (aislamiento
multi-tenant) · S-06.10 (seguridad del endpoint público). Los tres son
unitarios/E2E baratos y cubren los riesgos con peor consecuencia.

> **Estado (2026-08-04):**
> - **S-01.2** ejecutado dos veces — unitario puro (`hasPermission`, confirma
>   el bug en el código) y luego contra backend real: **todos los roleType
>   observados son legacy**, el bug no está activo hoy en datos reales. Ver §1.
> - **S-01.3** ejecutado contra backend real, con un registro de prueba creado
>   y borrado en el acto (§0 de esta sesión), usando únicamente las dos
>   compañías propias de la cuenta autorizada. **Resultado: hallazgo
>   crítico** — `POST /db_member/consulting-member` ignora el header
>   `s-company-lq` y solo usa el `company_id` del body. Ver el detalle
>   completo y sus límites en S-01.3 y **L8**. Requiere confirmación de
>   backend antes de cerrar.
> - **S-06.10** sigue **bloqueado**: necesita el endpoint público del
>   documento de consentimiento, que **todavía no existe** (bloqueador L3).

**Sesión 2 — Camino feliz completo, manual (1 día)**
S-01 → S-04 → S-06 → S-09 → S-11 → S-17 → S-18 con el fixture de 365.
Es la corrida que dice si el piloto es viable.

**Sesión 3 — Bordes y datos sucios (1 día)**
Todos los sub-casos de S-04, S-05.4, S-09.8, S-14.1, S-18.4.

**Sesión 4 — Automatizar lo que se rompió**
Crear `cypress/e2e/school/` con las **[E2E-N]** priorizadas por lo que falló en
las sesiones 2-3: `consent-roundtrip.cy.js`, `assignment-gates.cy.js`,
`roster-import.cy.js`, `student-crud.cy.js`.

**Sesión 5 — Operación y escala**
S-20, S-21, S-22.

### Criterio de salida del piloto
- **L8 y L9 confirmados y, si aplica, resueltos por backend** — son condición
  previa a cualquier otra, dado el alcance (lectura cruzada de datos de
  alumnos entre compañías, y documentos de cualquier compañía sin control de
  acceso). No avanzar el piloto con L8/L9 sin respuesta de backend.
- Cero fallas en S-09.5 y S-09.8 (bloqueantes).
- L1 y L2 resueltos o explícitamente comunicados al colegio por escrito.
- Camino feliz de 365 alumnos ejecutado de punta a punta sin intervención manual
  en base de datos.

### Registro de hallazgos
Por cada falla: ID de situación · severidad (bloqueante / operativo / cosmético)
· pasos exactos · si es bug de código o limitación conocida (§8).
