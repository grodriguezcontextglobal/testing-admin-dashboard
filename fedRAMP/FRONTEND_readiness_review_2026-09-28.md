# Revisión del informe de readiness FedRAMP — desde el frontend

> **2026-09-28.** Revisión de `Devitrak FedRAMP Readiness.html` (investigación
> 15–16 sept, contra `origin/main @ a92b942` del backend).
>
> Lo que aporto es lo único que el informe no pudo hacer: **contrastar contra
> este repositorio** los hallazgos que caen de nuestro lado, y decir qué ha
> cambiado en los doce días desde la investigación.

---

## 1. Veredicto

El informe es bueno, y no por el tema: por cómo está construido. Separa lo
verificado de lo inferido, cita identificadores de regla en vez de parafrasear,
lleva una sección entera de **lo que no pudo verificar**, y dice que las
afirmaciones refutadas se eliminaron en vez de suavizarse. Eso último es raro y
es lo que hace que el resto se pueda creer.

**No tengo correcciones de fondo que hacerle.** Tengo tres confirmaciones, un
matiz, un hallazgo caducado y una omisión en la Fase 0.

---

## 2. Confirmado contra este repositorio

### Hallazgo 06 — `compareSync` en el cliente: exacto, y son estos dos

> *"the frontend depends on it, calling `compareSync` client-side in two
> places."*

Correcto, y son exactamente dos:

```
src/pages/authentication/signatureVerificationDocuments/StaffMember.jsx:183
src/pages/Profile/my_password/components/Body.jsx:53
    compareSync(data.current_password, adminInfo.password)
```

La segunda es la que retrata el problema: compara la contraseña actual contra
`adminInfo.password`, **el hash bcrypt del administrador, en el navegador**. Su
conclusión de que arreglar solo el backend rompe el login es correcta: estas dos
pantallas dejan de funcionar el día que el endpoint deje de servir el hash.

### CM-3 — el porcentaje de pull requests: exacto

> *"14 of 4,661 frontend commits (~0.3%) ever went through a pull request."*

Hoy: **15 merges de PR sobre 4.775 commits = 0,31 %.** La diferencia es esta
semana. La cifra está bien tomada.

### Hallazgo 02 — el mecanismo, demostrado ahora mismo

Vite sustituye cada `import.meta.env.VITE_*` por su **valor literal** en tiempo
de construcción. Lo comprobé sobre el `dist/` recién construido buscando los
valores, no los nombres —buscar el nombre no prueba nada, porque el nombre
desaparece justo al sustituirse—. Cinco valores de `.env.dev` están dentro del
JavaScript servido:

```
VITE_APP_AWS_API · VITE_APP_DEVITRACK_API · VITE_APP_DEVITRACK_API_BACKUP
VITE_APP_ENCRYPTION_ALGORITHM · VITE_APP_PUBLIC_STRIPE_KEY
```

De esos, la clave de Stripe es publicable por diseño y las URLs no son secretos.
**Pero el mecanismo queda probado**: cualquier `VITE_*` que el código referencie
acaba legible en el navegador.

---

## 3. El matiz: los cuatro nombres que cita no existen en desarrollo

El informe nombra `VITE_APP_TWILIO_AUTH_TOKEN`, `VITE_APP_AWS_AUTHORIZER_TOKEN`,
`VITE_APP_HEADER_AUTH_TOKEN` y `VITE_APP_SECRETE_KEY_ENCRYPT`.

| Variable | En `.env.dev` | En `.env.dev.example` | Usos en `src/` |
|---|---|---|---|
| `VITE_APP_HEADER_AUTH_TOKEN` | no | no | 1 |
| `VITE_APP_SECRETE_KEY_ENCRYPT` | no | no | 1 |
| `VITE_APP_TWILIO_AUTH_TOKEN` | no | no | 1 |

**El código las usa y ninguna de las dos plantillas de entorno las declara.** Dos
consecuencias, y las dos son hallazgos por su cuenta:

1. **Su afirmación solo se puede confirmar contra el `.env` de producción.** Si
   ahí están definidas, están en el bundle de producción y su hallazgo es
   exacto. Aquí no lo están, así que en desarrollo esas tres expresiones valen
   `undefined`.
2. **Hay deriva entre el entorno de desarrollo y el de producción.** Un clon
   nuevo arranca con tres variables que el código espera y nadie declara, y
   falla en silencio. Eso encaja con el hallazgo 03 del informe —`NODE_ENV` sin
   definir en ninguna parte— y sugiere que el problema no son tres variables
   sueltas, sino que **nadie valida el entorno al arrancar**.

Sugerencia concreta y barata: una comprobación al inicio que falle si falta
cualquier variable que el código referencia. Cierra esta clase entera de fallo,
no estos tres casos.

---

## 4. Un hallazgo ha caducado: SI-4

> *"No alerting. The team's own meeting notes state plainly «no hay alertas», and
> a Go-worker port mismatch took inventory down for multiple weeks in August 2026
> without detection."*

**Era cierto el 16 de septiembre y ya no lo es.** Desde el 25:

- Un Worker de Cloudflare vigila el uptime del servidor **desde fuera de nuestra
  infraestructura** y avisa por webhook a un canal de Teams.
- Uptime Kuma, en la VM, vigila workers, colas y schedulers, avisa al mismo canal
  y empuja su estado a un endpoint público.
- Los schedulers tienen **dead-man switches** — justo el control que habría
  detectado el desajuste de puerto de agosto.
- Y hay una página pública de estado, `/status`, construida contra ese endpoint.

No cambia el veredicto general, pero SI-4 estaba puntuado en "Weeks" y hoy está
en buena parte cubierto. Si el informe se usa como línea base, conviene anotarlo
para no volver a comprarlo.

**Otro cambio del mismo periodo:** las alertas de dependencias pasaron de **125 a
7** (3 high, 3 moderate, 1 low), confirmado por GitHub en el push de hoy. El
informe cita Dependabot entre lo positivo; el número que tenía detrás ya no es el
mismo.

---

## 5. Lo que le falta a la Fase 0

> *"Move the four `VITE_*` secrets server-side and rebuild the bundle."*

**Mover y reconstruir no basta. Hay que rotarlos**, igual que los ocho del
repositorio.

Un secreto inlineado en el bundle ya se ha servido a cada navegador que abrió la
aplicación. Reconstruir cambia lo que se sirve a partir de mañana; no cambia que
el valor está en el caché, en el historial y en las devtools de cualquiera que
haya entrado. Para los ocho del git el informe sí pide rotación; para estos
cuatro solo pide moverlos, y merecen exactamente el mismo trato.

Y hay un agravante propio de esta aplicación: **es una PWA con service worker y
un precache de 246 entradas**. Los clientes que ya la visitaron conservan los
bundles viejos hasta que el service worker se actualice y ellos acepten el aviso
— que, dicho sea de paso, es el aviso que ahora mismo **no se cierra al pulsar
Refresh** y está en nuestra lista de tareas. El bundle viejo con el secreto
dentro vive en el disco del cliente más tiempo del que intuye.

---

## 6. La tensión que hay que resolver, y no es técnica

El 25 de septiembre Fredrik dijo, sobre la lista de peticiones de esa reunión:

> *"But focus on the FedRAMP … I could actually sell it to the DC government only
> on that … FedRAMP is key."*

Este informe dice que FedRAMP está bloqueado en tres puertas independientes, que
ninguna se abre con trabajo de ingeniería este año, y que lo que sí paga es
Fase 0, 2 y 2b.

Las dos cosas no se contradicen —el informe dice explícitamente que *"the
instinct to start now is correct — it is the target that's wrong"*— pero **sí se
contradicen en lo que uno hace el lunes por la mañana**. Y la herramienta para
resolverlo ya está escrita en el propio informe: su primera pregunta abierta,
*"Why do you want FedRAMP?"*, con las cuatro respuestas posibles y la observación
de que si la respuesta es *"nuestra seguridad es mala y queremos una función
forzante"*, eso es legítimo y esta hoja de ruta la entrega mucho más barata.

Esa conversación con Fredrik vale más que cualquier trabajo técnico de esta
semana. Sin ella, la prioridad que él fijó y el plan que este informe propone van
a competir por las mismas dos personas.

---

## 7. Lo que yo haría esta semana

Coincido con su secuencia, y con este orden dentro de la Fase 0:

1. **Rotar.** Los ocho del repositorio y los cuatro del bundle. Lo demás puede
   esperar una semana; esto no.
2. **`NODE_ENV=production`.** Una línea, cierra la fuga del token de consentimiento
   y devuelve el flag `secure` a las cookies. Es el mejor ratio de toda la lista.
3. **Las cinco rutas peores**, con autenticación.
4. **Los hashes fuera del navegador**, backend y frontend a la vez — y ya sé
   cuáles son las dos pantallas del lado cliente.

Y respondo a una de sus preguntas abiertas con lo que sí puedo aportar: la
pregunta sobre el coste de oportunidad —*"who owns compliance, and what gets
dropped?"*— tiene datos concretos en `FRONTEND_open_tasks_2026-09-24.md`. Son 30
ítems abiertos, 3 de ellos bloqueando. La Fase 1 que él estima en dos trimestres
de dos ingenieros compite exactamente contra esa lista, y la lista está contada
uno a uno, no estimada.
