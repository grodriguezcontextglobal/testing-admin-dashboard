import { useMutation } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { devitrakApi } from "../../../api/devitrakApi";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { maskEmail } from "../utils/mfaResetEmail";
import { buildResetEmailRequest } from "../utils/passwordPolicy";

/**
 * Shown on the password step when an admin reset this account's MFA
 * (FedRAMP A5 · IA-5, utils/mfaResetEmail.js). The enrolment modal does not
 * open: the person sets MFA up again from the link in their email.
 * "Send a new email" is the forgot-password call; the server always answers
 * 202 and sends at most three an hour.
 */
const MfaResetEmailNotice = ({ message, email }) => {
  const masked = maskEmail(email);
  const resend = useMutation({
    mutationFn: () =>
      devitrakApi.post("/nodemailer/reset-admin-password", buildResetEmailRequest(email)),
  });

  return (
    <div
      role="status"
      data-testid="mfa-reset-email-notice"
      style={{
        margin: "0 0 16px",
        padding: "12px 16px",
        borderRadius: "8px",
        border: "1px solid var(--warning-300, #fec84b)",
        background: "var(--warning-25, #fffcf5)",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <p style={{ margin: 0, fontSize: "14px", lineHeight: "20px", color: "var(--gray-700, #344054)" }}>
        {message}
        {masked ? ` We sent it to ${masked}.` : ""}
      </p>
      {resend.isSuccess ? (
        <p style={{ margin: 0, fontSize: "12px", lineHeight: "18px", color: "var(--gray-500, #667085)" }}>
          We sent a new link. It can take a few minutes, and we send at most three an hour.
        </p>
      ) : null}
      {resend.isError ? (
        <p style={{ margin: 0, fontSize: "12px", lineHeight: "18px", color: "var(--error-600, #d92d20)" }}>
          The email could not be sent. Please try again.
        </p>
      ) : null}
      <div>
        <GrayButtonComponent
          size="sm"
          title="Send a new email"
          func={() => resend.mutate()}
          isLoading={resend.isPending}
          isDisabled={resend.isPending}
        />
      </div>
    </div>
  );
};

MfaResetEmailNotice.propTypes = {
  message: PropTypes.string.isRequired,
  email: PropTypes.string,
};

export default MfaResetEmailNotice;
