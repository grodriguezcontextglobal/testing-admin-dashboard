/**
 * Students — the manual.
 *
 * Written against the code: the profile's tabs and their permissions come from
 * memberDetailsDashboard/utils/memberNavTabs, the routes from AuthRoutes
 * (/members and /member/:id/*, all behind nav:members), and the consent rules
 * from Profile/school_compliance/SchoolComplianceSettings.
 *
 * The code calls them members; the school vertical calls them students, and so
 * does this manual — a school's staff should not have to learn our word for
 * their pupils. Where a URL or a permission name is quoted it keeps the word
 * the code uses, because that is what somebody would search for.
 */

export const studentsSection = {
  id: "students",
  title: "Students",
  summary:
    "The people a school hands equipment to. A student record carries who they are, who their guardian is, what they are holding, and what has gone wrong with it — and for a minor, whether the consent to hand them anything is actually on file.",
  articles: [
    {
      id: "students-find",
      title: "Finding a student",
      appRoute: "/members",
      summary:
        "The students list is everybody the school has on record. Opening one goes to their profile, which is where everything about them lives.",
      steps: [
        {
          text: "Search the list by name, email or the guardian's details.",
        },
        {
          text: "Open a student to see what they are holding right now.",
        },
        {
          text: "Import a roster from a spreadsheet rather than adding pupils one at a time.",
          note: "Download the template first — the importer reads the template's columns, and it reports the rows it could not read instead of dropping them.",
        },
      ],
      rules: [
        "The whole students area is behind one permission. A role without it does not see the section at all, rather than seeing an empty one.",
      ],
      related: ["students-profile", "students-consent"],
    },
    {
      id: "students-profile",
      title: "A student's profile",
      appRoute: "/member/main",
      summary:
        "Three tabs, and each one is a place rather than an action: Devices, Details, Reminders. The things you *do* to a student — assign equipment, send a reminder — are actions on the identity card, not tabs.",
      steps: [
        {
          text: "Devices — what this student is holding, and the history of what they held before.",
        },
        {
          text: "Details — who they are, their guardian, their year, their consent status. Editing lives here.",
        },
        {
          text: "Reminders — the messages sent to this student or their guardian, and the place to send another.",
        },
      ],
      rules: [
        "Each tab has its own permission, and a tab a role cannot open is not shown — a visible tab leading to a refused page looks like a broken app rather than a restricted one.",
        "Devices needs the students permission, Details needs permission to update a student, Reminders needs permission to notify one. A role can therefore see a student and not be able to edit them.",
      ],
      related: ["students-assign", "students-overdue", "staff-roles"],
    },
    {
      id: "students-consent",
      title: "Guardian consent for minors",
      appRoute: "/profile/school-compliance",
      summary:
        "For a school, consent is not paperwork that follows the device — it is the gate in front of it. When enforcement is on, a minor cannot be handed equipment until a guardian has answered.",
      elevated: true,
      steps: [
        {
          text: "Turn enforcement on in Profile → School compliance: \"Require guardian consent for minors\".",
        },
        {
          text: "Add the second gate for younger pupils with \"Require COPPA consent for under-13 students\".",
        },
        {
          text: "Choose which of your documents is the consent the guardian is agreeing to.",
        },
        {
          text: "The guardian receives a link and answers it themselves. The answer is recorded against the student.",
          note: "The guardian does not need an account. The link is the whole flow.",
        },
      ],
      rules: [
        "These settings are per company, and changing them changes what device assignment allows from that moment on.",
        "A guardian email is mandatory for a student under 13 — there is no consent route without one.",
        "Consent is recorded as an answer, not as an assumption: an unanswered request is not consent, and assignment stays blocked.",
      ],
      pitfalls: [
        "Turning enforcement on mid-year does not retroactively collect consent for equipment already handed out. It gates the next assignment, not the last one.",
      ],
      related: ["students-assign", "profile-school-compliance"],
    },
    {
      id: "students-assign",
      title: "Handing a device to a student",
      appRoute: "/member/assignment",
      summary:
        "Assignment is by serial number, and for a minor it is the step that consent stands in front of. The student — or their guardian — is emailed what they now hold.",
      steps: [
        {
          text: "Open the student, then the assignment action from their identity card.",
        },
        {
          text: "Scan or type the serial of the device you are handing over.",
        },
        {
          text: "Confirm. The liability terms for the assignment are emailed out with the confirmation.",
        },
      ],
      rules: [
        "Where consent is enforced and missing, the assignment is refused rather than recorded with a warning.",
        "A device already in someone's hands cannot be assigned to a second student until it comes back.",
        "For a minor, the email goes to the guardian's address rather than the student's.",
      ],
      pitfalls: [
        "Serials are text with a counter on the end. Typing \"7\" for \"CHR-0007\" will not find the device.",
      ],
      related: ["students-consent", "students-return", "inventory-browse"],
    },
    {
      id: "students-return",
      title: "Taking a device back, and reporting damage",
      appRoute: "/member/main",
      summary:
        "A return is either clean or it is an incident, and the difference is worth recording: a cracked screen handed back is not the same event as a device that came back fine.",
      steps: [
        {
          text: "Return the device from the student's device list.",
        },
        {
          text: "If it came back damaged, record the incident rather than only the return.",
        },
        {
          text: "The student or guardian is emailed a confirmation of what came back.",
        },
      ],
      rules: [
        "A device reported as an incident stays distinguishable from a clean return in the student's history — the record is what a conversation with a parent rests on.",
        "A damaged device returns to inventory in its condition, not as if it were fine. Condition and status are separate axes.",
      ],
      related: ["students-fees", "inventory-statuses"],
    },
    {
      id: "students-fees",
      title: "Charging for lost or damaged equipment",
      appRoute: "/member/main",
      summary:
        "When a device does not come back, or comes back broken, the fee is charged against the student's record and a receipt is emailed to whoever pays.",
      steps: [
        {
          text: "Mark the device lost, or record the damage, from the student's device list.",
        },
        {
          text: "Charge the fee. The receipt names the device and what it was for.",
        },
      ],
      rules: [
        "Charging needs a permission not every role has. If the charge form never appears, that is the gate — not a payment failure.",
        "A lost device is its own state, neither out nor returned, so losses are never hidden inside \"still out\".",
      ],
      pitfalls: [
        "For a minor the receipt goes to the guardian. Check the guardian's email is right before charging, not after.",
      ],
      related: ["students-return", "students-profile"],
    },
    {
      id: "students-overdue",
      title: "Overdue devices and reminders",
      appRoute: "/members",
      summary:
        "Equipment that should have come back and has not. The overdue list is the working list at the end of a term, and reminders are how you shorten it without walking the corridors.",
      steps: [
        {
          text: "Open the overdue list to see who is holding what past its due date.",
        },
        {
          text: "Send a reminder from there, or from the student's Reminders tab.",
        },
        {
          text: "The Reminders tab keeps what was sent and when, so a second reminder is a decision rather than a guess.",
        },
      ],
      rules: [
        "Reminders need permission to notify a student; a role can be able to see the overdue list and not to send anything.",
        "For a minor, a reminder reaches the guardian.",
      ],
      related: ["students-profile", "students-fees"],
    },
    {
      id: "students-events",
      title: "Registering students to an event",
      appRoute: "/members",
      summary:
        "Students can be attached to an event in bulk — a trip, a lab, an exam hall — so the equipment for it is handed out against the event rather than against nothing.",
      steps: [
        {
          text: "Select the students from the list.",
        },
        {
          text: "Choose the event and write the message they receive.",
        },
        {
          text: "Each one gets a confirmation email; the registration becomes real when the link in it is used.",
        },
      ],
      rules: [
        "A student registered to an event is a consumer at that event for the purposes of assigning and returning equipment. Same equipment rules, same emails.",
        "For minors, the confirmation goes to the guardian.",
      ],
      related: ["events-consumers", "students-assign"],
    },
  ],
};
