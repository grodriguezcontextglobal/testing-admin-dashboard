/**
 * Profile and settings — the manual.
 *
 * The permission named on each article is the real guard from AuthRoutes, not
 * an approximation: the four gated pages are staff-activity (staff:read),
 * email-branding (profile:company_settings), school-compliance (member:update)
 * and roles (staff:assign_role). System jobs is gated differently again — on
 * an employee-level super-user flag rather than on a roleType — which is why
 * it cannot be granted by changing somebody's role.
 *
 * The role article's facts come from src/config/roles.js, which is the single
 * source of truth for the matrix. If a permission changes there, this article
 * is part of the change.
 */

export const profileSection = {
  id: "profile",
  title: "Profile and settings",
  summary:
    "Two things live under Profile, and it is worth knowing which is which. Some pages are about you — your name, your password, your notifications. The rest are about the company everybody in it shares, and those are the ones behind permissions.",
  articles: [
    {
      id: "profile-my-details",
      title: "My details, password and two-factor",
      appRoute: "/profile/my_details",
      summary:
        "Your own account: name, contact details, photo, password and the authenticator app. Every role has these — they are not company settings.",
      steps: [
        {
          text: "My details — your name, email, phone and photo.",
          note: "Saving keeps you signed in. If a save ever signs you out, that is a bug worth reporting, not the design.",
        },
        {
          text: "Password — change your own password.",
        },
        {
          text: "Two-factor — pair an authenticator app and enter the 6-digit code it shows.",
        },
      ],
      rules: [
        "These pages are not gated. Every role, including an assistant and the scoped roles, can reach all three.",
        "Changing your own details does not touch the company record — that is Company info, and it is gated.",
      ],
      related: ["profile-company-info", "staff-roles"],
    },
    {
      id: "profile-notifications",
      title: "Notifications",
      appRoute: "/profile/notifications",
      summary:
        "Which of the app's messages reach you, and how. This is per person, so turning something off here does not turn it off for your colleagues.",
      rules: [
        "Not gated: every role manages their own.",
        "Turning off a notification does not stop the underlying email to a consumer or a guardian. Those are addressed to them, not to you.",
      ],
      related: ["profile-email-branding"],
    },
    {
      id: "profile-company-info",
      title: "Company info",
      appRoute: "/profile/company-info",
      summary:
        "The company's own identity: name, address, logo, main contact. It is what appears on receipts and what consumers see as the organisation they are dealing with.",
      steps: [
        { text: "Edit the company's name, address and contact details." },
        {
          text: "Upload the company logo — the square mark the app header uses, and the fallback for receipts.",
        },
      ],
      rules: [
        "Saving updates the session too, so a receipt printed straight afterwards carries the new logo without signing out and in again.",
      ],
      related: ["profile-email-branding", "profile-billing"],
    },
    {
      id: "profile-email-branding",
      title: "Email branding",
      appRoute: "/profile/email-branding",
      summary:
        "Puts the company's name, logo and colour on the notification emails Devitrak sends on its behalf — so a guardian receiving a device receipt hears from the school, not from a vendor they have never dealt with.",
      elevated: true,
      steps: [
        {
          text: "Turn on \"Use our branding on notification emails\". It is off by default, and while it is off recipients see Devitrak's own branding.",
        },
        {
          text: "Set the sender name, upload an email logo, pick a brand colour and a reply-to address.",
          note: "Leave a field empty to inherit it — the placeholder shows what it would inherit. The email logo is separate from the app logo because a wordmark reads better in email than a square mark.",
        },
        {
          text: "Read the preview beside the form. It is rendered by the server through the same templates a real send uses, so what you see is what arrives.",
        },
        { text: "Add a footer line, and switch off \"Powered by Devitrak\" for a full white-label." },
      ],
      rules: [
        "Needs permission to change company settings — the same gate as the rest of the company-wide pages.",
        "The from-address stays noreply@devitrak.com so mail keeps passing its sender checks. The sender *name* is yours; the address is not.",
        "An invalid colour is not saved: the renderer would ignore it, and a stored value the preview refuses to honour reads as a bug.",
      ],
      pitfalls: [
        "Filling the fields is not enough — the switch has to be on. Configured-but-off is the usual reason branding \"did not apply\".",
      ],
      related: ["profile-company-info", "profile-notifications"],
    },
    {
      id: "staff-roles",
      title: "Roles — who can do what",
      appRoute: "/profile/roles",
      summary:
        "A role is not a job title here, it is a set of permissions. There are six main roles plus four scoped ones, and the difference between them is exactly what the app will and will not let a person do.",
      elevated: true,
      steps: [
        {
          text: "Open Profile → Roles to see the staff you have and the role each one holds.",
        },
        {
          text: "Change a role to change what that person can reach, immediately.",
        },
      ],
      rules: [
        "Root administrator — everything, including the things nobody else should have.",
        "Administrator — everything operational: events, inventory, consumers, staff and company settings.",
        "Sales associate — reads and updates events and inventory, but cannot create or delete either. The role for somebody who quotes work without running it.",
        "Event manager — full control of events, including deleting them, and of the posts area. No inventory creation.",
        "Inventory manager — creates, updates and deletes inventory, and the posts area. Not events.",
        "Assistant — works events (create, read, update) but cannot delete one, and cannot manage inventory or staff. The on-site role.",
        "Scoped roles — an inventory location manager or assistant, or a category manager or assistant, sees inventory only within the locations or categories they are scoped to. Their baseline is home, inventory and their own profile; events, consumers, staff and students are deliberately outside it.",
        "Changing a role takes effect on that person's next action, not on their next login.",
      ],
      pitfalls: [
        "Some pages are not reachable by any role because they are gated on an employee-level super-user flag instead — System jobs is one. Granting a role will not open those.",
        "Old records store the role as a number rather than a name. The app resolves both, so a legacy account behaves like its named equivalent — but if you are reading a raw record, 0 is root, 1 admin, 2 sales, 3 event, 4 inventory, 5 assistant.",
      ],
      related: ["profile-staff-activity", "profile-my-details"],
    },
    {
      id: "profile-school-compliance",
      title: "School compliance",
      appRoute: "/profile/school-compliance",
      summary:
        "The consent rules a school runs on: whether a minor can be handed equipment before a guardian has agreed, and the stricter gate for pupils under 13.",
      elevated: true,
      steps: [
        {
          text: "\"Require guardian consent for minors\" — when on, assigning a device to a minor needs recorded guardian consent first.",
        },
        {
          text: "\"Require COPPA consent for under-13 students\" — the additional gate for the youngest pupils.",
        },
        {
          text: "Choose which of your documents is the consent the guardian agrees to.",
        },
      ],
      rules: [
        "Needs permission to update a student — the same gate as editing one.",
        "These are company-wide. They change what assignment allows from the moment they are saved.",
      ],
      related: ["students-consent", "students-assign", "profile-documents"],
    },
    {
      id: "profile-staff-activity",
      title: "Staff activity — the audit trail",
      appRoute: "/profile/staff-activity",
      summary:
        "Who did what, and when. It is the record you go to after the fact: who assigned that device, who closed that event, who changed that role.",
      elevated: true,
      rules: [
        "Needs permission to read staff. An assistant does not see it.",
        "It is a record, not a feed to act on — nothing here can be undone from this page.",
      ],
      related: ["staff-roles"],
    },
    {
      id: "profile-billing",
      title: "Billing, subscription and the payment account",
      appRoute: "/profile/billing",
      summary:
        "What the company pays Devitrak, and the Stripe account the company gets paid *into* when it takes deposits and fees. Two different things on two different pages.",
      steps: [
        {
          text: "Billing — the plan, the invoices and the card Devitrak charges.",
        },
        {
          text: "Connected account — the Stripe account that receives deposits and fees from consumers.",
          note: "Without it the app cannot take a card payment at all: deposits, lost-device fees and student fees all run through it.",
        },
      ],
      rules: [
        "Neither page is gated by role, so check who you are giving dashboard access to — billing details are visible to any role that can sign in.",
      ],
      related: ["students-fees", "profile-company-info"],
    },
    {
      id: "profile-documents",
      title: "Documents and providers",
      appRoute: "/profile/documents",
      summary:
        "The paperwork the company reuses: liability terms, privacy policies, consent forms — and the suppliers those documents belong to.",
      steps: [
        { text: "Upload a document, then view or edit it from the list." },
        {
          text: "Documents uploaded here are what an event's Documents step and the school consent settings choose from.",
        },
        { text: "Providers holds your suppliers and their own paperwork." },
      ],
      pitfalls: [
        "A supplier document can be uploaded but there is no download route for it yet. Treat the upload as a record that the document exists, not as your only copy of it.",
      ],
      related: ["profile-school-compliance", "inventory-suppliers", "events-create"],
    },
    {
      id: "profile-policies",
      title: "Platform policies and system jobs",
      appRoute: "/profile/platform_policies",
      summary:
        "Devitrak's own terms, and — for Devitrak staff only — the queue behind the app's slower operations.",
      rules: [
        "Platform policies is readable by anybody signed in.",
        "System jobs is gated on an employee-level super-user flag rather than on a role, so no role change grants it. It shows the state of queued work such as bulk imports.",
      ],
      related: ["staff-roles"],
    },
  ],
};
