# Agente — Guía de Skills para Desarrollo

Referencia de qué skill invocar según la tarea. Este archivo aplica a `testing-admin-dashboard` y proyectos derivados.

Stack: **React + Vite 5 · Ant Design 5 · MUI 5 · Vitest · Cypress · Redux**

---

## Skills disponibles y cuándo usarlos

### `/run` — Iniciar y verificar la app en el navegador
**Usar cuando:**
- Se implementa una feature nueva y hay que verla funcionar en el browser
- Se reporta un bug visual y hay que reproducirlo
- Se termina cualquier cambio de UI antes de declararlo listo

**Cómo funciona aquí:**
- Dev server: `npm run dev` → `http://localhost:5522`
- Cypress corre en: `http://localhost:5523`
- El skill detecta Vite automáticamente

```
/run
```

---

### `/verify` — Confirmar que un cambio funciona correctamente
**Usar cuando:**
- Se corrige un bug y hay que demostrar que está resuelto
- Se hace un PR y se quiere validar el golden path antes de mergear
- Se pide explícitamente "verifica que esto funciona"

**Diferencia con `/run`:** `/verify` valida el comportamiento esperado, no solo que corra.

```
/verify
```

---

### `/code-review` — Revisar el diff actual en busca de bugs y mejoras
**Usar cuando:**
- Antes de crear un PR
- Después de un refactor grande
- Cuando se quiere una segunda opinión sobre la implementación

**Niveles de esfuerzo:**
- `--effort low` → hallazgos rápidos, alta confianza
- `--effort high` → cobertura amplia, incluye hallazgos inciertos
- `--comment` → publica los hallazgos como comentarios inline en el PR
- `--fix` → aplica las correcciones directamente

```
/code-review
/code-review --effort high
/code-review --comment
```

---

### `/security-review` — Auditoría de seguridad del branch actual
**Usar cuando:**
- Se agregan endpoints nuevos en `src/api/`
- Se modifican rutas o guards en `src/routes/`
- Se tocan componentes de pago (Stripe)
- Se manejan tokens, sesiones o permisos de usuario
- Antes de releases importantes

```
/security-review
```

---

### `/simplify` — Limpiar y simplificar código después de implementar
**Usar cuando:**
- Se terminó una feature y el código quedó más complejo de lo necesario
- Hay duplicación evidente entre componentes nuevos y existentes
- Se detectan abstracciones prematuras o código muerto

**Nota:** Solo calidad — no busca bugs. Para bugs usar `/code-review`.

```
/simplify
```

---

### `/review` — Revisar un Pull Request de GitHub
**Usar cuando:**
- Se recibe un PR de otro desarrollador para revisar
- Se quiere análisis completo de un PR antes de aprobarlo

**Diferencia con `/code-review`:** `/review` apunta a un PR de GitHub; `/code-review` trabaja sobre el diff local actual.

```
/review https://github.com/org/repo/pull/123
```

---

### `/deep-research` — Investigación técnica multi-fuente
**Usar cuando:**
- Se evalúa adoptar una librería nueva (alternativas a Ant Design, state managers, etc.)
- Se investiga un patrón de arquitectura antes de implementarlo
- Se necesita contexto técnico profundo sobre una tecnología del stack

**Tip:** Ser específico con la pregunta. En vez de "¿qué librería de tablas usar?" → "¿Qué librería de tablas React soporta virtualización, edición inline y export CSV, compatible con Ant Design 5?"

```
/deep-research
```

---

### `/init` — Crear CLAUDE.md con documentación del codebase
**Usar cuando:**
- Se inicia un proyecto derivado nuevo y no tiene `CLAUDE.md`
- Se quiere que el agente tenga contexto completo del proyecto desde el inicio

**Nota:** Este proyecto aún no tiene `CLAUDE.md`. Ejecutar una vez para generarlo.

```
/init
```

---

### `/update-config` — Modificar configuración del agente (settings.json)
**Usar cuando:**
- Se quiere automatizar un comportamiento ("cada vez que termines, ejecuta los tests")
- Se agregan permisos para comandos frecuentes (evitar prompts repetitivos)
- Se configuran hooks (pre/post tool calls)
- Se definen variables de entorno para el agente

**Ejemplos de uso en este proyecto:**
- Permitir `npm run dev` sin prompt
- Permitir `vitest run` sin prompt
- Hook post-edición: ejecutar lint automáticamente

```
/update-config
```

---

### `/fewer-permission-prompts` — Reducir prompts de permisos
**Usar cuando:**
- Los prompts de permisos interrumpen demasiado el flujo de trabajo
- Se identificaron comandos de solo lectura que siempre se aprueban

**Cómo funciona:** Escanea transcripts y agrega allowlist al `.claude/settings.json`.

```
/fewer-permission-prompts
```

---

### `/loop` — Ejecutar una tarea de forma recurrente
**Usar cuando:**
- Se quiere monitorear el estado de algo mientras se trabaja en otra cosa
- Se necesita re-ejecutar un check automáticamente cada N minutos

**Ejemplo:** `/loop 2m /verify` para re-verificar cada 2 minutos durante desarrollo activo.

```
/loop 5m /run
```

---

### `artifact-design` — Guía de diseño para Artifacts (páginas HTML)
**Usar cuando:**
- Se va a crear un Artifact visual (dashboard, reporte, mockup)
- Se necesita calibrar el nivel de diseño apropiado antes de generar HTML

**Nota:** Invocar SIEMPRE antes del primer `show_widget` o `Artifact`.

---

### `/anthropic-skills:xlsx` — Trabajar con archivos Excel
**Usar cuando:**
- Se exportan reportes de inventario, consumidores o eventos a `.xlsx`
- Se procesan importaciones masivas de datos desde Excel

---

### `/anthropic-skills:pdf` — Trabajar con archivos PDF
**Usar cuando:**
- Se generan reportes en PDF (recibos, reportes de eventos, etc.)
- Se extrae información de PDFs subidos por el usuario

---

### `/anthropic-skills:pptx` — Trabajar con presentaciones PowerPoint
**Usar cuando:**
- Se generan presentaciones de resultados o dashboards para stakeholders

---

---

## Flujo recomendado por tipo de tarea

### Implementar una feature nueva
```
1. (opcional) /deep-research  → investigar si hay patrón/librería mejor
2. Implementar
3. /run                       → ver en browser
4. /verify                    → confirmar comportamiento correcto
5. /simplify                  → limpiar el código
6. /code-review               → revisión final antes de PR
```

### Corregir un bug
```
1. /run                       → reproducir el bug
2. Corregir
3. /verify                    → confirmar que está resuelto
4. /code-review --effort low  → revisar que no se introdujeron regresiones
```

### Modificar rutas, permisos o API
```
1. Implementar cambios
2. /security-review           → auditoría de seguridad obligatoria
3. /verify
4. /code-review
```

### Revisar un PR entrante
```
1. /review <url-del-pr>
```

### Configurar el entorno de desarrollo
```
1. /init                      → generar CLAUDE.md (solo primera vez)
2. /update-config             → permisos y hooks
3. /fewer-permission-prompts  → reducir interrupciones
```

---

## Referencia rápida

| Tarea                              | Skill                      |
|-----------------------------------|----------------------------|
| Ver la app corriendo               | `/run`                     |
| Confirmar que algo funciona        | `/verify`                  |
| Revisar código local               | `/code-review`             |
| Revisar PR de GitHub               | `/review`                  |
| Auditoría de seguridad             | `/security-review`         |
| Limpiar y simplificar código       | `/simplify`                |
| Investigar librería/patrón         | `/deep-research`           |
| Generar CLAUDE.md inicial          | `/init`                    |
| Configurar settings y permisos     | `/update-config`           |
| Reducir prompts de permisos        | `/fewer-permission-prompts`|
| Tarea recurrente / polling         | `/loop`                    |
| Exportar Excel                     | `/anthropic-skills:xlsx`   |
| Generar / leer PDF                 | `/anthropic-skills:pdf`    |
| Crear presentación                 | `/anthropic-skills:pptx`   |
| Diseñar Artifact HTML              | `artifact-design`          |
