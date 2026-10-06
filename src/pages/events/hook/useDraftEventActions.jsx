import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sqlDeleteOutcome } from "../utils/eventDraft";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import { eventsListCacheKey } from "../utils/eventsListQuery";
import { devitrakApi } from "../../../api/devitrakApi";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import { hasPermission, resolveRoleType } from "../../../config/roles";
import {
  onAddContactInfo,
  onAddDeviceSetup,
  onAddEventData,
  onAddEventInfoDetail,
  onAddEventStaff,
} from "../../../store/slices/eventSlice";
import { draftResumeState, pickSqlEventId, sqlLookupFor } from "../utils/eventDraft";

/**
 * Finishing or deleting a draft event (meeting 2026-09-29 `39:16`–`40:16`).
 *
 * Resuming rebuilds the wizard's Redux state from the saved event and opens
 * step 1 — pre-filled, and holding both database ids, so its Next PATCHes the
 * existing event rather than creating another. The SQL id is not on the Mongo
 * event and has to be looked up; if it cannot be found the wizard is NOT
 * opened, because step 1 would then create a duplicate.
 *
 * Deleting removes both records: the SQL row (when there is one — a create
 * that failed half way may have left only the Mongo document) and the Mongo
 * event.
 */
const useDraftEventActions = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();
  const [busyId, setBusyId] = useState(null);
  const role = resolveRoleType(user);

  const findSqlEventId = async (event) => {
    const response = await devitrakApi.post("/db_event/events_information", sqlLookupFor(event));
    return pickSqlEventId(response?.data?.events, user?.sqlInfo?.company_id);
  };

  const nameOf = (event) => event?.eventInfoDetail?.eventName ?? "The draft";

  const resume = async (event) => {
    setBusyId(event.id);
    try {
      const sqlEventId = await findSqlEventId(event);
      if (!sqlEventId) {
        notify(
          "error",
          "This draft cannot be reopened.",
          "Its event record was not found, and continuing would create a second event. Delete the draft and start again."
        );
        return;
      }
      const state = draftResumeState(event, sqlEventId);
      dispatch(onAddEventData(state.eventData));
      dispatch(onAddEventInfoDetail(state.eventInfoDetail));
      dispatch(onAddContactInfo(state.contactInfo));
      dispatch(onAddEventStaff(state.staff));
      dispatch(onAddDeviceSetup(state.deviceSetup));
      navigate("/create-event-page/event-detail");
    } catch (error) {
      notify("error", "The draft could not be opened.", error?.message ?? "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (event) => {
    setBusyId(event.id);
    try {
      // A lookup failure is not a reason to keep the Mongo draft around.
      const sqlEventId = await findSqlEventId(event).catch(() => null);
      if (sqlEventId) {
        /* The server reads the id from the URL; the `{ email }` it used to
           read instead is gone (backend answers 2026-10-06 §2). A 404 means
           there is no SQL row to delete, which is the normal case for a draft
           that never got one — the Mongo document still has to go. A 409
           means the event still has inventory or staff, and removing Mongo
           would strand that row. See sqlDeleteOutcome. */
        const sqlResponse = await devitrakApi
          .delete(`/db_event/${sqlEventId}`)
          .catch((error) => error?.response ?? { status: 0 });
        const outcome = sqlDeleteOutcome(sqlResponse?.status);
        if (outcome === "blocked") {
          notify(
            "error",
            "This event cannot be deleted yet.",
            "It still has inventory, staff or registrations attached. Remove those first."
          );
          return;
        }
        if (outcome === "failed") {
          notify(
            "error",
            "The draft could not be deleted.",
            sqlResponse?.data?.msg ?? "The event could not be removed from the records."
          );
          return;
        }
      }
      await devitrakApi.delete(`/event/delete-event/${event.id}`);
      /* The list endpoint caches its answer on the server under its own query
         string, so refetching without this gets the deleted event back and
         only a page reload shows the truth. */
      await clearCacheMemory(eventsListCacheKey(user?.company)).catch(() => null);
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      notify("success", `“${nameOf(event)}” was deleted.`);
    } catch (error) {
      notify(
        "error",
        "The draft could not be deleted.",
        error?.response?.data?.msg ?? error?.message ?? "Please try again."
      );
    } finally {
      setBusyId(null);
    }
  };

  return {
    resume,
    remove,
    busyId,
    canResume: hasPermission("event:create", role),
    canDelete: hasPermission("event:delete", role),
    contextHolder,
  };
};

export default useDraftEventActions;
