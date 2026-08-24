/**
 * What a reminder to a member actually says.
 *
 * The screen was called "Reminders" and was a blank subject box and a blank
 * message box: nothing about it knew the member holds devices, or that any of
 * them are overdue. Whoever used it retyped the same three sentences and looked
 * up the serial numbers by hand on the previous page.
 *
 * The templates are built here from the loans the profile has already fetched,
 * so the message names the devices and the dates without anyone copying them.
 */

import {
  calendarDaysUntil,
  formatLoanDate,
} from "../../../components/UX/profile";

const text = (value) => String(value ?? "").trim();

/** The member's name as it should be addressed in an email. */
export function memberDisplayName(member) {
  return (
    [member?.first_name, member?.last_name].map(text).filter(Boolean).join(" ") ||
    text(member?.email) ||
    "there"
  );
}

/**
 * Everyone who receives this email.
 *
 * The guardian was added on `memberInfo.minor === 1` — a strict comparison
 * against a number, while the same field arrives as the string "1" on several
 * paths and every other check in this domain reads `Number(minor) === 1`. When
 * it arrived as a string the guardian was silently left off a minor's email.
 */
export function reminderRecipients(member) {
  const recipients = [];
  const memberEmail = text(member?.email);
  if (memberEmail) recipients.push(memberEmail);

  const isMinor = Number(member?.minor) === 1;
  const guardianEmail = text(member?.parent_guardian_email);
  if (isMinor && guardianEmail && !recipients.includes(guardianEmail)) {
    recipients.push(guardianEmail);
  }

  return recipients;
}

/** One loan, in the words the email uses. */
export function describeLoan(row) {
  const name = text(row?.device_item_group) || "Device";
  const serial = text(row?.device_serial_number);
  const due = formatLoanDate(row?.expected_return_date);

  return [
    serial ? `${name} (${serial})` : name,
    due ? ` — due ${due}` : "",
  ].join("");
}

/** Loans past their due date, worst first. */
export function overdueLoans(rows, now = new Date()) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => {
      const days = calendarDaysUntil(row?.expected_return_date, now);
      return days !== null && days < 0;
    })
    .sort(
      (a, b) =>
        calendarDaysUntil(a?.expected_return_date, now) -
        calendarDaysUntil(b?.expected_return_date, now)
    );
}

/** Loans due within `withinDays`, soonest first. */
export function upcomingLoans(rows, withinDays = 7, now = new Date()) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => {
      const days = calendarDaysUntil(row?.expected_return_date, now);
      return days !== null && days >= 0 && days <= withinDays;
    })
    .sort(
      (a, b) =>
        calendarDaysUntil(a?.expected_return_date, now) -
        calendarDaysUntil(b?.expected_return_date, now)
    );
}

const bulletList = (rows) =>
  rows.map((row) => `• ${describeLoan(row)}`).join("\n");

/**
 * The three things this screen is used for.
 *
 * `available` decides whether the template is offered at all: an "overdue"
 * reminder with nothing overdue is a message that contradicts itself.
 */
export const REMINDER_TEMPLATES = [
  {
    key: "overdue",
    label: "Overdue return",
    hint: "For devices already past their due date.",
    available: ({ overdue }) => overdue.length > 0,
    build: ({ member, overdue, companyName }) => ({
      subject: `Overdue device${overdue.length === 1 ? "" : "s"}`,
      message: [
        `Hi ${memberDisplayName(member)},`,
        "",
        `Our records show the following ${
          overdue.length === 1 ? "device is" : "devices are"
        } past the return date:`,
        "",
        bulletList(overdue),
        "",
        "Please return it as soon as you can, or reply to this email if you need more time.",
        "",
        `Thank you,`,
        text(companyName),
      ].join("\n"),
    }),
  },
  {
    key: "upcoming",
    label: "Return coming up",
    hint: "For devices due back in the next few days.",
    available: ({ upcoming }) => upcoming.length > 0,
    build: ({ member, upcoming, companyName }) => ({
      subject: `Device return reminder`,
      message: [
        `Hi ${memberDisplayName(member)},`,
        "",
        `This is a reminder that the following ${
          upcoming.length === 1 ? "device is" : "devices are"
        } due back soon:`,
        "",
        bulletList(upcoming),
        "",
        "No action is needed if you are already planning to return it on time.",
        "",
        `Thank you,`,
        text(companyName),
      ].join("\n"),
    }),
  },
  {
    key: "custom",
    label: "Something else",
    hint: "Write your own subject and message.",
    available: () => true,
    build: () => ({ subject: "", message: "" }),
  },
];

/** Only the templates that make sense for this member right now. */
export function availableTemplates(context) {
  return REMINDER_TEMPLATES.filter((template) => template.available(context));
}

/**
 * The body sent to /nodemailer/single-email-notification.
 *
 * The subject is suffixed with the company name by the caller today; keeping
 * that here means the screen can show the recipient exactly what will arrive.
 */
export function buildReminderSubject(subject, companyName) {
  return `${text(subject)} - Notification from ${text(companyName)}`;
}

export function buildReminderPayload({ member, subject, message, companyName }) {
  return {
    consumer: reminderRecipients(member),
    subject: buildReminderSubject(subject, companyName),
    message: text(message),
    eventSelected: "",
    company: text(companyName),
  };
}
