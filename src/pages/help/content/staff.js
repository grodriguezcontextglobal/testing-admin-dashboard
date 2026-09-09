/**
 * Staff — the manual.
 *
 * The seven profile actions and their order come from
 * staff/detail/utils/staffProfileActionList; each one is offered only when the
 * matching permission is held, which is why two people looking at the same
 * staff member see different buttons.
 */

export const staffSection = {
  id: "staff",
  title: "Staff",
  summary:
    "The people who work for the company and sign in to this dashboard. A staff member has a role (what they may do anywhere), locations (where they may do it), and events (which jobs they are on) — three separate things that are easy to confuse.",
  articles: [
    {
      id: "staff-find",
      title: "The staff list",
      appRoute: "/staff",
      summary:
        "Everybody with an account, their role, and whether their access is currently on. Opening one goes to their profile.",
      rules: [
        "The section needs permission to read staff. An assistant does not see it at all.",
        "Somebody with access switched off keeps their record and their history — it is not the same as removing them.",
      ],
      related: ["staff-add", "staff-profile"],
    },
    {
      id: "staff-add",
      title: "Adding somebody to the team",
      appRoute: "/staff",
      summary:
        "Two steps, and the first one only reads: find the person before creating them, because the same person invited twice is two accounts and two histories.",
      steps: [
        {
          text: "Step one — search for the person by email. If they already exist, you link them rather than duplicating them.",
        },
        {
          text: "Step two — choose the role they should hold, then send.",
          note: "The invitation is the email. They set their own password from the link in it, so you never handle their password.",
        },
      ],
      rules: [
        "Adding staff needs permission to create staff — a manager can usually work with the team they have without being able to grow it.",
        "The role you pick here is what the app enforces from their first sign-in. It can be changed later from their profile.",
      ],
      pitfalls: [
        "Inviting an address that already has an account creates a second one. Use the first step for what it is for — it exists because this happened.",
      ],
      related: ["staff-roles", "staff-access"],
    },
    {
      id: "staff-profile",
      title: "A staff member's profile",
      appRoute: "/staff",
      summary:
        "One page with up to seven actions on it. Which ones you see depends on what you are allowed to do — the buttons are not hidden to be tidy, they are absent because the action is not yours.",
      steps: [
        { text: "Assign devices — hand equipment to this person, the same way a consumer receives it." },
        { text: "Edit details — their own information." },
        { text: "Assign to an event — put them on a job." },
        { text: "Locations & permissions — which stock they can see and work with." },
        { text: "Change role — what they may do across the whole app." },
        { text: "Update contact info — phone and email, without touching anything else." },
        { text: "Send password reset email — they set the new password themselves." },
      ],
      rules: [
        "Each action has its own permission, so two people looking at the same profile can see different buttons.",
        "\"Update contact info\" and \"Change role\" are deliberately separate: correcting a phone number is not the same act as granting somebody more access, and they should not be one button.",
      ],
      related: ["staff-events", "staff-devices", "staff-roles"],
    },
    {
      id: "staff-events",
      title: "Assigning staff to an event",
      appRoute: "/staff",
      summary:
        "Being on an event is what lets somebody work it — hand out equipment, take returns, see its consumers. It is granted per event and it ends when the event closes.",
      steps: [
        {
          text: "From the staff member's profile, choose \"Assign to an event\".",
        },
        {
          text: "Or do it from the event's own staff block, which is the better route when you are staffing one job with several people.",
        },
      ],
      rules: [
        "Closing an event removes staff access to it. That is part of what closing does, not a side effect — nobody has to be un-assigned afterwards.",
        "Event access is not a role. Putting an assistant on an event does not let them delete it.",
      ],
      related: ["events-staff", "events-close"],
    },
    {
      id: "staff-devices",
      title: "Equipment held by staff",
      appRoute: "/staff",
      summary:
        "Staff hold equipment too — a scanner, a laptop, a radio — and it is tracked the same way a consumer's is, because a device in a colleague's bag is still a device that is out.",
      steps: [
        { text: "Assign a device to the staff member by serial." },
        { text: "Their profile lists what they are holding and since when." },
        { text: "Return it from the same list when it comes back." },
      ],
      rules: [
        "A device assigned to staff counts as out, not as in stock. The inventory view shows the staff member as its holder.",
      ],
      related: ["inventory-statuses", "staff-profile"],
    },
    {
      id: "staff-access",
      title: "Access, passwords and leaving",
      appRoute: "/staff",
      summary:
        "How somebody gets in, gets locked out, and what happens to their history either way.",
      steps: [
        {
          text: "Send a password reset email — the link lets them set their own; you never see or type it.",
        },
        {
          text: "Switch access off when somebody leaves. They cannot sign in, and everything they did stays on the record.",
        },
      ],
      rules: [
        "Switching access off is reversible and keeps the audit trail. It is the right move for somebody who has left.",
        "A password reset is a link, not a password. Nobody in the app can read or set another person's password.",
      ],
      pitfalls: [
        "Turning access off does not release equipment the person is holding. Return their devices first, or they stay out against a record nobody is checking.",
      ],
      related: ["staff-devices", "profile-staff-activity"],
    },
  ],
};
