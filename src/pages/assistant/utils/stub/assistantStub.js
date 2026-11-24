// A stand-in for /api/assistant, for a dev server only.
//
// It was a job queue until 2026-11-24, because that is what we had been told to
// expect. The real endpoint is synchronous and catalogue-based
// (BACKEND_assistant_contract_2026-11-24.md), so this is too. A stub that
// imitates a contract the server does not have is worse than no stub: every
// hour spent against it is spent learning the wrong shape.
//
// What it deliberately does NOT do is only return the happy case. The states
// below are the ones the window has to render and the ones that are hardest to
// see by accident:
//
//   unsupported     -- keyword matching MISSES, and the backend says so plainly
//                      (§1). It is a 200 with the catalogue inlined, and it is
//                      the single most likely thing a real user will see.
//   scope.scoped    -- a scoped staff member reads a smaller number than the
//                      real one. Without a notice they read a blind spot as a
//                      fact.
//   data: null      -- a company that cannot be resolved. Means unknown, and
//                      must not render as zero.
//   429             -- the limiter, with the headers that say when to come back.
//
// Ask for each by typing the word: "unsupported", "scoped", "unknown", "429".

export const STUB_CATALOG = [
  { id: "company_inventory_summary", label: "Resumen de inventario" },
  { id: "company_devices_out", label: "Equipos fuera del almacen ahora mismo" },
  { id: "company_events_active", label: "Eventos activos" },
  { id: "company_staff_list", label: "Personal de la compania" },
  { id: "company_subscription_status", label: "Estado de la suscripcion" },
  { id: "company_activity_recent", label: "Actividad reciente" },
];

// Keyword matching in Spanish and English, which is what the server does. Kept
// crude on purpose: a stub that understands more than the server teaches the
// window that misses are rare, and they will not be.
const MATCHERS = [
  { id: "company_inventory_summary", words: ["inventario", "inventory", "resumen", "summary"] },
  { id: "company_devices_out", words: ["fuera", "out", "afuera"] },
  { id: "company_events_active", words: ["evento", "event"] },
  { id: "company_staff_list", words: ["staff", "personal", "empleado"] },
  { id: "company_subscription_status", words: ["suscrip", "subscription", "plan"] },
  { id: "company_activity_recent", words: ["actividad", "activity", "reciente", "recent"] },
];

const ANSWERS = {
  company_inventory_summary: {
    data: { deviceCount: 128, devicesOut: 4, inWarehouse: 124 },
    answer: "Tienes **128** equipos: **4** fuera y **124** en el almacen.",
  },
  company_devices_out: {
    data: { devicesOut: 4 },
    answer: "Tienes **4** equipos fuera del almacen ahora mismo.",
  },
  company_events_active: {
    data: { activeEvents: 2, events: ["Convencion Miami 2026", "Feria Bogota"] },
    answer: "Tienes **2** eventos activos.",
    params: { limit: 25 },
  },
  company_staff_list: {
    data: {
      staffCount: 3,
      staff: [
        { name: "Gustavo Rodriguez", role: "admin" },
        { name: "Fredrik Nilsson", role: "approver" },
        // A null role is in the contract (§5) and renders differently.
        { name: "Ana Perez", role: null },
      ],
    },
    answer: "Tienes **3** miembros del personal.",
    params: { limit: 25 },
  },
  company_subscription_status: {
    data: { plan: "Pro", subscriptionStatus: "active", status: "active" },
    answer: "Tu plan es **Pro** y la suscripcion esta **activa**.",
  },
  company_activity_recent: {
    data: {
      range: "30d",
      count: 2,
      activity: [
        { summary: "Device DVK-0012 assigned", actor: "Gustavo Rodriguez", at: "2026-11-23T14:02:11Z" },
        // A null summary is in the contract too, and must not print "null".
        { summary: null, actor: "system", at: "2026-11-22T09:10:00Z" },
      ],
    },
    answer: "Hubo **2** movimientos en los ultimos 30 dias.",
    params: { range: "30d", limit: 25 },
  },
};

const matchQuestion = (question) => {
  const asked = String(question ?? "").toLowerCase();
  const found = MATCHERS.find((matcher) => matcher.words.some((word) => asked.includes(word)));
  return found?.id ?? null;
};

/**
 * A rate-limit refusal shaped like axios', so the error path is exercised with
 * the same object the real client will throw -- including the headers that say
 * when to come back.
 */
const rateLimited = () => {
  const failure = new Error("Too many questions in a short time.");
  failure.response = {
    status: 429,
    headers: { "ratelimit-reset": "45", "ratelimit-limit": "10", "ratelimit-remaining": "0" },
    data: { ok: false, msg: "Too many questions in a short time, please wait." },
  };
  return failure;
};

export const createAssistantStub = () => ({
  catalog: () => ({ ok: true, catalog: STUB_CATALOG }),

  ask: (body) => {
    const question = body?.question ?? "";
    const asked = String(question).toLowerCase();

    if (asked.includes("429")) throw rateLimited();

    const questionId = asked.includes("unsupported") ? null : matchQuestion(question);

    if (!questionId) {
      return {
        ok: true,
        question_id: "unsupported",
        answer: "No se contestar eso todavia. Esto es lo que si puedo mirar:",
        data: null,
        catalog: STUB_CATALOG,
      };
    }

    const known = ANSWERS[questionId];

    // Understood, but the company could not be crossed between the two stores.
    // `data: null` with an `answer` that says so -- never a zero.
    if (asked.includes("unknown")) {
      return {
        ok: true,
        question_id: questionId,
        answer: "No pude identificar tu compania, asi que no lo se.",
        data: null,
        scope: { scoped: false, roleType: "admin" },
        params: {},
      };
    }

    return {
      ok: true,
      question_id: questionId,
      answer: known.answer,
      data: known.data,
      scope: asked.includes("scoped")
        ? { scoped: true, roleType: "category_assistant" }
        : { scoped: false, roleType: "admin" },
      params: known.params ?? {},
    };
  },
});

export default createAssistantStub;
