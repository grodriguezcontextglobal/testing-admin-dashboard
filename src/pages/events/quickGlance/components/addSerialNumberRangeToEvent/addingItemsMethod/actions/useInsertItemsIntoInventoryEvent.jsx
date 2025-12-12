import { paramsFetched } from "./useInsertDeviceIntoEventTableRecord";

// Bulk insert items into SQL event inventory in a single request
const insertItemsIntoInventoryEvent = async ({ data, event }) => {
  const eventId = event?.sql?.event_id;
  const itemIds = Array.isArray(data)
    ? data
        .map((item) => item?.item_id)
        .filter((id) => Number.isFinite(Number(id)))
    : [];

  if (!eventId || itemIds.length === 0) {
    return Promise.reject(
      new Error("Missing event_id or empty item list for bulk insert.")
    );
  }

  // Build VALUES (?, ?) tuples for each item
  const placeholders = itemIds.map(() => "(?, ?)").join(", ");
  const values = itemIds.flatMap((id) => [id, eventId]);
  const query = `INSERT INTO item_inv_assigned_event (item_id, event_id) VALUES ${placeholders}`;

  // Execute bulk insert via SQL endpoint
  const response = await paramsFetched({
    query,
    values,
  });   
  return response;
};

export default insertItemsIntoInventoryEvent;
