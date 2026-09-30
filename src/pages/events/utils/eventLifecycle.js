/**
 * Where an event is in its life — the one vocabulary for `configuration`
 * (2026-09-30):
 *
 *   draft   — created at step 1 of the new-event wizard, setup not finished
 *   created — the wizard finished; the event exists for real
 *   closed  — closed with "Close event"
 *
 * It replaces "in-progress" / "completed". Those said nothing about closing:
 * a closed event kept "completed", and only `active: false` told it apart.
 *
 * Reading accepts both vocabularies, because stored events keep theirs.
 * Writing is tolerant (`writeEventConfiguration`): until the backend is known
 * to accept the new words, a refusal must not stop an event from being created
 * or closed. That is also why `active` decides first — an activated event is
 * never a draft, even if its configuration still says so.
 */
export const EVENT_CONFIGURATION = Object.freeze({
  DRAFT: "draft",
  CREATED: "created",
  CLOSED: "closed",
});

const DRAFT_VALUES = new Set([EVENT_CONFIGURATION.DRAFT, "in-progress"]);

/**
 * @param {{configuration?: string, active?: boolean}} event
 * @returns {"draft"|"created"|"closed"}
 */
export const eventLifecycle = (event) => {
  if (event?.active === true) return EVENT_CONFIGURATION.CREATED;
  if (DRAFT_VALUES.has(event?.configuration)) return EVENT_CONFIGURATION.DRAFT;
  return EVENT_CONFIGURATION.CLOSED;
};

const accepted = (response) => response?.data?.ok !== false;

/**
 * Records a stage on the Mongo event and its SQL row. Never throws; reports
 * which record took it.
 *
 * @param {{ api: {patch: Function, post: Function}, mongoId?: string, sqlId?: number|string, value: string }} input
 * @returns {Promise<{ mongo: boolean, sql: boolean }>}
 */
export const writeEventConfiguration = async ({ api, mongoId, sqlId, value }) => {
  const attempt = async (request) => {
    try {
      return accepted(await request());
    } catch (error) {
      console.warn(`configuration "${value}" was not saved`, error);
      return false;
    }
  };

  const mongo = mongoId
    ? await attempt(() => api.patch(`/event/edit-event/${mongoId}`, { configuration: value }))
    : false;
  const sql = sqlId
    ? await attempt(() => api.post(`/db_event/update-event/${sqlId}`, { configuration: value }))
    : false;
  return { mongo, sql };
};
