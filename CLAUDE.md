# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

---

## Critical Tooling Rules

These rules override any generic package-manager or repository-discovery habit:

* Graphify is already installed and available as the native `graphify` CLI in this environment.
* Always invoke Graphify directly as `graphify ...`.
* Never invoke Graphify through `npx`, including `npx --no-install graphify`.
* Never invoke Graphify through `npm exec`, `pnpm exec`, `yarn`, `python -m`, `pipx run`, or any package runner.
* Do not probe for Graphify with `which graphify`, `where graphify`, `Get-Command graphify`, or similar commands before first use.
* Do not list, inspect, or probe `graphify-out/` before first use when repository instructions already establish that `graphify-out/graph.json` exists.
* For a known exact symbol, the first repository-discovery command must be:
  `graphify explain "<exact symbol>"`
* Only investigate Graphify installation or graph availability after a direct `graphify ...` command actually fails.
* A failure from `npx`, npm, or another package runner is not evidence that Graphify is unavailable; those invocation methods are prohibited.


## Core Operating Principle

For repository-specific work, minimize context acquisition before reasoning.

Use this order:

```text
Graphify first.
Targeted filesystem verification second.
Claude reasoning third.
Code changes fourth.
Narrow tests fifth.
Graph update last.
```

Do not begin repository work by broadly scanning the codebase when a local Graphify knowledge graph exists.

The objective is to identify the smallest relevant subgraph and the minimum source-file set required to complete the task correctly.

---

## Development Environment — Docker Required

**The entire team works inside the same Docker image.**

Do not install or run Node.js tooling directly on the host.

The development environment is defined by:

```text
Dockerfile.dev
docker-compose.yml
```

The image is published at:

```text
ghcr.io/grodriguezcontextglobal/devitrak-client-dev:latest
```

### Run commands inside the container

Interactive shell:

```bash
docker compose exec devitrak-client sh
```

Single command:

```bash
docker compose exec devitrak-client npm run test:unit
docker compose exec devitrak-client npm run lint
```

### Mandatory environment rules for Claude

* The development server runs on port `5522` inside the container and is mapped to port `5522` on the host.
* `node_modules` lives in an anonymous Docker volume.
* `node_modules` is not expected to be available from the host filesystem.
* Do not suggest `npm install` directly on the host.
* Do not suggest `npx` commands directly on the host for project tooling.
* When a dependency must be added, modify the appropriate package manifest and rebuild the Docker image.
* Environment variables come from `.env.dev`.
* `.env.dev` is not committed.
* `.env.dev.example` is the template.
* All Node.js, npm, Vitest, Vite, ESLint, and Cypress commands must run inside the container unless the user explicitly instructs otherwise.

---

## Commands

All Node/npm commands below are intended to run inside the Docker container.

### Run a single unit test file

Inside the container:

```bash
npx vitest run src/config/roles.test.js
```

From the host, use Docker:

```bash
docker compose exec devitrak-client npx vitest run src/config/roles.test.js
```

### E2E note

Cypress base URL is:

```text
http://localhost:5523
```

not:

```text
http://localhost:5522
```

Run a separate development server on port `5523` before executing Cypress.

---

## Development Methodology

Use this loop strictly:

```text
test → code → refactor
```

Never skip the order.

1. Write the failing test first.
2. Use Vitest for unit/integration tests.
3. Use Cypress for E2E tests.
4. Implement only what is required to make the test pass.
5. Refactor without breaking tests.
6. Repeat.

### Unit-test coverage scope

The intentionally narrow test scope is:

```text
src/config/**
src/hooks/**
src/store/**
src/pages/**/utils/**
```

Keep new tests within these boundaries unless there is a strong reason to expand coverage.

---

# Architecture

## Permission System

The single source of truth is:

```text
src/config/roles.js
```

Do not add role logic elsewhere.

Always resolve through:

```text
resolveRoleType
```

Never compare legacy numeric roles directly in new code.

The Redux permission slice:

```text
src/store/slices/permissions.js
```

mirrors active role information for convenience but is not the authority for access decisions.

---

## Session Headers

Single source of truth:

```text
src/api/sessionHeaders.js
```

Key exports include:

```text
persistCompanyHeaders
clearSessionStorage
buildRequestPath
buildRouteScopedHeaders
```

`persistCompanyHeaders` is called during login flows, including:

```text
Login.jsx
multipleCompanies/Modal.jsx
```

`clearSessionStorage` must be used at every logout/session-teardown location.

### Route-scoped defaults

| Header         | Value                  | Redux source                    | Routes                                                    |
| -------------- | ---------------------- | ------------------------------- | --------------------------------------------------------- |
| `x-company-id` | Mongo company ObjectId | `admin.user.companyData.id`     | `/api/staff`, `/api/admin`, `/api/company`, `/api/stripe` |
| `s-company-lq` | SQL integer company id | `admin.user.sqlInfo.company_id` | `/api/db_*`                                               |

When adding a localStorage-backed session key, add it to:

```text
SESSION_STORAGE_KEYS
```

so it is cleared everywhere on logout.

---

### Mandatory component rule

Prefer internal UX components.

Do not introduce raw Ant Design or MUI primitives directly into page code when an equivalent internal UX component already exists.

---

# Key Conventions

## Permissions

Always use:

```js
hasPermission(action, resolveRoleType(user))
```

Never compare:

```text
user.role
```

as a raw numeric value in new code.

---

## API calls

Import API clients from:

```text
src/api/devitrakApi.jsx
```

Never create ad hoc Axios instances.

---

## Forms

Use:

```text
react-hook-form
yup
```

for form state and validation.

---

## Server Data

Use:

```text
@tanstack/react-query
```

for remote server data.

Use Redux only for cross-page application context and persistent shared client state.

---

## Icons

Default:

```text
lucide-react
```

Custom brand assets:

```text
src/components/icons/
```

---

## Styling

Use:

* inline styles for component-level overrides
* CSS files for reusable/global patterns
* CSS variables from `src/index.css`

See:

```text
design.md
```

for design tokens.

---

# Graphify Knowledge Graph Policy

This repository has a local knowledge graph at:

```text
graphify-out/
```

Primary graph:

```text
graphify-out/graph.json
```

The graph contains:

* code symbols
* structural relationships
* callers and callees where extracted
* import relationships
* communities
* cross-file relationships

Graphify is a context-discovery mechanism, not an infallible source of runtime truth.

---

## Native Graphify CLI Rule

Graphify is installed as a native CLI in this environment.

Always invoke it directly:

```bash
graphify explain "<symbol>"
graphify path "<A>" "<B>"
graphify query "<question>" --budget 800
graphify affected "<symbol>"
graphify update .
```

Never invoke Graphify through:

```text
npx graphify
npm exec graphify
pnpm exec graphify
yarn graphify
python -m graphify
pipx run graphify
```

Do not use another package runner around Graphify.

---

## Do Not Probe an Already-Known Graph

When repository instructions already establish that:

```text
graphify-out/graph.json
```

exists, do not spend a tool call listing or probing:

```text
graphify-out/
```

before using Graphify.

Do not start with:

```bash
ls graphify-out/
```

or equivalent checks unless a Graphify command actually fails because the graph is unavailable.

Run the relevant Graphify command directly.

---

## Mandatory Context Acquisition Order

For repository-specific work, use this hierarchy.

### 1. Exact symbol known → `explain`

If the task names an exact:

* component
* function
* hook
* class
* module
* file
* utility
* Redux slice
* symbol

first run:

```bash
graphify explain "<exact symbol>"
```

Examples:

```bash
graphify explain "EmailReturnRentalItems"
graphify explain "SingleEmailNotification"
graphify explain "useBulkActionLogic"
graphify explain "resolveRoleType"
```

Prefer exact symbol names over partial names.

---

### Automatic Graphify Command Selection

The user must not be required to mention Graphify, select a Graphify command, provide Graphify keywords, or translate the task into a repository-search query.

The user communicates only the desired engineering outcome in natural language.

Claude is responsible for automatically selecting the correct Graphify strategy before repository exploration.

Use this decision order:

```text
Exact implementation symbol explicitly known
→ graphify explain "<exact symbol>"

Exact file known but contained symbol uncertain
→ graphify explain "<exact file>"
→ inspect the resolved file node
→ identify and explain the functional symbol when necessary

Feature, workflow, bug, or business behavior described without an exact symbol
→ graphify query "<specific engineering question>" --budget 800
→ select the strongest concrete candidates
→ graphify explain "<candidate symbol>"
→ verify the resolved file and symbol

Two known symbols whose relationship must be understood
→ graphify explain "<A>"
→ graphify explain "<B>"
→ graphify path "<A>" "<B>"

Potential change impact around a known symbol
→ graphify affected "<exact symbol>"
```

Claude must make this selection automatically.

The user should be able to write requests such as:

```text
Fix the visibility of the Manage Members dropdown for managers.
Add supplier filtering to inventory.
Review the device assignment workflow.
Correct the event registration validation.
```

Claude must not require the user to write:

```text
graphify query ...
graphify explain ...
graphify path ...
graphify affected ...
```

Graphify commands are internal implementation details.

#### Mandatory validation after `query`

Never edit code or make a final architectural conclusion directly from `graphify query` output.

After a query:

1. Identify the highest-confidence concrete symbols or files.
2. Run `graphify explain` for the selected candidate.
3. Verify that Graphify resolved the expected file and functional symbol.
4. Reject candidates that resolve to unrelated modules or duplicate generic names.
5. Inspect the minimum necessary source files.
6. Only then reason about or modify the implementation.

For duplicated names such as:

```text
MainPage
Handler
Modal
Index
Utils
```

the query result is not sufficient evidence.

Resolve the exact file or contained symbol before continuing.

#### Natural-language query construction

When no exact symbol is known, Claude must derive a narrow engineering question from the user's request.

The query should include available anchors such as:

* business feature
* visible UI text
* route
* endpoint
* role
* permission
* error message
* expected behavior
* affected entity

Do not use the user's entire message verbatim when it contains unrelated context.

Do not reduce the request to generic terms such as:

```text
Main
User
Data
Handler
Component
Button
Event
```

#### Failure and ambiguity recovery

If Graphify returns:

* an ambiguous match
* an unrelated duplicate symbol
* only weak shared-infrastructure connections
* a large noisy subgraph
* incomplete containment-only information

Claude must narrow or verify the result automatically.

Use this recovery order:

```text
more specific Graphify query
→ exact candidate explain
→ targeted exact-symbol filesystem verification
→ minimal source inspection
```

Do not ask the user to choose the Graphify command or provide search keywords unless essential business information is genuinely missing.

## Verify What Graphify Resolved

Before drawing conclusions, inspect whether Graphify resolved:

```text
FileName.jsx
```

or:

```text
FunctionName()
ComponentName()
HookName()
ClassName
```

A file node and a contained symbol node are not interchangeable.

Example:

```text
SingleEmail.jsx
```

is different from:

```text
SingleEmailNotification()
```

When the functional symbol is known, prefer the exact symbol.

---

## 2. Known relationship → resolve both sides first

When investigating how two known symbols interact:

First run:

```bash
graphify explain "<A>"
```

Then:

```bash
graphify explain "<B>"
```

Only after both symbols are resolved should you run:

```bash
graphify path "<A>" "<B>"
```

Do not begin with `path` when either endpoint is ambiguous.

---

## Graphify Result Interpretation

Before drawing conclusions from Graphify output — an ambiguity warning, a path through
shared infrastructure, a low-degree or containment-only `explain`, or a decision to fall
back to filesystem search — load the `graphify-navigation` skill. It holds the path
ambiguity policy, the weak-connector and meaningful-edge rules, the exact-symbol search
escalation ladder, the reading policy, and the GRAPH_REPORT/wiki entry points.

---

## 3. Broader context required → scoped query

Use:

```bash
graphify query "<specific question>" --budget 800
```

only when:

* the exact symbol is unknown
* several related symbols must be identified
* broader context is genuinely required

Default budget:

```text
800
```

Do not use the default 2000-token budget automatically.

Increase the budget only if the scoped result is insufficient.

Possible escalation:

```text
800
1200
1500
```

Avoid immediately jumping to large context budgets.

---

## Query Precision Policy

Prefer narrow queries.

Good:

```bash
graphify query "rental return email notification flow" --budget 800
```

Avoid generic terms such as:

```text
Event
Email
User
Button
Main
Data
Handler
Component
```

unless unavoidable.

Generic high-degree concepts can produce hundreds of irrelevant nodes.

---

## 4. Flow tracing → DFS

When tracing:

* execution flow
* dependency chain
* workflow path
* feature progression

use:

```bash
graphify query "<specific flow question>" --dfs --budget 800
```

Example:

```bash
graphify query "trace rental item return notification flow" --dfs --budget 800
```

Use DFS for narrow tracing.

Do not assume BFS is always appropriate.

---

## 5. Impact analysis → `affected`

When investigating what may be impacted by changing a known symbol, prefer:

```bash
graphify affected "<exact symbol>"
```

Use relation filters or depth controls when useful.

Do not begin by recursively scanning all references across the repository.

---

# Before Editing Code

Before making changes:

1. Identify the exact task.
2. Identify exact symbols when possible.
3. Run `graphify explain` for known symbols.
4. Resolve both endpoints before `graphify path`.
5. Treat ambiguity warnings as non-conclusive.
6. Identify the smallest relevant subgraph.
7. Identify the minimum source-file set.
8. Verify weak or incomplete graph results with targeted search.
9. Read only the files required.
10. Understand existing tests before implementing.

Do not edit first and investigate later.

---

# After Editing Code

After code changes:

1. Run the narrowest relevant tests first.
2. Run targeted lint where practical.
3. Expand test scope only if necessary.
4. Run:

```bash
graphify update .
```

to keep the graph current.

`graphify update .` is AST-based and does not require an LLM API.

Do not rebuild the entire graph unless structurally necessary.

---

## Graph Update Policy

Use:

```bash
graphify update .
```

after code changes.

Do not automatically run:

```bash
graphify extract . --code-only
```

after every modification.

A full extraction is not the default post-edit workflow.

Use a full extraction only when:

* the graph is missing
* the graph is corrupted
* major repository restructuring occurred
* `graphify update .` is insufficient
* explicitly requested

---

# Repository Scan Prohibition

When:

```text
graphify-out/graph.json
```

exists, do not begin repository tasks with broad:

```text
Glob
Grep
Find
Get-ChildItem -Recurse across repository
recursive directory traversal
mass file reads
```

unless:

* Graphify is insufficient
* targeted search is insufficient
* the user explicitly requests a repository-wide audit

Even then, narrow scope as much as possible.

---

# Reasoning Discipline

Do not overstate Graphify results.

Use evidence categories mentally:

```text
Graph-extracted fact
Direct source-code fact
Filesystem reference fact
Inference
Unknown
```

When making an inference, distinguish it from a directly observed fact.

Examples:

```text
Graphify shows A imports B.
```

is stronger than:

```text
A and B appear to be part of the same workflow.
```

Do not convert structural proximity into functional certainty.

---

# Code Modification Discipline

When changing code:

* preserve existing architecture
* reuse internal UX components
* use existing API clients
* preserve permission conventions
* preserve Docker workflow
* avoid unrelated refactors
* keep changes scoped
* write tests first
* run narrow tests first
* update Graphify afterward

Do not modify unrelated files merely because they appeared in a broad graph result.

---

# Git Safety

Do not automatically run destructive or state-altering Git commands.

Never run without explicit user instruction:

```text
git reset --hard
git clean -fd
git stash
git stash pop
git stash drop
git checkout -- <file>
git restore .
```

Do not discard uncommitted changes.

Before code modifications, inspect relevant working-tree state when necessary.

Prefer:

```bash
git status --short
git diff -- <relevant-file>
```

Do not assume existing modifications were created by Claude.

---

# Context and Quota Optimization

The primary optimization rule is:

```text
Graphify first.
Filesystem second.
Claude reasons last.
```

More precisely:

```text
Exact symbol
→ graphify explain
→ minimal files
→ reasoning

Known relationship
→ explain A
→ explain B
→ path A B
→ inspect edge quality
→ minimal files
→ reasoning

Unknown broader context
→ scoped query --budget 800
→ minimal files
→ reasoning

Flow tracing
→ scoped DFS query --budget 800
→ minimal files
→ reasoning

Weak graph result
→ exact targeted search
→ minimal files
→ reasoning
```

Do not spend context reading the whole repository before understanding what is relevant.

---

# Final Working Rule

For repository work:

```text
1. Graphify
2. Resolve exact symbols
3. Verify graph quality
4. Targeted filesystem fallback only if needed
5. Read minimum source files
6. Reason
7. Test first
8. Implement
9. Refactor
10. Run narrow tests
11. graphify update .
```

Never reverse this order without a concrete reason.
