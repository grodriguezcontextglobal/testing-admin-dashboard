import { useMemo, useState } from "react";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import {
  buildConsumerEventPayloads,
  parseConfirmationParams,
} from "../conditionalPage/utils/eventRegistrationUtils";

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
 */
const card = {
  background: "var(--base-white, #fff)",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "var(--radius-xl, 12px)",
  boxShadow: "var(--shadow-sm)",
  padding: "32px",
  width: "100%",
  maxWidth: "480px",
  textAlign: "left",
};
const page = {
  minHeight: "100dvh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  boxSizing: "border-box",
  background: "var(--gray-50, #f7f7f4)",
};
const title = {
  fontFamily: "Inter, sans-serif",
  fontSize: "22px",
  fontWeight: 700,
  color: "var(--gray-900, #171d1a)",
  margin: "0 0 8px",
};
const subtitle = {
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  color: "var(--gray-600, #475467)",
  margin: "0 0 20px",
  lineHeight: "20px",
};

const AttendanceConfirmationLanding = () => {
  const parsed = useMemo(
    () => parseConfirmationParams(new URLSearchParams(window.location.search)),
    [],
  );

  const [status, setStatus] = useState("idle"); // idle | loading | confirmed | already-confirmed | error
  const [errorMessage, setErrorMessage] = useState("");

  if (parsed.error) {
    return (
      <div style={page}>
        <div style={card}>
          <p style={title}>Invalid link</p>
          <p style={subtitle}>{parsed.error}</p>
        </div>
      </div>
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

  const memberDisplayName = `${memberFirstName} ${memberLastName}`.trim() || memberEmail;

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

      const lookup = await devitrakApi.post("/auth/user-query", { email: memberEmail });
      const existingConsumer = lookup?.data?.ok && lookup.data.users?.length > 0
        ? lookup.data.users.at(-1)
        : null;

      if (existingConsumer) {
        const alreadyConfirmed = (existingConsumer.event_providers ?? []).some(
          (id) => id === eventId,
        );
        if (alreadyConfirmed) {
          setStatus("already-confirmed");
          return;
        }
        const { merge } = buildConsumerEventPayloads(member, event, companyRecord, existingConsumer);
        await devitrakApi.patch(`/auth/${existingConsumer.id}`, merge);
        setStatus("confirmed");
        return;
      }

      const { auth, db } = buildConsumerEventPayloads(member, event, companyRecord, null);
      await devitrakApi.post("/auth/new", auth);
      await devitrakApi.post("/db_consumer/new_consumer", db);
      setStatus("confirmed");
    } catch (error) {
      setErrorMessage(error?.response?.data?.msg ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "confirmed") {
    return (
      <div style={page}>
        <div style={card}>
          <p style={title}>Attendance confirmed</p>
          <p style={subtitle}>See you at {eventName}!</p>
        </div>
      </div>
    );
  }

  if (status === "already-confirmed") {
    return (
      <div style={page}>
        <div style={card}>
          <p style={title}>Already confirmed</p>
          <p style={subtitle}>
            {memberDisplayName} is already confirmed to attend {eventName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={card}>
        <p style={title}>Confirm your attendance</p>
        <p style={subtitle}>
          {memberDisplayName} has been invited to attend <strong>{eventName}</strong>.
        </p>
        {status === "error" && (
          <p style={{ ...subtitle, color: "var(--error-700, #9a3922)" }}>{errorMessage}</p>
        )}
        <BlueButtonComponent
          title={status === "error" ? "Retry" : "Confirm attendance"}
          func={handleConfirm}
          loadingState={status === "loading"}
          styles={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default AttendanceConfirmationLanding;
