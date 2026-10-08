import { describe, it, expect } from "vitest";
import {
  ACTIVITY_LOG_ACTIONS,
  mapLogToListItem,
  filterLogsByHierarchy,
  buildActionFilterOptions,
  buildStaffFilterOptions,
  describeLogAction,
  describeClient,
  isInfrastructureLog,
  logHighlights,
  explainLogChange,
  visibleLogs,
} from "./staffActivityLogUtils";

const buildLog = (overrides = {}) => ({
  id: "log-1",
  staff_member_id: {
    _id: "staff-1",
    name: "Jane",
    lastName: "Doe",
    email: "jane@x.com",
    roleType: "admin",
  },
  company_id: "company-1",
  action: "LOGIN",
  target_model: "AdminUser",
  target_id: "staff-1",
  details: { email: "jane@x.com" },
  timestamp: "2026-08-05T12:04:41.000Z",
  ...overrides,
});

// ─── mapLogToListItem ─────────────────────────────────────────────────────────

describe("mapLogToListItem(log)", () => {
  it("separa quién actuó de lo que hizo, para que la lista muestre nombre y email", () => {
    const result = mapLogToListItem(buildLog());
    expect(result.staffName).toBe("Jane Doe");
    expect(result.staffEmail).toBe("jane@x.com");
    expect(result.actionTaken).toBe("LOGIN AdminUser");
  });

  it("cae al email de los detalles cuando el staff poblado no lo trae", () => {
    // El registro guarda `details.email` en el login; es la misma persona.
    const result = mapLogToListItem(
      buildLog({ staff_member_id: { _id: "staff-1", name: "Jane", lastName: "Doe" } })
    );
    expect(result.staffEmail).toBe("jane@x.com");
  });

  it("deja el email en null cuando nadie lo sabe, en vez de inventarlo", () => {
    const result = mapLogToListItem(
      buildLog({ staff_member_id: { _id: "s", name: "Jane" }, details: {} })
    );
    expect(result.staffEmail).toBeNull();
  });

  it("conserva el timestamp crudo en 'time' (Body.jsx ya lo formatea con new Date())", () => {
    const result = mapLogToListItem(buildLog());
    expect(result.time).toBe("2026-08-05T12:04:41.000Z");
  });

  it("conserva el id del log", () => {
    const result = mapLogToListItem(buildLog());
    expect(result.id).toBe("log-1");
  });

  it("usa 'Unknown staff' cuando staff_member_id viene null (staff eliminado)", () => {
    const result = mapLogToListItem(buildLog({ staff_member_id: null }));
    expect(result.staffName).toBe("Unknown staff");
    expect(result.actionTaken).toBe("LOGIN AdminUser");
  });
});

// ─── filterLogsByHierarchy ────────────────────────────────────────────────────

describe("filterLogsByHierarchy(logs, viewerRoleType, viewerId)", () => {
  it("admin ve su propia actividad y la de roles inferiores, no la de root_admin", () => {
    const logs = [
      buildLog({ id: "l-root", staff_member_id: { _id: "s-root", roleType: "root_admin" } }),
      buildLog({ id: "l-admin", staff_member_id: { _id: "s-admin", roleType: "admin" } }),
      buildLog({ id: "l-assistant", staff_member_id: { _id: "s-assistant", roleType: "assistant" } }),
    ];
    const result = filterLogsByHierarchy(logs, "admin", "s-admin");
    expect(result.map((log) => log.id)).toEqual(["l-admin", "l-assistant"]);
  });

  it("event_manager NO ve actividad de admin ni sale_manager, sí la de inventory_manager/assistant", () => {
    const logs = [
      buildLog({ id: "l-admin", staff_member_id: { _id: "s-admin", roleType: "admin" } }),
      buildLog({ id: "l-sale", staff_member_id: { _id: "s-sale", roleType: "sale_manager" } }),
      buildLog({ id: "l-event", staff_member_id: { _id: "s-event", roleType: "event_manager" } }),
      buildLog({ id: "l-inv", staff_member_id: { _id: "s-inv", roleType: "inventory_manager" } }),
    ];
    const result = filterLogsByHierarchy(logs, "event_manager", "s-event");
    expect(result.map((log) => log.id)).toEqual(["l-event", "l-inv"]);
  });

  it("un rol con scope (sin nivel) solo ve su propia actividad, aunque haya logs de roles inferiores", () => {
    const logs = [
      buildLog({ id: "l-self", staff_member_id: { _id: "s-cat", roleType: "category_manager" } }),
      buildLog({ id: "l-assistant", staff_member_id: { _id: "s-assistant", roleType: "assistant" } }),
    ];
    const result = filterLogsByHierarchy(logs, "category_manager", "s-cat");
    expect(result.map((log) => log.id)).toEqual(["l-self"]);
  });

  it("root_admin ve todo, incluidos los roles con scope", () => {
    const logs = [
      buildLog({ id: "l-admin", staff_member_id: { _id: "s-admin", roleType: "admin" } }),
      buildLog({ id: "l-cat", staff_member_id: { _id: "s-cat", roleType: "category_manager" } }),
    ];
    const result = filterLogsByHierarchy(logs, "root_admin", "s-root");
    expect(result.map((log) => log.id)).toEqual(["l-admin", "l-cat"]);
  });

  it("siempre incluye la propia actividad del viewer, aunque el log tenga el rol vacío/desconocido", () => {
    const logs = [buildLog({ id: "l-self", staff_member_id: { _id: "s-event", role: undefined } })];
    const result = filterLogsByHierarchy(logs, "event_manager", "s-event");
    expect(result.map((log) => log.id)).toEqual(["l-self"]);
  });

  it("retorna [] cuando logs no es un array", () => {
    expect(filterLogsByHierarchy(undefined, "admin", "s-admin")).toEqual([]);
    expect(filterLogsByHierarchy(null, "admin", "s-admin")).toEqual([]);
  });

  it("resuelve el rol legacy numérico del staff populado (mismo formato que /company/search-company)", () => {
    const logs = [
      buildLog({ id: "l-root", staff_member_id: { _id: "s-root", role: "0" } }),
      buildLog({ id: "l-assistant", staff_member_id: { _id: "s-assistant", role: "5" } }),
    ];
    const result = filterLogsByHierarchy(logs, "admin", "s-admin");
    expect(result.map((log) => log.id)).toEqual(["l-assistant"]);
  });
});

// ─── ACTIVITY_LOG_ACTIONS / buildActionFilterOptions ─────────────────────────

describe("ACTIVITY_LOG_ACTIONS / buildActionFilterOptions", () => {
  it("incluye los valores documentados por backend (FRONTEND_staff_activity_log.md)", () => {
    expect(ACTIVITY_LOG_ACTIONS).toEqual([
      "LOGIN",
      "LOGOUT",
      "FORCE_LOGOUT",
      "CREATE",
      "UPDATE",
      "DELETE",
      "ASSIGN",
      "UNASSIGN",
      "IMPORT",
      "EXPORT",
    ]);
  });

  it("buildActionFilterOptions genera pares {label, value} en el mismo orden", () => {
    const options = buildActionFilterOptions();
    expect(options[0]).toEqual({ label: "LOGIN", value: "LOGIN" });
    expect(options).toHaveLength(ACTIVITY_LOG_ACTIONS.length);
  });
});

// ─── buildStaffFilterOptions ──────────────────────────────────────────────────

describe("buildStaffFilterOptions(staffList, viewerRoleType, viewerId)", () => {
  const staffList = [
    { _id: "s-root", name: "Rita", lastName: "Root", roleType: "root_admin" },
    {
      _id: "s-admin",
      name: "Al",
      lastName: "Admin",
      email: "al@school.org",
      roleType: "admin",
    },
    {
      _id: "s-assist",
      name: "Ann",
      lastName: "Assist",
      email: "ann@school.org",
      roleType: "assistant",
    },
  ];

  it("admin ve las opciones de admin y roles inferiores, no root_admin", () => {
    const options = buildStaffFilterOptions(staffList, "admin", "s-admin");
    expect(options.map((option) => option.value)).toEqual(["s-admin", "s-assist"]);
  });

  it("cada opción lleva nombre completo Y email, que es lo único único", () => {
    const options = buildStaffFilterOptions(staffList, "admin", "s-admin");
    expect(options[0]).toEqual({
      label: "Al Admin — al@school.org",
      value: "s-admin",
    });
  });

  /* Fredrik, 56:31 — "what if you have two say the same last name? (...) if you
     have a school and you have 200 employees, at least two of them is going to
     have the same last name". El nombre no desempata; el email sí. */
  it("distingue a dos personas con el mismo nombre completo", () => {
    const smiths = [
      { _id: "s-1", name: "John", lastName: "Smith", email: "john.smith@school.org", roleType: "assistant" },
      { _id: "s-2", name: "John", lastName: "Smith", email: "j.smith@school.org", roleType: "assistant" },
    ];
    const labels = buildStaffFilterOptions(smiths, "admin", "s-admin").map((o) => o.label);
    expect(new Set(labels).size).toBe(2);
    expect(labels).toContain("John Smith — john.smith@school.org");
    expect(labels).toContain("John Smith — j.smith@school.org");
  });

  /* El label es lo que busca `filterOption` en Header.jsx, así que teclear el
     email tiene que encontrar a la persona. */
  it("el label es un string, para que buscar por email funcione", () => {
    const options = buildStaffFilterOptions(staffList, "admin", "s-admin");
    options.forEach((option) => expect(typeof option.label).toBe("string"));
    const hit = options.filter((option) =>
      option.label.toLowerCase().includes("ann@school"),
    );
    expect(hit).toHaveLength(1);
    expect(hit[0].value).toBe("s-assist");
  });

  /* La lista real de empleados guarda el correo en `user`, no en `email`
     (Login.jsx filtra por "employees.user" con un email). Leer solo `email`
     habría dejado esto en no-op contra el payload de producción. */
  it("lee el correo de `user` cuando no hay `email`", () => {
    const fromUserField = [
      { _id: "s-u", name: "Uma", lastName: "User", user: "uma@school.org", roleType: "assistant" },
    ];
    expect(buildStaffFilterOptions(fromUserField, "admin", "s-admin")[0].label).toBe(
      "Uma User — uma@school.org",
    );
  });

  it("ignora un `user` que no es un correo, para no imprimir un id junto al nombre", () => {
    const idInUser = [
      { _id: "s-i", name: "Ida", lastName: "Idy", user: "665f0abc12de34f567890abc", roleType: "assistant" },
    ];
    expect(buildStaffFilterOptions(idInUser, "admin", "s-admin")[0].label).toBe("Ida Idy");
  });

  it("sin email, el label es el nombre solo — sin separador colgando", () => {
    const noEmail = [{ _id: "s-x", name: "Nadia", lastName: "Nomail", roleType: "assistant" }];
    expect(buildStaffFilterOptions(noEmail, "admin", "s-admin")[0].label).toBe(
      "Nadia Nomail",
    );
  });

  it("incluye siempre la propia entrada del viewer", () => {
    const options = buildStaffFilterOptions(staffList, "assistant", "s-assist");
    expect(options.map((option) => option.value)).toEqual(["s-assist"]);
  });

  it("retorna [] cuando staffList no es un array", () => {
    expect(buildStaffFilterOptions(undefined, "admin", "s-admin")).toEqual([]);
  });

  it("resuelve el rol legacy numérico (staffList real de /company/search-company usa role numérico)", () => {
    const numericStaffList = [
      { _id: "s-root", name: "Rita", lastName: "Root", role: "0" },
      { _id: "s-admin", name: "Al", lastName: "Admin", role: "1" },
      { _id: "s-assist", name: "Ann", lastName: "Assist", role: "5" },
    ];
    const options = buildStaffFilterOptions(numericStaffList, "admin", "s-admin");
    expect(options.map((option) => option.value)).toEqual(["s-admin", "s-assist"]);
  });
});

/**
 * The picker was in whatever order the company record happened to hold. He
 * raised it as a scale problem, not a tidiness one: "you have to assume that if
 * you have a school and you have 200 employees, at least two of them is going
 * to have the same last name. Maybe they're related even."
 *
 * Sorted by last name, so relatives land next to each other and the reader can
 * tell them apart by the first name beside it, rather than hunting a list for
 * the second Smith.
 */
describe("buildStaffFilterOptions — ordering", () => {
  const viewer = "root_admin";

  it("sorts by last name", () => {
    const options = buildStaffFilterOptions(
      [
        { _id: "3", name: "Ana", lastName: "Zamora", roleType: "admin" },
        { _id: "1", name: "Bob", lastName: "Adams", roleType: "admin" },
        { _id: "2", name: "Cy", lastName: "Mills", roleType: "admin" },
      ],
      viewer,
      null
    );
    expect(options.map((option) => option.label)).toEqual([
      "Bob Adams",
      "Cy Mills",
      "Ana Zamora",
    ]);
  });

  it("puts two of the same last name next to each other, first name deciding", () => {
    const options = buildStaffFilterOptions(
      [
        { _id: "2", name: "John", lastName: "Smith", roleType: "admin" },
        { _id: "3", name: "Ada", lastName: "Smith", roleType: "admin" },
        { _id: "1", name: "Zoe", lastName: "Baker", roleType: "admin" },
      ],
      viewer,
      null
    );
    expect(options.map((option) => option.label)).toEqual([
      "Zoe Baker",
      "Ada Smith",
      "John Smith",
    ]);
  });

  it("does not care about case or stray spacing when ordering", () => {
    const options = buildStaffFilterOptions(
      [
        { _id: "2", name: "Ann", lastName: "  bell ", roleType: "admin" },
        { _id: "1", name: "Ivo", lastName: "Ash", roleType: "admin" },
      ],
      viewer,
      null
    );
    expect(options.map((option) => option.value)).toEqual(["1", "2"]);
  });

  it("keeps a record with no last name in the list rather than dropping it", () => {
    const options = buildStaffFilterOptions(
      [
        { _id: "2", name: "Solo", roleType: "admin" },
        { _id: "1", name: "Ivo", lastName: "Ash", roleType: "admin" },
      ],
      viewer,
      null
    );
    expect(options).toHaveLength(2);
    expect(options.map((option) => option.label)).toContain("Solo");
  });
});

// ─── lo que el servidor manda desde que audita cada ruta (2026-10-05) ────────

/**
 * El middleware de auditoría del servidor llegó con mucho más por fila: la
 * ruta, el estado HTTP, el cuerpo del pedido, la IP, el navegador y un
 * `context` ya masticado (evento, seriales, destinatarios). La lista enseñaba
 * "UPDATE Device" y la hora en UTC, así que nada de eso se veía.
 */
const serverLog = (overrides = {}) => ({
  id: "log-9",
  staff_member_id: { _id: "s1", name: "Gustavo", lastName: "Santeliz", email: "g@x.com" },
  actor_type: "staff",
  action: "UPDATE",
  target_model: "Device",
  target_id: "6abad0ff740748139b2d855c",
  context: { event_name: "TEST _ 2", serial_numbers: ["SN-100006"] },
  details: {
    route: "PATCH /api/receiver/receivers-pool-update/:id",
    status: 201,
    request: { id: "6abad0ff740748139b2d855c", activity: false },
  },
  source: "server",
  ip_address: "172.16.40.2:43962",
  device_info:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0",
  timestamp: "2026-10-05T19:05:54.633Z",
  ...overrides,
});

describe("describeLogAction(log)", () => {
  it("dice en palabras qué pasó, no el par CRUD", () => {
    // serverLog() es un receivers-pool-update con activity:false: una
    // devolución. La regla de ruta la nombra; el par CRUD no podía.
    expect(describeLogAction(serverLog())).toBe("Returned a device");
    expect(describeLogAction(serverLog({ details: { route: "PATCH /api/other" } }))).toBe(
      "Updated a device"
    );
    // Con su propia ruta: el fixture base lleva la del pool de dispositivos,
    // y la ruta manda sobre el par CRUD porque dice más.
    expect(
      describeLogAction(
        serverLog({
          action: "SEND",
          target_model: "Email",
          details: { route: "POST /api/nodemailer/single-email-notification" },
        })
      )
    ).toBe("Sent an email");
    expect(
      describeLogAction(
        serverLog({ action: "CREATE", target_model: "Member", details: {} })
      )
    ).toBe("Created a member");
  });

  it("entrar y salir no llevan objeto detrás", () => {
    expect(describeLogAction({ action: "LOGIN", target_model: "AdminUser" })).toBe("Signed in");
    expect(describeLogAction({ action: "LOGOUT", target_model: "AdminUser" })).toBe("Signed out");
    expect(describeLogAction({ action: "FORCE_LOGOUT" })).toBe("Revoked a session");
  });

  /* Un verbo o un modelo que no conocemos se enseña crudo: esconderlo sería
     perder la única pista de que el servidor registra algo nuevo. */
  it("deja ver lo que no sabe nombrar", () => {
    expect(describeLogAction({ action: "ARCHIVE", target_model: "Widget" })).toBe(
      "ARCHIVE Widget"
    );
    expect(describeLogAction({})).toBe("Unknown action");
  });
});

describe("logHighlights(log)", () => {
  it("saca del context lo que identifica la acción", () => {
    expect(logHighlights(serverLog())).toEqual(["TEST _ 2", "SN-100006"]);
  });

  it("resume una lista larga de seriales en vez de desbordar la fila", () => {
    const highlights = logHighlights(
      serverLog({ context: { serial_numbers: ["A1", "A2", "A3", "A4"] } })
    );
    expect(highlights).toEqual(["A1, A2, A3 +1"]);
  });

  it("nombra a quién se le escribió", () => {
    expect(
      logHighlights(
        serverLog({
          action: "SEND",
          target_model: "Email",
          context: { recipients: ["lucia@x.test"] },
        })
      )
    ).toEqual(["to lucia@x.test"]);
  });

  /* Las filas viejas, de antes del middleware, no traen context: lo que las
     identifica está suelto en details. */
  it("cae a los detalles sueltos cuando no hay context", () => {
    expect(
      logHighlights({
        action: "UNASSIGN",
        target_model: "Lease",
        details: { device_id: 200572, outcome: "returned" },
      })
    ).toEqual(["returned"]);
    expect(logHighlights({ details: { first_name: "G_test", last_name: "R_test" } })).toEqual([
      "G_test R_test",
    ]);
  });

  it("no inventa nada cuando no hay con qué", () => {
    expect(logHighlights({ action: "LOGIN" })).toEqual([]);
    expect(logHighlights(undefined)).toEqual([]);
  });
});

describe("describeClient(userAgent)", () => {
  it("dice el navegador y el sistema, no la cadena entera", () => {
    expect(describeClient(serverLog().device_info)).toBe("Edge on Windows");
    expect(
      describeClient(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"
      )
    ).toBe("Chrome on macOS");
  });

  it("devuelve null cuando no reconoce la cadena, para no escribir 'Unknown on Unknown'", () => {
    expect(describeClient("curl/8.4.0")).toBeNull();
    expect(describeClient(undefined)).toBeNull();
  });
});

/**
 * Ocho de las cuarenta y cinco filas de una tarde son borrados de caché: son
 * de la máquina, no de una persona, y tapan lo que sí se lee.
 */
describe("isInfrastructureLog(log)", () => {
  it("marca el borrado de caché como ruido", () => {
    expect(isInfrastructureLog({ action: "CLEAR", target_model: "Cache" })).toBe(true);
  });

  it("no marca nada que una persona reconocería", () => {
    expect(isInfrastructureLog(serverLog())).toBe(false);
    expect(isInfrastructureLog({ action: "LOGIN", target_model: "AdminUser" })).toBe(false);
  });
});

describe("mapLogToListItem(log) — con el payload del servidor", () => {
  const item = mapLogToListItem(serverLog());

  it("lleva la frase, lo que la identifica y a qué objeto tocó", () => {
    expect(item.summary).toBe("Returned a device");
    expect(item.highlights).toEqual(["TEST _ 2", "SN-100006"]);
    expect(item.target).toBe("Device 6abad0ff740748139b2d855c");
  });

  it("explica el cambio en una frase, y deja fuera las palabras del servidor", () => {
    expect(item.explanation).toBe("The device went back into the event's inventory.");
    expect(item.ip).toBe("172.16.40.2:43962");
    expect(item.client).toBe("Edge on Windows");
  });

  /* Pedido 2026-10-05: la lee gente sin formación técnica. Ni la ruta, ni el
     estado HTTP, ni el cuerpo del pedido salen del fichero de utilidades. */
  it("no lleva la ruta, el estado ni el cuerpo a la pantalla", () => {
    expect(item).not.toHaveProperty("route");
    expect(item).not.toHaveProperty("status");
    expect(item).not.toHaveProperty("request");
    expect(JSON.stringify(item)).not.toMatch(/api\/|activity|PATCH/);
  });

  it("sigue llevando lo de antes, que la lista ya usaba", () => {
    expect(item.staffName).toBe("Gustavo Santeliz");
    expect(item.actionTaken).toBe("UPDATE Device");
    expect(item.time).toBe("2026-10-05T19:05:54.633Z");
  });

  it("no deja huecos con una fila vieja que no trae nada de eso", () => {
    const old = mapLogToListItem({ id: "x", action: "LOGIN", target_model: "AdminUser" });
    expect(old).toMatchObject({
      summary: "Signed in",
      highlights: [],
      target: null,
      explanation: null,
    });
  });
});

/**
 * El filtro de usuario no devolvía nada (reportado 2026-10-05).
 *
 * La lista de staff sale de `/company/search-company`, donde cada empleado
 * lleva DOS ids: `_id`, que es el del subdocumento dentro de la compañía, y
 * `userId`, que es la cuenta de AdminUser. El log identifica a quien actuó por
 * `staff_member_id._id`, que es el de la cuenta. Se mandaba el primero, así
 * que el servidor filtraba por un id que no aparece en ningún registro.
 *
 * Los fixtures de arriba traen solo `_id`, que es justo por lo que esto no
 * saltó: no se parecían al payload.
 */
describe("buildStaffFilterOptions — el id que el servidor reconoce", () => {
  const employee = {
    _id: "6a7d9ef28f33f83745aa54e3", // el subdocumento dentro de la compañía
    userId: "66cdf26906fd8fd5e9b13eed", // la cuenta, la que el log registra
    firstName: "Gustavo",
    name: "Gustavo",
    lastName: "Santeliz",
    user: "g@x.com",
    role: "0",
  };

  it("filtra por la cuenta del empleado, no por su fila en la compañía", () => {
    const [option] = buildStaffFilterOptions([employee], "root_admin", null);
    expect(option.value).toBe("66cdf26906fd8fd5e9b13eed");
  });

  it("sigue sirviendo a un registro que solo trae _id", () => {
    const [option] = buildStaffFilterOptions(
      [{ _id: "s-1", name: "Ana", lastName: "Gil", roleType: "admin" }],
      "root_admin",
      null
    );
    expect(option.value).toBe("s-1");
  });

  /* "Uno siempre se ve a sí mismo" se comprobaba contra el id equivocado, así
     que no se cumplía nunca para la lista de empleados. */
  it("se reconoce a sí mismo por la cuenta", () => {
    const options = buildStaffFilterOptions(
      [{ ...employee, role: "3" }],
      "event_manager",
      "66cdf26906fd8fd5e9b13eed"
    );
    expect(options).toHaveLength(1);
  });
});

// ─── que lo lea cualquiera, no solo quien sepa leer una ruta ────────────────

/**
 * Pedido 2026-10-05: la bitácora la lee gente sin formación técnica. Una fila
 * que dice `PATCH /api/receiver/receivers-pool-update/:id · 201` y
 * `{ "activity": false }` no le dice a nadie que se devolvió un equipo.
 */
const routed = (route, request, overrides = {}) => ({
  action: "UPDATE",
  target_model: "Device",
  details: { route, status: 201, request },
  ...overrides,
});

describe("describeLogAction — la ruta dice más que el par CRUD", () => {
  it("distingue entregar de devolver, que es lo que significa activity", () => {
    expect(
      describeLogAction(routed("PATCH /api/receiver/receivers-pool-update/:id", { activity: false }))
    ).toBe("Returned a device");
    expect(
      describeLogAction(routed("PATCH /api/receiver/receivers-pool-update/:id", { activity: true }))
    ).toBe("Handed out a device");
  });

  it("lee el mismo hecho escrito en la otra forma", () => {
    expect(
      describeLogAction(
        routed("PATCH /api/receiver/receiver-update/:id", { device: { status: false } })
      )
    ).toBe("Returned a device");
  });

  it("dice de qué correo se trata, no solo que se mandó uno", () => {
    expect(
      describeLogAction(
        routed("POST /api/nodemailer/assignig-device-notification", {}, {
          action: "SEND",
          target_model: "Email",
        })
      )
    ).toBe("Emailed an equipment handover");
  });

  /* Una ruta que no conocemos cae a la frase de siempre, nunca a la ruta. */
  it("no enseña la ruta cuando no la conoce", () => {
    const summary = describeLogAction(
      routed("PATCH /api/something/brand-new/:id", { whatever: 1 })
    );
    expect(summary).toBe("Updated a device");
    expect(summary).not.toMatch(/api|PATCH/);
  });
});

/* The public attendance page records each response with no staff behind it. */
describe("invitation responses", () => {
  const response = (request) =>
    routed("POST /api/school/event-invitations/response", request, {
      action: "CREATE",
      target_model: "EventInvitation",
      staff_member_id: null,
    });
  const guardian = {
    responder_role: "guardian",
    responder_email: "mum@x.com",
    event_name: "Science Fair",
  };

  it("says what the guardian did", () => {
    expect(describeLogAction(response({ ...guardian, response: "opened" }))).toBe(
      "Opened an event invitation"
    );
    expect(describeLogAction(response({ ...guardian, response: "confirmed" }))).toBe(
      "Confirmed their child's attendance"
    );
    expect(
      describeLogAction(response({ ...guardian, response: "already_confirmed" }))
    ).toBe("Opened an invitation already confirmed");
    expect(describeLogAction(response({ ...guardian, response: "failed" }))).toBe(
      "Tried to confirm attendance, and it failed"
    );
  });

  it("says an adult confirmed for themselves", () => {
    expect(
      describeLogAction(
        response({ responder_role: "member", responder_email: "ada@x.com", response: "confirmed" })
      )
    ).toBe("Confirmed attendance");
  });

  it("names who answered instead of an unknown staff member", () => {
    const item = mapLogToListItem(response({ ...guardian, response: "confirmed" }));
    expect(item.staffName).toBe("Parent / guardian");
    expect(item.staffEmail).toBe("mum@x.com");
    expect(item.highlights).toContain("Science Fair");
  });

  it("says why a confirmation failed", () => {
    const item = mapLogToListItem(
      response({ ...guardian, response: "failed", reason: "Email already in use." })
    );
    expect(item.explanation).toBe("The confirmation was not saved: Email already in use.");
  });

  it("names the invitation email the staff member sent", () => {
    expect(
      describeLogAction(
        routed(
          "POST /api/nodemailer/customize-message-notification",
          { message: "<a href='https://app.devitrak.net/attendance-confirmation?x=1'>Confirm</a>" },
          { action: "SEND", target_model: "Email" }
        )
      )
    ).toBe("Emailed an event invitation");
    expect(
      describeLogAction(
        routed("POST /api/nodemailer/customize-message-notification", { message: "Hello" }, {
          action: "SEND",
          target_model: "Email",
        })
      )
    ).toBe("Sent an email");
  });
});

describe("explainLogChange(log)", () => {
  it("traduce el cambio a una frase, sin nombrar campos del servidor", () => {
    const sentence = explainLogChange(
      routed("PATCH /api/receiver/receivers-pool-update/:id", { activity: false })
    );
    expect(sentence).toBe("The device went back into the event's inventory.");
    expect(sentence).not.toMatch(/activity|false/);
  });

  it("explica lo que cambió en un evento por su nombre, no por su campo", () => {
    expect(
      explainLogChange({
        action: "UPDATE",
        target_model: "Event",
        details: { updates: { deviceSetup: [{ group: "Laptop" }] } },
      })
    ).toBe("The equipment set up for the event changed.");
    expect(
      explainLogChange({
        action: "UPDATE",
        target_model: "Event",
        details: { updates: { staff: { adminUser: [] } } },
      })
    ).toBe("The staff working the event changed.");
  });

  it("dice a qué rol se cambió a alguien", () => {
    expect(
      explainLogChange({
        action: "UPDATE",
        target_model: "Staff",
        details: {
          route: "PATCH /api/db_staff/company-staff",
          request: { role_type: "root_admin" },
        },
      })
    ).toBe("Their role changed to root admin.");
  });

  it("calla cuando no tiene nada claro que decir, en vez de inventar", () => {
    expect(explainLogChange(routed("PATCH /api/x/y", { foo: 1 }))).toBeNull();
    expect(explainLogChange(undefined)).toBeNull();
  });
});

describe("visibleLogs(logs)", () => {
  const cache = {
    action: "CLEAR",
    target_model: "Cache",
    details: { route: "POST /api/cache_update/remove-cache" },
  };

  it("deja fuera lo que hizo la máquina sola", () => {
    const logs = [routed("PATCH /api/receiver/receiver-update/:id", {}), cache, cache];
    expect(visibleLogs(logs)).toHaveLength(1);
  });

  it("reconoce el borrado de caché por la ruta aunque el modelo cambie", () => {
    expect(
      isInfrastructureLog({ action: "CLEAR", details: { route: "POST /api/cache_update/remove-cache" } })
    ).toBe(true);
  });

  it("no se traga una lista vacía ni una que no lo es", () => {
    expect(visibleLogs(undefined)).toEqual([]);
    expect(visibleLogs([])).toEqual([]);
  });
});
