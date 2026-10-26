# Plan de acción del dashboard hacia una postura certificable

> **2026-09-28.** Derivado de `Devitrak FedRAMP Readiness.html` (Cesar, 15–16
> sept) y de `FRONTEND_readiness_review_2026-09-28.md`.
>
> **Alcance:** lo que le toca a **este repositorio**. Se dice en cada punto de
> qué depende y de quién, pero no se planifica trabajo ajeno.

---

## 0. Lo primero, porque cambia las expectativas

**El dashboard es la parte pequeña.** De las tres puertas que bloquean FedRAMP
—certificación previa, cliente federal, autohospedaje— el frontend no toca
ninguna. De los 99 huecos del informe, la mayoría son backend, infraestructura y
papeleo.

Lo que sí es nuestro son **cuatro cosas**: dejar de publicar secretos, dejar de
recibir hashes, dejar de ser uno de los tres sistemas de autorización
descoordinados, y empezar a tener un proceso que un evaluador pueda mirar.

Y hay algo que conviene decir antes de gastar una hora: **este plan no acerca
FedRAMP por sí solo.** Acerca SOC 2 y GovRAMP, que son las puertas reales, y
sirve igual si mañana se decide que FedRAMP no era el objetivo. Esa decisión
—la primera pregunta abierta del informe de Cesar— debería tomarse antes de
comprometer la Fase 1.

---

## 1. Fase 0 — días, y no desplaza nada

Corresponde a la "Phase 0 · Stop the bleeding" del informe. Aquí está lo que de
esa fase es frontend.

### F0.1 — Dos de los cuatro secretos del bundle son código muerto

**Verificado hoy:** `twilio_auth_token` y `secrete_key_encrypt` se exportan desde
`src/config/ConfigEnvExport.jsx` y **no los consume nadie**. Cero referencias en
todo `src/` fuera de ese fichero.

No hay que moverlos al servidor ni reconstruir ninguna función: **se borran**.
Cuatro líneas.

> Pero **hay que rotarlos igual.** Estaban referenciados, así que Vite los
> inlineó, así que se han servido. Borrarlos limpia el bundle de mañana; no
> limpia el de ayer.

| | |
|---|---|
| Ficheros | `src/config/ConfigEnvExport.jsx` |
| Esfuerzo | minutos |
| Depende de | nadie, para el borrado. De quien tenga las cuentas, para rotar |

### F0.2 — El tercero sí se usa, y es una credencial estática

`header_auth_token` viaja como cabecera fija `auth-token` en la instancia
`devitrakAWSApi` (`src/api/devitrakApi.jsx:195`). Es una credencial compartida,
la misma para todos los usuarios, embebida en JavaScript público.

No se arregla desde aquí solo: hace falta que ese servicio acepte una credencial
por sesión —el JWT que ya emitimos— en vez de un token compartido. Mientras
tanto: **rotar, y dejar la exposición escrita** en vez de que viva sin dueño.

| | |
|---|---|
| Ficheros | `src/api/devitrakApi.jsx:195`, `ConfigEnvExport.jsx` |
| Esfuerzo | horas nuestras, más una decisión del backend |
| Depende de | el servicio AWS detrás de `devitrakAWSApi` |

### F0.3 — Dejar de recibir hashes de contraseña

Hallazgo 06 del informe, y confirmé que son exactamente dos sitios:

```
src/pages/authentication/signatureVerificationDocuments/StaffMember.jsx:183
src/pages/Profile/my_password/components/Body.jsx:53
    compareSync(data.current_password, adminInfo.password)
```

Los dos comparan en el navegador contra el hash bcrypt del administrador. El
backend deja de servirlo y estas dos pantallas dejan de funcionar el mismo día,
así que **es un cambio coordinado o no es ningún cambio**.

Lo que va aquí: un endpoint que verifique la contraseña actual del lado del
servidor, y estas dos pantallas llamándolo.

| | |
|---|---|
| Esfuerzo | días, coordinado |
| Depende de | el backend, a la vez, no antes ni después |

### F0.4 — Validar el entorno al arrancar

No está en el informe y sale de revisarlo: `VITE_APP_HEADER_AUTH_TOKEN`,
`VITE_APP_SECRETE_KEY_ENCRYPT` y `VITE_APP_TWILIO_AUTH_TOKEN` los referencia el
código y **no los declara ni `.env.dev` ni `.env.dev.example`**. En desarrollo
valen `undefined` y nadie se entera.

Es la misma raíz que el hallazgo 03 —`NODE_ENV` sin definir en ninguna parte—:
**nadie comprueba el entorno**. Una validación al inicio que falle nombrando lo
que falta cierra la clase entera, no estos tres casos.

| | |
|---|---|
| Esfuerzo | medio día, con su test |
| Depende de | nadie |

---

## 2. Fase 1 — lo que hace el dashboard evaluable

Corresponde a "Phase 1 · Make the platform assessable". Son dos trimestres de
dos ingenieros **para todo el sistema**; lo de abajo es la parte frontend.

### F1.1 — Dejar de ser el tercer sistema de autorización · AC-2 / AC-6

El informe nombra tres sistemas descoordinados, y uno es nuestro: *"a legacy
`AdminUser.role` still rendered by the frontend"*.

`src/config/roles.js` ya es la fuente única y `resolveRoleType` el camino
correcto —está en `CLAUDE.md` como regla—, pero mientras quede una pantalla
leyendo el rol numérico heredado, seguimos siendo un sistema paralelo.

El trabajo es un barrido: encontrar cada lectura de `user.role` que no pase por
`resolveRoleType`, y quitarla. Es acotado y verificable con un test que prohíba
el patrón.

### F1.2 — Reconciliar el contrato de la cabecera de tenant · AC-4 / SC-4

**Aquí discrepo del informe, y con evidencia.** Dice: *"The frontend doesn't send
that header at all, so tenant context arrives in request bodies."*

Sí la mandamos. `src/api/devitrakApi.jsx:101` aplica `buildRouteScopedHeaders`
en cada petición, con el reparto que documenta `CLAUDE.md`:

```
x-company-id  → /api/staff, /api/admin, /api/company, /api/stripe
s-company-lq  → /api/db_*
```

Lo que no puedo comprobar —y no voy a tocar el repositorio del backend— es **qué
cabecera lee el servidor**. Si lee otra, eso explica las dos mitades de su
hallazgo: la cabecera que busca no llega nunca y por eso cae al cuerpo.

**La acción no es reconstruir el frontend. Es una conversación de media hora con
el backend** para poner nombre a la cabecera que ambos lados usan. Si resulta
que coinciden, parte de un hallazgo marcado "Rearchitect" se cae solo.

### F1.3 — CI, que hoy no existe · CM-3 / CM-6

Confirmado: **15 merges de PR sobre 4.775 commits, 0,31 %**. Nada corre antes de
producción.

Lo mínimo que un evaluador espera ver, y que además nos sirve hoy:

- Revisión obligatoria en `main`.
- La suite —4.054 pruebas— como puerta, no como costumbre.
- Lint como puerta. Hoy `npm run lint` da 1.396 problemas con `--max-warnings 0`,
  así que hay que fijar la línea base antes de poder exigirla.
- Puerta de dependencias. Venimos de 125 alertas a 7; sin puerta, eso se deshace
  solo.

> La discipline ya existe como artefactos: 4.054 pruebas, Dependabot, un
> `deploy-node.ps1` que el propio informe elogia. Lo que falta es que **algo las
> obligue**. El informe lo dice mejor: *"the quality exists as artifacts, not as
> enforced process"*.

### F1.4 — Inventario de módulos criptográficos

El informe señala que no hay requisito de FIPS 140-3 por debajo de Class D, pero
**sí es un MUST para todos** tener el inventario de qué cripto se usa y si está
validada por CMVP. Y dice que es barato.

Del lado cliente hay al menos: `bcryptjs` (comparación en el navegador, que F0.3
elimina), un `VITE_APP_ENCRYPTION_ALGORITHM` que viaja en el bundle, y lo que use
`jszip`/`react-pdf` por debajo. Es una tarde de inventario, y hay que hacerla
igual para SOC 2.

---

## 3. Lo que el dashboard ya aporta, y conviene no perder

No todo está por hacer, y para un evaluador esto cuenta:

- **SI-4 ya no es el hueco que el informe describe.** Cloudflare vigila desde
  fuera, Kuma por dentro, los dos avisan a Teams, hay dead-man en los schedulers
  y una página pública de estado. El informe se escribió antes.
- **Las alertas de dependencias pasaron de 125 a 7.**
- **MFA obligatorio en el cliente**, con el enrolamiento forzado. Falta que el
  servidor lo exija, que está en nuestra lista.
- **El namespace `/api/school`** es, según el propio informe, *"the
  best-engineered surface in the codebase"*, con auditoría de acceso a PII y
  endpoints FERPA. Es el patrón al que reconstruir el resto.

---

## 4. Lo que hay que dejar de hacer

Dos cosas pequeñas con lectura de control:

- **192 `console.*` viajan al bundle de producción.** `terserOptions.drop_console`
  no se aplica porque falta `minify: "terser"`. Una línea, y evita que algo
  sensible acabe en la consola de un cliente.
- **Desplegar sin puerta.** Es F1.3, pero merece decirse como hábito y no solo
  como tarea.

---

## 5. Secuencia, y qué desplaza

| | Qué | Cuándo | Desplaza |
|---|---|---|---|
| **F0.1** | Borrar los dos secretos muertos + rotar | esta semana | nada |
| **F0.4** | Validación de entorno al arrancar | esta semana | nada |
| **F0.2** | Rotar `header_auth_token` y documentarlo | esta semana | nada |
| **F0.3** | Hashes fuera del cliente | con el backend | poco |
| **F1.3** | CI con puertas | Q4 | una semana |
| **F1.2** | Alinear la cabecera de tenant | Q4 | media hora + lo que revele |
| **F1.1** | Barrer el rol heredado | Q4–Q1 | semanas |
| **F1.4** | Inventario cripto | cuando toque SOC 2 | una tarde |

**Toda la Fase 0 cabe en una semana y no compite con nada.** La Fase 1 sí
compite: son los mismos dos ingenieros que tienen 30 ítems abiertos en
`FRONTEND_open_tasks_2026-09-24.md`, tres de ellos bloqueando, más la prioridad
que Fredrik fijó el 25.

---

## 6. La decisión que va antes que todo esto

El informe de Cesar la plantea primero y tiene razón: **¿por qué queremos
FedRAMP?**

Este plan es idéntico si la respuesta es «para cerrar Bridges», «para SOC 2» o
«porque nuestra seguridad es mala y queremos una función forzante». Cambia solo
si la respuesta es «hay un cliente federal concreto», y hoy no lo hay.

Por eso la Fase 0 va igual, sin esperar a nadie: **nada de lo que hay en ella se
desperdicia con ninguna respuesta posible**, y todo deja de exponer datos de
menores y de pagos mientras tanto.
