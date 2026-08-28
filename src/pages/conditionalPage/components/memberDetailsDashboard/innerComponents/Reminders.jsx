import { useQueryClient } from "@tanstack/react-query";
import { Input as AntInput } from "antd";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Chip from "../../../../../components/UX/Chip/Chip";
import Input from "../../../../../components/UX/inputs/Input";
import Label from "../../../../../components/UX/inputs/Label";
import { ProfileSkeleton } from "../../../../../components/UX/profile";
import "../../../../../styles/global/actionForm.css";
import useMemberAssignedDevices from "../../../hooks/useMemberAssignedDevices";
import {
  availableTemplates,
  buildReminderPayload,
  buildReminderSubject,
  overdueLoans,
  reminderRecipients,
  upcomingLoans,
} from "../../../utils/reminderTemplates";

const MAX_MESSAGE = 500;

/**
 * Emailing a member about the devices they are holding.
 *
 * The screen was called "Reminders" and knew nothing about anything: a blank
 * subject box and a blank message box, both placeholder-only, with a single
 * full-width "Send email" button and no title. Whoever used it retyped the same
 * three sentences every time and went back to the previous page to copy the
 * serial numbers and due dates by hand.
 *
 * It now starts from the loans the profile has already fetched: pick "Overdue
 * return" and the message is written, naming each late device and its date. The
 * overdue template is only offered when something actually is overdue.
 *
 * Fixed along the way:
 *   - The guardian was added on `memberInfo.minor === 1` — strict, against a
 *     number, while the field arrives as the string "1" on several paths. A
 *     minor's guardian was silently left off the email.
 *   - The message was tracked twice, in `useState` and in react-hook-form, and
 *     the payload read the state while `reset()` cleared the form — so neither
 *     the sent value nor the clearing could be relied on.
 *   - `if (resp.data.ok)` had no `else` and there was no `try`: a rejected send
 *     produced no message, no error and no navigation, and a network failure
 *     was an unhandled rejection.
 *   - Nothing stopped a second click while the first was in flight, and sending
 *     a second copy of an email is not something you can take back.
 */
const Reminders = () => {
  const { user } = useSelector((state) => state.admin);
  const { memberInfo } = useSelector((state) => state.member);
  const { id: routeMemberId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const [templateKey, setTemplateKey] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isSending, setIsSending] = useState(false);
  // Plain state: two fields, no validation library, and nothing here that
  // react-hook-form was doing for it. It used to track the message in *both* —
  // `register("message")` and a `useState` — with the payload reading one and
  // `reset()` clearing the other.
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const companyName = user?.companyData?.company_name;
  const memberId = memberInfo?.member_id ?? routeMemberId;
  const devicesQuery = useMemberAssignedDevices(
    memberId,
    user?.sqlInfo?.company_id
  );

  const overdue = useMemo(() => overdueLoans(devicesQuery.rows), [devicesQuery.rows]);
  const upcoming = useMemo(
    () => upcomingLoans(devicesQuery.rows),
    [devicesQuery.rows]
  );

  const templates = useMemo(
    () => availableTemplates({ overdue, upcoming }),
    [overdue, upcoming]
  );

  const recipients = reminderRecipients(memberInfo);

  const goBack = () => navigate(`/member/${memberId}/main`);

  const applyTemplate = (template) => {
    setNotice(null);
    setTemplateKey(template.key);
    const filled = template.build({
      member: memberInfo,
      overdue,
      upcoming,
      companyName,
      staffName: [user?.name, user?.lastName].filter(Boolean).join(" "),
      staffEmail: user?.email,
    });
    setSubject(filled.subject);
    setMessage(filled.message);
  };

  const onSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setNotice(null);

    if (recipients.length === 0) {
      return setNotice(
        "There is no email address on file for this member, so nothing can be sent."
      );
    }
    if (!subject.trim() || !message.trim()) {
      return setNotice("A subject and a message are both needed.");
    }

    setIsSending(true);
    try {
      const response = await devitrakApi.post(
        "/nodemailer/single-email-notification",
        buildReminderPayload({
          member: memberInfo,
          subject,
          message,
          companyName,
        })
      );

      // Was `if (resp.data.ok)` with nothing on the other side.
      if (!response.data?.ok) {
        return setNotice("The email was not queued. Nothing was sent.");
      }

      queryClient.invalidateQueries({ queryKey: ["memberAssignedDevices"] });
      notify(
        "success",
        "Reminder queued.",
        `${recipients.join(" and ")} will receive it shortly.`
      );
      return goBack();
    } catch {
      setNotice("The email was not queued. Nothing was sent.");
    } finally {
      setIsSending(false);
    }
  };

  if (devicesQuery.isLoading) return <ProfileSkeleton lines={4} />;

  return (
    <form className="action-form" onSubmit={onSubmit}>
      {contextHolder}

      <div className="action-form__header">
        <h2 className="action-form__title">Send a reminder</h2>
        <p className="action-form__lead">
          {recipients.length > 0
            ? "This email goes to:"
            : "No email address is on file for this member."}
        </p>
        {recipients.length > 0 && (
          <div className="action-form__chips">
            {recipients.map((email) => (
              <Chip key={email} label={email} variant="outlined" />
            ))}
          </div>
        )}
      </div>

      {overdue.length > 0 && (
        <p className="action-form__banner action-form__banner--critical">
          <strong>
            {overdue.length} device{overdue.length === 1 ? " is" : "s are"} overdue.
          </strong>{" "}
          The overdue template lists them for you.
        </p>
      )}

      {/* 1 — what kind of reminder. The screen used to start on an empty box
          with no clue that any of this was known. */}
      <section className="action-form__step">
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            What is this about?
          </h3>
        </div>
        <div className="action-form__chips">
          {templates.map((template) => (
            <Chip
              key={template.key}
              label={template.label}
              variant={template.key === templateKey ? "filled" : "outlined"}
              color={template.key === templateKey ? "primary" : "default"}
              onClick={isSending ? undefined : () => applyTemplate(template)}
            />
          ))}
        </div>
        <p className="action-form__step-note">
          {templates.find((template) => template.key === templateKey)?.hint ??
            "Pick one to start from, or write your own."}
        </p>
      </section>

      {/* 2 — the email itself */}
      <section className="action-form__step">
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">2</span>
            The email
          </h3>
        </div>

        <div className="action-form__field">
          <Label>Subject</Label>
          <Input
            name="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={isSending}
            placeholder="Overdue device"
          />
          {subject.trim() && (
            // What the recipient's inbox will show — the company suffix is
            // appended by the payload and was invisible here.
            <p className="action-form__step-note">
              Arrives as “{buildReminderSubject(subject, companyName)}”
            </p>
          )}
        </div>

        <div className="action-form__field">
          <Label>Message</Label>
          <AntInput.TextArea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isSending}
            showCount
            maxLength={MAX_MESSAGE}
            autoSize={{ minRows: 8, maxRows: 16 }}
            placeholder="Write the message here."
          />
        </div>
      </section>

      {notice && <p className="action-form__notice">{notice}</p>}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          The email is sent immediately and cannot be recalled.
        </p>
        <GrayButtonComponent
          title="Back"
          buttonType="button"
          disabled={isSending}
          func={goBack}
        />
        <BlueButtonComponent
          title="Send reminder"
          buttonType="submit"
          isDisabled={
            isSending ||
            recipients.length === 0 ||
            !subject.trim() ||
            !message.trim()
          }
          isLoading={isSending}
        />
      </div>
    </form>
  );
};

export default Reminders;
