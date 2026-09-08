import { useMemo, useState } from "react";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import { DevitrakLogo } from "../../components/icons/DevitrakLogo";
import {
  buildConsumerEventPayloads,
  parseConfirmationParams,
} from "../conditionalPage/utils/eventRegistrationUtils";
import {
  describeInvitation,
  isAlreadyInEvent,
  readConfirmationError,
  readExistingConsumer,
  writeSucceeded,
} from "./utils/attendanceConfirmation";
import "./publicLanding.css";

/**
 * Public attendance-confirmation landing — reached from the link emailed by
 * "Register [members] to event" (Members page). No Redux/session assumptions
 * (same trust model as MyDevicesPortal.jsx): every value rendered here comes
 * from the URL and is untrusted, so it is always rendered as plain text.
 *
 * Persistence only happens here, on Confirm: the member (or, for minors, the
 * confirming guardian) is created-or-updated as a consumer and the event is
 * added to their record — mirroring
 * src/pages/consumers/utils/CreateNewUser.jsx exactly. Idempotent: revisiting
 * or re-clicking after a successful confirmation shows "already confirmed"
 * instead of duplicating the consumer record.
 *
 * What the redesign changed, none of it on the wire:
 *
 *  - The link carries `company`, `minor` and `guardianEmail`, and none of the
 *    three was rendered. An unauthenticated page asked somebody to confirm
 *    without saying who was asking, and a guardian opening a link about their
 *    child was shown "{child} has been invited" with no statement that they
 *    were the one confirming — which is what the write has always done.
 *  - The event, the person and the decision are now three separate lines
 *    instead of one sentence carrying all of it.
 *  - `POST /auth/new` answers 200 with `{ ok: false }` when it refuses. The
 *    response was discarded, so the flow created the SQL consumer anyway and
 *    reported the attendance confirmed for a person who had not been created.
 *  - The "already confirmed" check compared the URL's string id to a possibly
 *    numeric one with `===`, so somebody already confirmed was offered the
 *    button again.
 *  - Every terminal state was a title and one line. They say what happens next.
 */
const AttendanceConfirmationLanding = () => {
  const parsed = useMemo(
    () => parseConfirmationParams(new URLSearchParams(window.location.search)),
    []
  );

  const [status, setStatus] = useState("idle"); // idle | loading | confirmed | already-confirmed | error
  const [errorMessage, setErrorMessage] = useState("");

  const invitation = useMemo(() => describeInvitation(parsed), [parsed]);

  const shell = (children) => (
    <div className="public-landing">
      <div className="public-landing__card">
        <div className="public-landing__brand">
          <DevitrakLogo />
        </div>
        {children}
      </div>
    </div>
  );

  if (parsed.error) {
    return shell(
      <>
        <h1 className="public-landing__title">This link is not usable</h1>
        <p className="public-landing__lead">{parsed.error}</p>
        <p className="public-landing__note">
          Ask whoever sent the invitation to send it again — nothing has been
          recorded either way.
        </p>
      </>
    );
  }

  const {
    memberEmail,
    memberFirstName,
    memberLastName,
    eventId,
    eventName,
    company,
    companyId,
  } = parsed;

  const handleConfirm = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const member = {
        first_name: memberFirstName,
        last_name: memberLastName,
        email: memberEmail,
      };
      const event = { id: eventId, eventInfoDetail: { eventName } };
      const companyRecord = { id: companyId, name: company };

      const lookup = await devitrakApi.post("/auth/user-query", {
        email: memberEmail,
      });
      const existingConsumer = readExistingConsumer(lookup);

      if (existingConsumer) {
        if (isAlreadyInEvent(existingConsumer, eventId)) {
          setStatus("already-confirmed");
          return;
        }
        const { merge } = buildConsumerEventPayloads(
          member,
          event,
          companyRecord,
          existingConsumer
        );
        const merged = await devitrakApi.patch(
          `/auth/${existingConsumer.id}`,
          merge
        );
        if (!writeSucceeded(merged)) {
          throw new Error(
            merged?.data?.msg || "The confirmation was not saved."
          );
        }
        setStatus("confirmed");
        return;
      }

      const { auth, db } = buildConsumerEventPayloads(
        member,
        event,
        companyRecord,
        null
      );
      /* Checked, because a refusal here used to be followed by the SQL insert
         and an "Attendance confirmed" screen. */
      const created = await devitrakApi.post("/auth/new", auth);
      if (!writeSucceeded(created)) {
        throw new Error(created?.data?.msg || "The confirmation was not saved.");
      }
      await devitrakApi.post("/db_consumer/new_consumer", db);
      setStatus("confirmed");
    } catch (error) {
      setErrorMessage(readConfirmationError(error));
      setStatus("error");
    }
  };

  if (status === "confirmed") {
    return shell(
      <>
        <p className="public-landing__eyebrow public-landing__eyebrow--ok">
          Confirmed
        </p>
        <h1 className="public-landing__title">
          {invitation.memberName} is going to {eventName}
        </h1>
        <p className="public-landing__lead">
          {company ? `${company} has been told.` : "The organiser has been told."}{" "}
          Nothing else is needed — you can close this page.
        </p>
        <p className="public-landing__note">
          If anything changes, contact {company || "the organiser"} directly;
          this link cannot cancel a confirmation.
        </p>
      </>
    );
  }

  if (status === "already-confirmed") {
    return shell(
      <>
        <p className="public-landing__eyebrow public-landing__eyebrow--ok">
          Already confirmed
        </p>
        <h1 className="public-landing__title">
          {invitation.memberName} is already going to {eventName}
        </h1>
        <p className="public-landing__lead">
          Nothing was recorded twice. You can close this page.
        </p>
      </>
    );
  }

  return shell(
    <>
      <p className="public-landing__eyebrow">
        {company || "Event invitation"}
      </p>
      <h1 className="public-landing__title">{invitation.heading}</h1>

      <dl className="public-landing__facts">
        <div>
          <dt>Event</dt>
          <dd>{eventName}</dd>
        </div>
        <div>
          <dt>{invitation.isMinor ? "Student" : "Attendee"}</dt>
          <dd>
            {invitation.memberName}
            {memberEmail && invitation.memberName !== memberEmail && (
              <span className="public-landing__facts-sub">{memberEmail}</span>
            )}
          </dd>
        </div>
      </dl>

      {invitation.roleLine && (
        <p className="public-landing__note public-landing__note--boxed">
          {invitation.roleLine}
        </p>
      )}

      {status === "error" && (
        <p className="public-landing__error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="public-landing__actions">
        <BlueButtonComponent
          title={status === "error" ? "Try again" : "Confirm attendance"}
          func={handleConfirm}
          loadingState={status === "loading"}
          isDisabled={status === "loading"}
          styles={{ width: "100%" }}
        />
      </div>

      <p className="public-landing__note">
        Confirming records the attendance with {company || "the organiser"}. To
        decline, reply to the invitation email — this page can only confirm.
      </p>
    </>
  );
};

export default AttendanceConfirmationLanding;
