/**
 * The first row of a SQL lookup's list (`consumer`, `lease`, `items`…), or
 * null when there is none: an empty or missing list, or a response the server
 * marked `ok: false`.
 *
 * Reading `response.data.consumer[0].consumer_id` directly turned a consumer
 * with no SQL row, or a refused lookup, into a TypeError instead of a message
 * (BACKEND_fedramp_server_tasks_REPLY_2026-10-19.md).
 *
 * @param {{ data?: object }|undefined} response an axios response
 * @param {string} key the list in `data`
 * @returns {object|null}
 */
export const firstRecord = (response, key) => {
  const data = response?.data;
  if (!data || data.ok === false) return null;
  const list = data[key];
  return Array.isArray(list) && list.length > 0 ? list[0] : null;
};
