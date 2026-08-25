import { MenuItem, Select } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import renderingTitle from "../../../../components/general/renderingTitle";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import Label from "../../../../components/UX/inputs/Label";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import { ProfileSkeleton } from "../../../../components/UX/profile";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";
import "../../../../styles/global/actionForm.css";

/** The two staff buckets an event keeps, and what each is called on screen. */
const EVENT_ROLES = [
  {
    value: "adminUser",
    label: "Administrator",
    hint: "Full access to the event: consumers, devices and transactions.",
  },
  {
    value: "headsetAttendees",
    label: "Assistant",
    hint: "Hands devices out and takes them back. Cannot delete anything.",
  },
];

/**
 * Putting this person on an event.
 *
 * It used to be a route rendering a card with a "Go back" link, reporting both
 * of its outcomes through `alert()` — the browser dialog, for "assigned" and
 * for "already assigned" alike — and reading the person's email from
 * `profile.user` in the duplicate check while every sibling reads
 * `profile.email`. When `profile.user` was absent the check passed silently and
 * the event's staff array grew an entry with `email: undefined`.
 *
 * Now: a modal over the profile, the event and role chosen from two labelled
 * selects that say what each role can do, and both outcomes stated in the page.
 */
const AssignStaffMemberToEvent = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const [eventId, setEventId] = useState("");
  const [role, setRole] = useState("");
  const [notice, setNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Every sibling in this folder reads `profile.email`; the duplicate check here
  // read `profile.user`, which is what the company employee record uses.
  const staffEmail = profile.email ?? profile.user;

  const eventsQuery = useQuery({
    queryKey: ["eventsPerCompanyList", user.company],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        type: "event",
        active: true,
      }),
    enabled: Boolean(user.company),
  });

  const events = useMemo(
    () => eventsQuery.data?.data?.list ?? [],
    [eventsQuery.data]
  );

  const selectedEvent = events.find((item) => item.id === eventId) ?? null;
  const selectedRole = EVENT_ROLES.find((item) => item.value === role) ?? null;

  const closeModal = () => {
    if (isSubmitting) return;
    navigate(`/staff/${profile.adminUserInfo.id}/main`);
  };

  const alreadyOnEvent = useMemo(() => {
    if (!selectedEvent || !role) return false;
    const bucket = selectedEvent.staff?.[role] ?? [];
    return bucket.some((member) => member.email === staffEmail);
  }, [selectedEvent, role, staffEmail]);

  const handleAssign = async () => {
    setNotice(null);

    if (!selectedEvent || !role) {
      return setNotice("Choose an event and a role first.");
    }
    if (alreadyOnEvent) {
      return setNotice(
        `${profile.firstName ?? "This person"} is already on ${
          selectedEvent.eventInfoDetail.eventName
        } as ${selectedRole.label}.`
      );
    }

    setIsSubmitting(true);
    try {
      const bucket = selectedEvent.staff?.[role] ?? [];
      const updated = [
        ...bucket,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: staffEmail,
          role: selectedRole.label,
        },
      ];

      await devitrakApi.patch(`/event/edit-staff-event/${selectedEvent.id}`, {
        [`staff.${role}`]: updated,
      });

      await clearCacheMemory(`event_staff_info=${selectedEvent.id}`);
      queryClient.invalidateQueries({ queryKey: ["staffProfileEvents"] });
      queryClient.invalidateQueries({ queryKey: ["eventsPerCompanyList"] });

      notify(
        "success",
        `Added to ${selectedEvent.eventInfoDetail.eventName}.`,
        `${profile.firstName ?? "This person"} is now ${selectedRole.label} there.`
      );
      return closeModal();
    } catch {
      setNotice("The event was not updated. Nothing changed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const body = (
    <div className="action-form">
      {contextHolder}

      {eventsQuery.isLoading ? (
        <ProfileSkeleton lines={3} />
      ) : (
        <>
          <p className="action-form__lead">
            Only events that are still running are listed.
          </p>

          {events.length === 0 ? (
            <p className="action-form__empty">
              There are no running events to add this person to.
            </p>
          ) : (
            <>
              <div className="action-form__field">
                <Label>Event</Label>
                <Select
                  className="custom-autocomplete"
                  value={eventId}
                  displayEmpty
                  disabled={isSubmitting}
                  onChange={(event) => setEventId(event.target.value)}
                  style={{ ...AntSelectorStyle, background: "#fff" }}
                >
                  <MenuItem value="" disabled>
                    Select an event
                  </MenuItem>
                  {events.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.eventInfoDetail.eventName}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div className="action-form__field">
                <Label>Role on this event</Label>
                <Select
                  className="custom-autocomplete"
                  value={role}
                  displayEmpty
                  disabled={isSubmitting}
                  onChange={(event) => setRole(event.target.value)}
                  style={{ ...AntSelectorStyle, background: "#fff" }}
                >
                  <MenuItem value="" disabled>
                    Select a role
                  </MenuItem>
                  {EVENT_ROLES.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
                {/* What the role grants, said where it is chosen. */}
                {selectedRole && (
                  <p className="action-form__step-note">{selectedRole.hint}</p>
                )}
              </div>

              {alreadyOnEvent && (
                <p className="action-form__notice">
                  {profile.firstName ?? "This person"} is already on this event as{" "}
                  {selectedRole.label}.
                </p>
              )}
            </>
          )}

          {notice && <p className="action-form__notice">{notice}</p>}

          <div className="action-form__footer">
            <GrayButtonComponent
              title="Cancel"
              buttonType="button"
              disabled={isSubmitting}
              func={closeModal}
            />
            <BlueButtonComponent
              title="Add to event"
              buttonType="button"
              isDisabled={
                !eventId ||
                !role ||
                alreadyOnEvent ||
                isSubmitting ||
                events.length === 0
              }
              isLoading={isSubmitting}
              func={handleAssign}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <ModalUX
      title={renderingTitle("Add to an event")}
      openDialog
      closeModal={closeModal}
      closable={!isSubmitting}
      footer={null}
      width={520}
      body={body}
    />
  );
};

export default AssignStaffMemberToEvent;
