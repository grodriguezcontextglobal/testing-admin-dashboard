/**
 * The one-off email an admin writes to a single consumer.
 *
 * The rules and the body were inline in SingleEmail.jsx, where the subject was
 * tracked by react-hook-form, the message by `useState`, and the two were
 * cleared with `setValue` calls — one of which pointed at a field react-hook-form
 * never held, because `{...register("message")}` was spread onto an antd
 * TextArea whose own `onChange` then overwrote it.
 */

/** antd's `maxLength` on the old TextArea. Kept, and now stated in the UI. */
export const MESSAGE_MAX_LENGTH = 500;

const text = (value) => String(value ?? "").trim();

/** One message per field, so it can be rendered under the field it is about. */
export const singleEmailFieldErrors = ({ subject, message } = {}) => {
  const errors = {};
  if (!text(subject)) errors.subject = "The email needs a subject.";

  const body = String(message ?? "");
  if (!text(body)) {
    errors.message = "Write the message you want to send.";
  } else if (body.length > MESSAGE_MAX_LENGTH) {
    errors.message = `${body.length - MESSAGE_MAX_LENGTH} characters over the ${MESSAGE_MAX_LENGTH}-character limit.`;
  }

  return errors;
};

/**
 * Body for POST /api/nodemailer/single-email-notification.
 *
 * Unchanged from what the screen has always sent. `event` is read defensively
 * because this modal also opens from the consumer list, where no event need be
 * in context — the old code read `event.eventInfoDetail.eventName` straight
 * through and threw before it could send anything.
 */
export const buildSingleEmailPayload = ({ customer, event, subject, message }) => ({
  consumer: customer?.email,
  subject,
  message,
  eventSelected: event?.eventInfoDetail?.eventName,
  company: event?.company,
});

/**
 * Who receives this, stated rather than assumed.
 *
 * `canSend` is the honest answer to "is there an address to send to": the old
 * screen printed "This email will be sent to undefined." and let you write it.
 */
export const describeRecipient = (customer) => {
  const email = text(customer?.email);
  return {
    name: `${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim(),
    email,
    canSend: Boolean(email),
  };
};

/** The event the email will reference, or null when there is none in context. */
export const describeEventContext = (event) => {
  const name = text(event?.eventInfoDetail?.eventName);
  return name ? { name, company: text(event?.company) } : null;
};
