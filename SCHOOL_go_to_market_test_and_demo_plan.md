# Vertical Educativo — Plan de Testing, Ruta de Demo y Costo-Beneficio

> **Fecha:** 2026-08-04
> **Alcance:** qué puede hacer hoy un instituto educativo con el dashboard, cómo
> probarlo exhaustivamente, cómo presentarlo a un cliente potencial, y el
> modelo económico a $300/mes por cliente (almacenamiento y staff ilimitados).
>
> **Base de evidencia:** revisión con Graphify + lectura de código + inventario
> de tests (2026-08-04). Cada afirmación está marcada como
> **[verificado]** (leído en código), **[gap]** (ausencia confirmada) o
> **[supuesto]** (modelo económico / estimación, no dato medido).

---

## 0. Resumen ejecutivo

**Lo bueno:** el vertical educativo no está por construirse — está construido en
un ~75%. Hay ~939 casos de test (54 archivos Vitest ≈757 casos + 11 specs
Cypress ≈182 casos), incluyendo 2 specs Cypress específicas de escuela y 200
tests unitarios en el módulo de estudiantes. **[verificado]**

**Lo que bloquea una venta hoy** — 4 cosas, en orden de riesgo:

| # | Bloqueador | Impacto comercial |
|---|---|---|
| B1 | **Cobro por equipo perdido/dañado no funciona.** `FEATURE_MEMBER_FEES` está OFF y ni siquiera está documentado en `.env.dev.example`; el backend no persiste `fee_amount`. | Es *la* razón económica por la que una escuela compra esto. Sin cobro, el ROI que vendemos no se materializa. |
| B2 | **La bitácora de auditoría está vacía por diseño roto.** `StaffActivityMainPage.jsx:20` renderiza `<Body />` sin pasar `sortData`, así que la lista siempre sale vacía. | FERPA/COPPA: un distrito va a preguntar "¿quién tocó el registro de este menor?". Hoy no hay respuesta. |
| B3 | **El documento de consentimiento no llega al tutor.** El tutor no autenticado todavía no puede ver el PDF asignado (falta el endpoint público scoped por `otc`). | Rompe la demo del flujo estrella (consentimiento firmado por el tutor). |
| B4 | **Sin año académico ni catálogos.** `grade`/`homeroom` son texto libre, no hay período ni promoción versionada. | Una escuela con 800 alumnos no acepta texto libre para grado. |

**Veredicto:** vendible como **piloto pagado** a 1-3 escuelas ancla resolviendo
B1+B2 (≈2-3 sprints). No vendible aún como producto general para distritos.

---

## 1. Qué puede hacer hoy un instituto educativo (verificado)

Perfil `Education` en `src/config/industryProfiles.js:29-41` **[verificado]**:
- `icon: "tabler:school"`, `audience: "Students"`
- `hiddenNavTabs: ["consumers"]` — oculta el track genérico de consumidores
  *a propósito*: los alumnos SON los consumidores, y el track genérico
  (depósitos, check-in de eventos) evadiría la validación de tutor.
- `representative: { label: "Parent / Guardian", requiredForMinors: true }`
- `fields: { grade: true, homeroom: true, minor: true }` — el único perfil con
  `grade`/`homeroom` activos.

Capacidades confirmadas en código:

| Área | Estado | Evidencia |
|---|---|---|
| Alta de alumno individual (grado, homeroom, menor→tutor obligatorio) | 🟢 | `modals/addNewMember/Single.jsx` + `singleMemberUtils` (17 tests) |
| Importación masiva de matrícula XLSX | 🟢 | `MultipleFromXLSX.jsx` + `xlsxImportUtils` (19 tests) |
| Tutor: buscar-o-crear por email (sin duplicar) | 🟢 | `GuardianInfoSection.jsx` + `guardianConsentUtils` (20 tests) |
| Asignación dispositivo→alumno con fecha de devolución | 🟢 | `AssignmentDevicesToMember.jsx` |
| **Compuerta de tutor**: bloquea asignar a menor sin tutor completo | 🟢 | `AssignmentDevicesToMember.jsx` + `assignmentErrorUtils` (22 tests) |
| **Compuerta de consentimiento** antes de asignar | 🟢 | `consentCheckUtils` (21 tests) |
| Contrato de responsabilidad + email al responsable | 🟢 | `AssignmentDevicesToMember.jsx` |
| Ciclo de vida del préstamo (lease) | 🟢 | `POST /db_member/new-member-assigned-device-lease` |
| Devolución: devuelto / dañado / perdido + nota de condición | 🟢 | `return/Return.jsx` + `leaseReturnUtils` (7 tests) |
| Tablero de vencidos + recordatorios al tutor | 🟢 | `tables/OverdueDevicesTable.jsx` |
| Devolución masiva de fin de ciclo | 🟢 | `POST /db_member/bulk-return` |
| Promoción de grado (K→1→…→12→Graduated) | 🟢 | `gradeAdvancementUtils` (12 tests) |
| Exportación XLSX de matrícula y perfil | 🟢 | `memberExportUtils` (10 tests) |
| Consentimiento del tutor: solicitar / reenviar / responder público | 🟢 | `schoolConsent/**` (28 tests) + `StudentConsentPanel` (14) |
| Ajustes de cumplimiento FERPA/COPPA | 🟢 | `Profile/school_compliance/**` (23 tests) |
| Documento de consentimiento asignable (subida + expiración) | 🟡 | implementado hoy; **falta la vista pública del tutor** |
| Portal familiar "My Devices" (no autenticado) | 🟢 | `POST /db_member/my-devices` |
| Inventario con árbol escuela→sub-ubicación | 🟢 | cubierto en `students-members.cy.js` |
| Roles con alcance por ubicación/categoría | 🟢 | `ROLE_SCOPE` en `roles.js:122-133` |
| PWA / offline / instalable | 🟢 | service worker + `offlineQueue` |
| Cobro por perdido/dañado | 🔴 **[gap]** | `FEATURE_MEMBER_FEES` OFF, backend no persiste |
| Bitácora de auditoría | 🔴 **[gap]** | página siempre vacía |
| Año académico / catálogos de grado | 🔴 **[gap]** | texto libre |
| Alcance de rol por alumno (homeroom/grado) | 🔴 **[gap]** | `ROLE_SCOPE` solo location/category |

### Riesgo latente a validar (no confirmado como bug en producción)

`roles.js:298-304` **[verificado]**: `member:*` y `nav:members` se otorgan solo a
`EVENT_CRU = ["root_admin","admin","event_manager","assistant"]` — **cadenas
legacy únicamente**. Ningún rol canónico F-01 (`root_administrator`,
`manager_event`, …) ni ningún rol con alcance aparece en esas listas, y
`hasPermission` hace `includes()` exacto sin normalizar (`roles.js:338-341`).
**Implicación:** si el backend emite un `roleType` canónico, ese usuario pierde
el acceso al módulo de alumnos por completo. Requiere una prueba explícita
(ver T-10.1) antes de afirmar que está roto o sano en producción.

---

## 2. Plan de acción de testing

### 2.1 Cobertura actual y huecos

**Cubierto con Cypress E2E** **[verificado]**: `students-members.cy.js` (24
casos: gating por industria, lista + columna Grade, búsqueda, deep-links,
vencidos, API de devolución masiva, menor-vs-adulto, portal familiar, árbol de
inventario) y `member-assignment-flow.cy.js` (2 casos: asignar y devolver como
dañado).

**Sin ninguna cobertura E2E** **[gap verificado]**:
1. Round trip real del consentimiento (email → link con token → aceptar/rechazar → estado del alumno)
2. La compuerta de consentimiento bloqueando una asignación (solo unitario)
3. Importación XLSX de matrícula (subida, errores de validación, fallo parcial)
4. Promoción de grado / cierre de año
5. Crear/editar un alumno individual (no existe `cypress/e2e/school/`)
6. Borrar/archivar alumno; CRUD del tutor
7. Página de ajustes de cumplimiento
8. Historial del dispositivo / flujo de multa
9. Recordatorios de vencimiento al tutor

**Hueco de tooling** **[verificado]**: no existe script `test:students`,
`test:school` ni `test:consent`. Las specs de escuela solo corren con
`cypress run` pelado o `--spec` manual. Además requieren un backend local
sembrado (`principal@summitunified.edu`), así que **no son ejecutables en CI**.

### 2.2 Matriz de escenarios por ciclo operativo de la escuela

Prioridad: **P0** = rompe la venta o el cumplimiento · **P1** = dolor operativo
real · **P2** = pulido.

#### T-1 · Onboarding y configuración (P0)
| ID | Escenario | Estado |
|---|---|---|
| T-1.1 | Empresa con `industry="Education"` → pestaña Consumers oculta, Students visible | ✅ E2E existe |
| T-1.2 | Empresa NO educativa → sin campos grade/homeroom, label "Authorized representative" | ⚠️ solo unitario |
| T-1.3 | Alta de staff, asignación de rol, invitación por email | ✅ `staff-crud.cy.js` |
| T-1.4 | Ubicaciones escuela→sub-ubicación (edificio/aula) | ✅ E2E existe |
| T-1.5 | Activar cumplimiento FERPA + COPPA (<13) + versión de política | ❌ **falta E2E** |
| T-1.6 | Subir y asignar documento de consentimiento (solo Education) | ❌ **falta E2E** |
| T-1.7 | Documento expirado → no seleccionable, bloquea envío | ✅ unitario nuevo (6 tests) |

#### T-2 · Carga de matrícula (P0)
| ID | Escenario | Estado |
|---|---|---|
| T-2.1 | Alta individual: menor con tutor completo | ❌ **falta E2E** |
| T-2.2 | Alta individual: menor SIN tutor → bloqueo | ⚠️ solo unitario |
| T-2.3 | Alta individual: mayor de edad (sin tutor requerido) | ⚠️ solo unitario |
| T-2.4 | XLSX: 500 filas válidas | ❌ **falta E2E** |
| T-2.5 | XLSX: filas con grado inválido / email malformado / fecha inválida | ❌ **falta E2E** |
| T-2.6 | XLSX: fallo parcial (300 ok, 200 error) → reporte accionable | ❌ **falta E2E** |
| T-2.7 | XLSX: alumno duplicado (mismo email/ID) → no duplica | ❌ **falta E2E** |
| T-2.8 | Tutor ya existente por email → vincula, no duplica | ⚠️ solo unitario |
| T-2.9 | Un tutor con 3 hijos en la escuela | ❌ **sin cobertura** |

#### T-3 · Consentimiento del tutor (P0 — flujo estrella)
| ID | Escenario | Estado |
|---|---|---|
| T-3.1 | Enviar solicitud → email al tutor con link `otc` | ❌ **falta E2E** |
| T-3.2 | Tutor abre link, lee el documento, acepta | ❌ **falta E2E** (crítico) |
| T-3.3 | Tutor rechaza → alumno queda bloqueado para asignación | ❌ **falta E2E** |
| T-3.4 | Link expirado (410) → mensaje + pedir reenvío | ⚠️ unitario/componente |
| T-3.5 | Link inválido (404) | ⚠️ unitario/componente |
| T-3.6 | Doble envío (409 already responded) → idempotente | ⚠️ unitario/componente |
| T-3.7 | Nueva versión de política → consentimiento previo queda `stale`, se re-pide | ⚠️ solo unitario |
| T-3.8 | Sin documento asignado → botón bloqueado + aviso | ✅ unitario nuevo |
| T-3.9 | Documento asignado pero expirado → bloqueado + aviso distinto | ✅ unitario nuevo |
| T-3.10 | **Seguridad:** el endpoint público no debe permitir enumerar documentos por `document_id` | ❌ **falta test de seguridad** |

#### T-4 · Asignación de dispositivos (P0)
| ID | Escenario | Estado |
|---|---|---|
| T-4.1 | Asignar a alumno con tutor + consentimiento OK | ✅ E2E existe |
| T-4.2 | Menor sin tutor → banner + submit deshabilitado | ✅ E2E existe |
| T-4.3 | Menor con tutor pero SIN consentimiento firmado → bloqueo | ❌ **falta E2E** (crítico) |
| T-4.4 | Consentimiento expirado al momento de asignar → bloqueo | ❌ **sin cobertura** |
| T-4.5 | Fecha esperada de devolución en el pasado → validación | ❌ **sin cobertura** |
| T-4.6 | Escaneo de número de serie (lector de código) | ⚠️ parcial |
| T-4.7 | Inventario filtrado por ubicación del staff (scoped role) | ✅ unitario (26 tests) |
| T-4.8 | Asignar un dispositivo ya asignado a otro alumno → bloqueo | ❌ **sin cobertura** |
| T-4.9 | Contrato de responsabilidad enviado al tutor (menor) vs al alumno (adulto) | ✅ E2E parcial |
| T-4.10 | Asignar 30 dispositivos a un aula completa (carga) | ❌ **sin cobertura** |

#### T-5 · Operación durante el ciclo (P1)
| ID | Escenario | Estado |
|---|---|---|
| T-5.1 | Tablero de vencidos filtrado por grado | ✅ E2E existe |
| T-5.2 | Recordatorio individual al tutor | ❌ **falta E2E** |
| T-5.3 | Recordatorio masivo a todos los vencidos | ❌ **falta E2E** |
| T-5.4 | Portal familiar "My Devices" sin autenticación | ✅ E2E existe |
| T-5.5 | Búsqueda global de alumno por nombre/grado | ✅ E2E existe |
| T-5.6 | Transferencia de dispositivo entre alumnos | ❌ **sin cobertura** |
| T-5.7 | Alumno se retira a mitad de ciclo con dispositivo activo | ❌ **sin cobertura** |
| T-5.8 | Historial completo de dispositivos de un alumno | ⚠️ parcial |

#### T-6 · Devoluciones (P0)
| ID | Escenario | Estado |
|---|---|---|
| T-6.1 | Devolución en buen estado | ✅ E2E existe |
| T-6.2 | Devolución dañada + nota obligatoria | ✅ E2E existe |
| T-6.3 | Reporte de pérdida + nota obligatoria | ⚠️ solo unitario |
| T-6.4 | **Multa por dañado/perdido** (flag ON) | 🔴 **bloqueado por B1** |
| T-6.5 | Multa visible en el perfil del alumno y en reporte | 🔴 **bloqueado por B1** |
| T-6.6 | Nota de condición vacía en dañado → validación | ⚠️ solo unitario |

#### T-7 · Cierre de año (P1)
| ID | Escenario | Estado |
|---|---|---|
| T-7.1 | Devolución masiva de fin de ciclo | ✅ E2E (nivel API) |
| T-7.2 | Promoción de grado K→1→…→12 | ❌ **falta E2E** |
| T-7.3 | Alumnos de 12° → `Graduated` | ❌ **falta E2E** |
| T-7.4 | Promoción con dispositivos aún sin devolver → advertencia | ❌ **sin cobertura** |
| T-7.5 | Export XLSX de matrícula, vencidos y multas | ⚠️ solo unitario |

#### T-8 · Cumplimiento y gobernanza (P0 para distritos)
| ID | Escenario | Estado |
|---|---|---|
| T-8.1 | Bitácora: quién asignó/devolvió/editó, con actor y timestamp | 🔴 **bloqueado por B2** |
| T-8.2 | Export de datos de un alumno (derecho de acceso FERPA) | ⚠️ parcial vía export |
| T-8.3 | Borrado/anonimización de un alumno | ❌ **sin cobertura** |
| T-8.4 | Retención: documento expirado deja de ser accesible | ✅ unitario nuevo |
| T-8.5 | MFA para cuentas administrativas | ⚠️ existe `Profile/mfa`, sin E2E |

#### T-9 · Multi-tenant / multi-campus (P1)
| ID | Escenario | Estado |
|---|---|---|
| T-9.1 | Aislamiento entre empresas: la escuela A no ve datos de B | ❌ **falta test de seguridad** (crítico) |
| T-9.2 | Un staff en 2 empresas → cambio de compañía limpia el estado | ⚠️ parcial |
| T-9.3 | Headers `x-company-id` / `s-company-lq` correctos por ruta | ✅ unitario (11 tests) |

#### T-10 · Matriz de permisos por rol (P0)
| ID | Escenario | Estado |
|---|---|---|
| T-10.1 | **Cada `roleType` × cada `member:*`** — incluidos los canónicos F-01 y los scoped | ❌ **crítico, ver riesgo §1** |
| T-10.2 | `assistant` puede crear/leer/actualizar alumno pero NO borrar | ✅ unitario (112 tests en `roles.test.js`) |
| T-10.3 | Rol con alcance de ubicación solo ve su inventario | ✅ unitario |
| T-10.4 | Un maestro limitado a su homeroom | 🔴 **bloqueado por B4/gap de scope** |

#### T-11 · No funcional (P1)
| ID | Escenario |
|---|---|
| T-11.1 | 1.000 alumnos + 1.200 dispositivos: tiempos de lista, búsqueda y export |
| T-11.2 | PWA offline: asignar sin red → cola → sincroniza |
| T-11.3 | Móvil/tablet: el flujo de asignación completo en pantalla chica |
| T-11.4 | Failover de servidor primario→backup a mitad de flujo |
| T-11.5 | Accesibilidad de la página pública del tutor (la usa gente no técnica) |

### 2.3 Secuencia de ejecución recomendada

**Sprint 1 — desbloquear la venta**
1. Resolver **B1** (multas): documentar `VITE_APP_FEATURE_MEMBER_FEES` en
   `.env.dev.example`, confirmar contrato backend, activar y probar T-6.4/T-6.5.
2. Resolver **B2** (bitácora): conectar una fuente de datos real a
   `StaffActivityMainPage` y cubrir T-8.1.
3. **T-10.1** — matriz completa rol × permiso de `member:*`. Es una tabla
   parametrizada en Vitest, barato y cierra el riesgo de §1.
4. **T-9.1** — aislamiento entre empresas. Barato de probar, catastrófico si falla.

**Sprint 2 — hacer la demo a prueba de balas**
5. Crear `cypress/e2e/school/` con: `student-crud.cy.js` (T-2.1→2.3),
   `roster-import.cy.js` (T-2.4→2.7), `consent-roundtrip.cy.js` (T-3.1→3.3),
   `assignment-gates.cy.js` (T-4.3/4.4/4.8).
6. Agregar scripts `test:school` y `test:consent` a `package.json`.
7. Sembrado reproducible del backend para que las specs de escuela corran en CI.

**Sprint 3 — cierre de ciclo y no funcional**
8. T-7.2→7.4 (promoción), T-5.2/5.3 (recordatorios), T-11.1 (carga con 1.000 alumnos).

---

## 3. Ruta de presentación a clientes potenciales

### 3.1 A quién le hablamos

| Rol | Qué le duele | Qué le mostramos |
|---|---|---|
| Director / Superintendente | Pérdida de equipo, exposición legal con datos de menores | ROI en dólares + cumplimiento FERPA |
| Coordinador de tecnología | Rastrear 800 dispositivos en Excel; agosto y junio son un infierno | Importación masiva, asignación por escaneo, devolución masiva |
| Administración / finanzas | Reponer equipo perdido sin poder cobrarlo | Multas ligadas al tutor + reportes |
| Maestro / homeroom | No sabe qué alumno tiene qué | Vista por grado/homeroom |

### 3.2 Guion de demo — 25 minutos, en orden del calendario escolar

La narrativa que funciona es **el año escolar**, no el mapa de features.

**Acto 1 · "Es agosto, llegan 800 alumnos" (5 min)**
- Empresa configurada como `Education`: la app ya se adaptó — dice "Students",
  el ícono es una escuela, aparecen Grade y Homeroom, y el track genérico de
  consumidores desaparece. *Gancho: "no es un CRM disfrazado de escuela".*
- Importar la matrícula desde el XLSX que ya exportan de su SIS.
- Un tutor con 3 hijos: se vincula por email, no se duplica.

**Acto 2 · "Antes de entregar nada, el tutor firma" (7 min) — el momento fuerte**
- Ajustes de cumplimiento: exigir consentimiento de tutor + COPPA para <13.
- Subir el AUP de la escuela como documento, asignarlo como el consentimiento
  vigente (con fecha de expiración).
- Enviar la solicitud → abrir el link como si fuéramos el tutor, en el teléfono,
  sin cuenta ni contraseña → leer el documento y firmar.
- Volver al panel: el alumno pasó a "Agreed".
- **Cerrar con la compuerta:** intentar asignar un dispositivo a un alumno sin
  consentimiento → la app lo bloquea. *"No es un recordatorio. Es un candado."*

**Acto 3 · "Entrega de 30 equipos en un aula" (4 min)**
- Escanear seriales, fecha de devolución esperada, contrato de responsabilidad
  por email al tutor (no al menor).

**Acto 4 · "Es noviembre y hay 40 equipos vencidos" (4 min)**
- Tablero de vencidos filtrado por grado, recordatorio masivo a los tutores.
- Portal familiar: el papá consulta qué tiene su hijo, sin cuenta.

**Acto 5 · "Es junio, cierre de ciclo" (5 min)**
- Devolución masiva de fin de ciclo.
- Devolución dañada con nota → **multa al tutor** *(requiere B1 resuelto)*.
- Promoción de grado de toda la escuela y graduación de 12°.
- Export XLSX de matrícula, vencidos y multas.

### 3.3 Situaciones reales que la app resuelve

1. "Perdimos 30 Chromebooks y no sabemos quién los tenía" → préstamo con dueño, fecha y estado.
2. "Entregamos equipo a un menor sin permiso del tutor" → compuerta dura, no aviso.
3. "El tutor dice que nunca firmó" → consentimiento con firma, timestamp y versión de política.
4. "Junio es un mes de perseguir equipos" → vencidos + recordatorios + devolución masiva.
5. "No podemos cobrar lo perdido" → multa ligada al tutor *(pendiente B1)*.
6. "Auditoría nos pide quién accedió al registro del menor" → *(pendiente B2)*.
7. "Cada agosto rehacemos el Excel" → promoción de grado versionada.
8. "El maestro no debería ver toda la escuela" → roles con alcance *(alumno pendiente)*.

### 3.4 Qué NO prometer todavía

Ser explícito aquí evita un piloto fallido:
- Multas cobrables (B1) y bitácora de auditoría (B2) → prometer como roadmap con fecha.
- Año académico/términos y catálogos de grado (B4).
- Maestro limitado a su homeroom.
- Integración/sincronización con SIS (Clever, ClassLink, PowerSchool) — hoy es XLSX.
- Firma electrónica con validez legal certificada (es nombre + timestamp, no DocuSign).

---

## 4. Costo-beneficio a $300/mes

> ⚠️ **Todo esta sección es [supuesto]** — modelo con supuestos explícitos, no
> datos medidos. Los insumos marcados **(⬜ dato que falta)** deben venir de
> facturación real antes de usar esto en una decisión de precio.

### 4.1 Referencia: escuela mediana

| Parámetro | Valor |
|---|---|
| Alumnos | 800 |
| Dispositivos 1:1 | 850 |
| Staff con acceso | 25 (ilimitado en el plan) |
| Costo de reposición por equipo | $350 |
| Suscripción | $300/mes = **$3.600/año** |

### 4.2 Valor para la escuela (beneficio anual)

**a) Recuperación de pérdida y daño — el driver principal**

Sin control, la pérdida/daño no recuperada en programas 1:1 se estima en 3-5%
anual. Con dueño identificado, contrato firmado por el tutor y multa cobrable:

| Escenario | Equipos no recuperados evitados | Valor |
|---|---|---|
| Conservador | 6 | $2.100 |
| Base | 12 | $4.200 |
| Optimista | 20 | $7.000 |

*El escenario base ya supera la suscripción por sí solo.* **Depende de B1.**

**b) Tiempo de personal**

El coordinador de tecnología dedica el pico de agosto/septiembre y mayo/junio a
rastrear equipos en hojas de cálculo.

| Concepto | Horas/año | Costo cargado $30/h | Valor |
|---|---|---|---|
| Entrega de inicio de ciclo | 80 | | $2.400 |
| Persecución de vencidos | 120 | | $3.600 |
| Recolección de fin de ciclo | 100 | | $3.000 |
| **Total** | **300** | | **$9.000** |

Suponiendo que la app elimina un 50% conservador: **$4.500/año**.

**c) Riesgo de cumplimiento evitado** — no cuantificable con honestidad, pero es
frecuentemente el argumento que cierra la venta en un distrito. Se presenta
como reducción de riesgo, no como ahorro en dólares.

**Beneficio total (base): $4.200 + $4.500 = $8.700/año**
**Costo: $3.600/año → ROI ≈ 2,4× · payback ≈ 5 meses**

Rango honesto: **1,5× (conservador, sin multas) a 3,2× (optimista)**.

### 4.3 Costo para nosotros por cliente/mes

| Concepto | Estimado | Nota |
|---|---|---|
| Almacenamiento (PDFs de consentimiento, contratos, imágenes) | $0,05-0,50 | 1-5 GB a ~$0,023/GB. **"Ilimitado" es un riesgo bajo aquí: son PDFs, no video.** |
| Transferencia de salida | $1-5 | ⬜ dato que falta |
| Cómputo / base de datos (parte proporcional) | $8-20 | ⬜ dato que falta |
| Email transaccional (consentimientos + recordatorios) | $2-6 | ~2.000-5.000 emails/mes |
| Soporte | **$25-75** | **El costo real.** 1-3 h/mes a $25/h |
| **Total marginal** | **$36-106** | Margen bruto **65-88%** |

**Dónde está el riesgo de "ilimitado":**
- *Almacenamiento ilimitado* → riesgo **bajo**. Son documentos, no multimedia.
  Mitigación: la expiración de documentos que acabamos de implementar ya da la
  base para una política de retención.
- *Staff ilimitado* → riesgo **bajo-medio**. No cobrar por asiento simplifica la
  venta (es exactamente la objeción de una escuela: "¿tengo que pagar por cada
  maestro?"). El costo marginal por usuario es casi nulo; el riesgo es el
  soporte, no la infraestructura.
- El riesgo real no es ninguno de los dos: **es el soporte del primer año** y
  el costo de migrar su Excel.

### 4.4 Unit economics

| Métrica | Valor | Nota |
|---|---|---|
| ARPU | $3.600/año | |
| Costo marginal | $430-1.270/año | |
| Margen bruto | 65-88% | |
| CAC | ⬜ dato que falta | ciclo de venta escolar: 3-9 meses, atado al presupuesto |
| Churn esperado | bajo | costo de cambio alto una vez que la matrícula vive aquí |
| LTV a 5 años, 75% margen | ~$13.500 | |

**Implicación de precio:** a $300/mes con 800 alumnos, son **$0,375 por alumno
por mes**. Ese número es el que hay que decir en la reunión — es más fácil de
aprobar que "$3.600 al año". Contra el costo de un solo Chromebook perdido
($350), la suscripción anual se paga con ~10 equipos recuperados.

**Riesgo de dejar valor en la mesa:** $300 plano favorece fuertemente a las
escuelas grandes. Una escuela de 2.500 alumnos paga lo mismo que una de 300,
con 8× el soporte y el volumen de datos. Vale considerar tramos por matrícula
(p. ej. <500 / 500-1.500 / >1.500) *después* del piloto, cuando haya datos
reales de costo de soporte.

### 4.5 Recomendación comercial

1. **Piloto pagado** con 1-3 escuelas ancla a $300/mes, con B1 y B2 comprometidos
   por escrito con fecha.
2. ⚠️ **CORRECCIÓN (2026-08-04):** el trial de 30 días **NO existe**.
   `getTrialEndDate()` en `subscription/utils/trialPeriodReference.jsx` está
   definido y exportado pero **no lo importa ningún archivo** — es código
   muerto. No hay estado de trial, ni cuenta regresiva, ni chequeo de
   expiración. Un trial hay que construirlo. Ver §6.
3. Cobrar aparte la migración/onboarding inicial (setup fee) — es donde se va el
   costo real del primer mes y donde el cliente sí percibe valor.
4. No vender a distritos multi-escuela hasta cerrar B4 (año académico) y el
   alcance de rol por alumno.
5. Instrumentar antes del piloto: horas de soporte por cliente, GB almacenados,
   emails enviados. Sin eso, la revisión de precio del año 2 será a ciegas.

---

## 5. Siguientes pasos concretos

| # | Acción | Dueño | Bloquea |
|---|---|---|---|
| 1 | Confirmar contrato backend de `fee_amount`/`fee_reason` y activar `FEATURE_MEMBER_FEES` | backend + frontend | Acto 5 de la demo, ROI |
| 2 | Conectar fuente de datos a la bitácora de auditoría | backend + frontend | Venta a distritos |
| 3 | Endpoint público del documento de consentimiento scoped por `otc` | backend | Acto 2 de la demo |
| 4 | T-10.1 (matriz rol × `member:*`) y T-9.1 (aislamiento entre empresas) | frontend | Riesgo de seguridad |
| 5 | `cypress/e2e/school/` + scripts `test:school`/`test:consent` + sembrado en CI | frontend/QA | Confianza en la demo |
| 6 | Instrumentar costo por cliente (soporte, GB, emails) | ops | Precio año 2 |

---

## 6. Modelo de suscripción — estado real y recomendación

> Auditoría de `subscription/**`, `Profile/billing/**`, `subscriptionSlice`,
> `stripeSlice` y los componentes Stripe (2026-08-04). **[verificado]**

### 6.1 Hallazgo principal: no hay sistema de suscripción que extender

Lo que existe hoy:

| Componente | Estado real |
|---|---|
| Selector de planes (`subscription/MainPage.jsx` → `PricingTable.jsx`) | **Shell no funcional.** El tier 1 tiene el botón habilitado pero llama `handleSubmitEventPayment("00")`, que choca con el guard `!== "00"` y **retorna en silencio**. Los tiers 2 y 3 son `<Button disabled>` (L206, L305). Todos los "Contact sales" están `disabled`. El copy de los 3 tiers es literalmente `Lorem ipsum` (L110, L202, L301). **Hoy nadie puede comprar un plan desde esa página.** |
| Entitlements / cuotas / asientos | **No existen.** `components/json/subscriptionList.json` declara `adminUser` (límite de asientos) y `database-limit` (cuota) — pero se importa en solo 4 archivos y en todos se usa **únicamente para renderizar copy de marketing**. Nunca se comparan contra nada. |
| Gating por suscripción | **Cero.** `AuthRoutes.jsx` no tiene ningún check de suscripción; no hay `<RequireSubscription>`. Nada queda read-only ni bloqueado por estado de pago. |
| El único límite que existió | Máx. 1 evento en free tier — **comentado a propósito** (`PricingTable.jsx:25` y `:113`). Fósil de la única cuota que llegó a existir. |
| Trial | **No existe.** `getTrialEndDate()` es código muerto (ver corrección en §4.5). |
| Lo que **sí** funciona | Crear suscripción en Stripe sobre la **cuenta plataforma** (`/stripe/create-subscriptions` → `/subscription/new_subscription`), cancelar (`ModalCancelOptions` → `/stripe/subscriptions/:id` con `cancelAtPeriodEnd`), y listar facturas (`GET /stripe/invoices`). |

### 6.2 Trampa crítica: "subscription" significa tres cosas distintas

| | Significado | Dónde |
|---|---|---|
| A | Suscripción SaaS (la escuela nos paga) — cuenta **plataforma** Stripe | `state.subscription.subscriptionRecord`, `/subscription/*` |
| B | Flag de depósito **por evento** — nada que ver con facturarnos | `state.subscription.subscription` |
| C | **Stripe Connect** — el cliente cobra a *sus* usuarios finales | `companyData.stripe_connected_account`, `Profile/stripe_connected_account/**` |

`state.subscription.subscription` es **B**, pero `PricingTable.jsx` también le escribe un objeto de plan (**A**) encima. Misma llave, dos significados incompatibles: **bug latente**. Cualquier gate construido sobre esa llave hoy fallaría de forma silenciosa.

### 6.3 Deuda que hay que pagar antes de poder confiar en un cobro

1. **Dos fuentes de verdad desincronizadas** para el mismo hecho: `state.subscription.subscriptionRecord` (vía `/subscription/*`) vs `state.admin.companyAccountStripe.subscriptionHistory` (vía `/stripe/updating-subscription`). Colapsar en una.
2. **Login no hidrata la suscripción** — `subscriptionRecord` es `[]` en cada sesión nueva. Un gate que lo leyera hoy siempre vería "sin plan".
3. **Price IDs de Stripe hardcodeados en el frontend** (`PricingTable.jsx:34-55`), con selección de entorno por parsing de la publishable key. Los mapas cents→nombre de plan están inconsistentes (`32000` vs el real `36000`) y `PlanSubscriptionDetails.jsx:280` muestra un `<Progress percent={80}>` **hardcodeado** — lo único que *parece* un medidor de cuota en toda la app y no está ligado a nada.
4. **El modal de upgrade es no funcional**: los 3 botones sin `onClick`, `clientSecret` nunca se setea, y `amountSubTierDisplay` es un `useRef` mutado dentro de un `.map` de render → las 3 celdas de precio muestran el mismo valor.

### 6.4 Por qué el modelo de tramos es el correcto — y el único vendible ya

**Tramos planos por matrícula, anual, todo ilimitado** (ver §6.5) tiene una
propiedad que ningún otro modelo tiene dado este estado del código:
**no requiere construir enforcement técnico.**

- Staff ilimitado → nada que contar en asientos.
- Almacenamiento ilimitado → nada que medir.
- Dispositivos ilimitados → nada que limitar.
- La matrícula se verifica **una vez al año, comercialmente, en la renovación** — no en runtime.

Es decir: se puede **vender y cobrar hoy** con proceso comercial + una factura,
sin sistema de entitlements. Cualquier modelo por asiento, por dispositivo o
medido exigiría construir primero todo lo de §6.3.

### 6.5 Tramos recomendados

| Tramo | Matrícula | Anual | Equiv./mes | $/alumno/año |
|---|---|---|---|---|
| Essential | ≤400 | $2.400 | $200 | $6,00 |
| **Core** | 401–1.200 | **$3.600** | **$300** | $3,00–8,98 |
| Campus | 1.201–2.500 | $6.600 | $550 | $2,64–5,50 |
| District | >2.500 / multi-escuela | a cotizar | | |

Todos incluyen los 3 módulos, staff/dispositivos/almacenamiento ilimitados,
portal del tutor y flujo de consentimiento. **Fee único de onboarding**
$500–1.500 según matrícula (ahí vive el costo real del primer año).

**Mecánica de cobro** (más importante que el precio):
- **Factura anual con PO, net 30** — no tarjeta recurrente. Muchas escuelas
  públicas no pueden pagar servicios recurrentes con tarjeta.
- **Término alineado al año escolar** (jul 1 – jun 30); alta a mitad de año se
  prorratea hasta jun 30.
- Tarjeta mensual solo para Essential (privadas chicas, decisión rápida).
- Cotización de renovación en **feb–mar** (temporada de presupuesto).

**Descartados:**
- *Per-seat/staff* — **activamente dañino**: cada maestro necesita lectura; cobrar por asiento induce logins compartidos, que destruyen la bitácora de auditoría que estamos vendiendo como feature de cumplimiento.
- *Por dispositivo* — castiga al mejor cliente (1:1 completo) y fluctúa con roturas.
- *Medido por alumno* — factura variable (las escuelas la rechazan) y además `POST /db_member/consulting-member` devuelve el arreglo completo de miembros, no un conteo: no es endpoint de metering.
- *Desagregar módulos* — el diferenciador es la integración dispositivo→alumno→tutor→consentimiento. Vender inventario suelto nos convierte en un rastreador genérico compitiendo por precio.

### 6.6 Qué construir, en orden

**Para poder cobrar (mínimo viable, ~1 sprint):**
1. Catálogo de planes **desde el backend**, no hardcodeado en el frontend.
2. Colapsar las dos fuentes de verdad de §6.3 en una.
3. Renombrar la llave sobrecargada `state.subscription.subscription` (§6.2).
4. Hidratar el estado de suscripción en el login.
5. Registrar término y matrícula contratada en el registro de la compañía
   (para la renovación; no para bloquear).

**Solo si más adelante se quiere trial o autoservicio:**
6. Estado de trial real + expiración (hoy no existe nada).
7. Limpiar/retirar el `PricingTable` no funcional en lugar de dejarlo visible
   con Lorem ipsum y botones muertos.

**No construir todavía:** entitlements, medidores de cuota, gates por plan.
Con tramos planos no se necesitan, y construirlos sobre la deuda de §6.3
produciría fallos silenciosos.

### 6.7 Distritos

**No existe jerarquía de distrito** — las compañías no tienen `parent_id` (solo
las *ubicaciones* tienen árbol padre/sub-ubicación) y el multi-tenant es
membresía plana por usuario vía `/db_staff/companies` con selector al login.
Un distrito de 12 escuelas hoy = 12 compañías, 12 suscripciones, sin reporte
agregado, y el director de TI cambiando de compañía constantemente.
Vender escuela por escuela; el distrito requiere capa org + reporte
cross-escuela + suscripción a nivel padre.
