/**
 * Events — the manual.
 *
 * Written against the code, not from memory of how the feature was meant to
 * work: the wizard's step titles come from newEventProcess/components/StepsLine,
 * the page's blocks from quickGlance/MainPageQuickGlance, and the closing flow
 * from formatEventDetailInfo/endEvent/EndEventCountModal. When one of those
 * changes, this file is part of the change.
 */

export const eventsSection = {
  id: "events",
  title: "Events",
  summary:
    "An event is the job: a place, a date range, the devices you take there, the staff running it and the consumers who receive equipment. Everything below happens between creating one and closing it.",
  articles: [
    {
      id: "events-create",
      title: "Creating an event",
      appRoute: "/create-event-page/event-detail",
      summary:
        "Five steps, in order. Nothing is created until the last one — you can leave and come back to a step, but the event does not exist for anybody else until you submit the review.",
      steps: [
        {
          text: "Event details — the name, the address and the dates.",
          note: "The name is what consumers see in every email about this event, so write it the way the client would recognise it.",
        },
        {
          text: "Staff details — your representatives at the event.",
          note: "Staff added here can sign in and hand out equipment on site. You can change this later from the event page.",
        },
        {
          text: "Documents — what the event needs signed, such as a privacy policy or terms of use.",
        },
        {
          text: "Devices details — the equipment you are taking, and whether the event charges a deposit.",
        },
        {
          text: "Review — read it back, then create the event.",
        },
      ],
      rules: [
        "A later step stays locked until the earlier ones are filled in. Jumping ahead answers with \"To access to last step, all previous steps must be filled.\"",
        "\"Add new event\" only appears for roles allowed to create one; an assistant will not see it.",
      ],
      pitfalls: [
        "Leaving the wizard before the review step means no event was created. There is no half-created event to come back to — start again from step one.",
      ],
      related: ["events-page", "events-devices"],
    },
    {
      id: "events-page",
      title: "Reading the event page",
      appRoute: "/events/event-quickglance",
      summary:
        "One page per event, top to bottom: who to call and when it runs, how the equipment is doing, what it is costing in losses, then the three lists — inventory, consumers, staff.",
      steps: [
        {
          text: "Event detail — contact, dates, the actions card, and the QR code consumers scan to reach the event in the consumer app.",
        },
        {
          text: "Device health — one bar for the whole event: what is out, what is back, what is lost.",
        },
        {
          text: "Lost fee report — what has been charged for equipment that did not come back.",
        },
        {
          text: "Inventory assigned to the event, then the device-level table underneath it.",
          note: "The first block groups by kind and count; the table below is serial by serial.",
        },
        {
          text: "Consumers at the event, with the total beside the heading.",
        },
        {
          text: "Staff at the event, with \"Update staff\" for roles that may change it.",
        },
      ],
      rules: [
        "The page reflects one selected event. Opening a different event from the events list replaces what every block on this page is showing.",
        "\"Update staff\" is hidden for assistants.",
      ],
      related: ["events-devices", "events-consumers", "events-close"],
    },
    {
      id: "events-devices",
      title: "Putting devices into an event",
      appRoute: "/events/event-quickglance",
      summary:
        "Devices reach an event by serial number. You can read them in one at a time with a scanner, or bring a spreadsheet — either way nothing is allocated until you commit the batch.",
      steps: [
        {
          text: "Open the device setup for the kind of equipment you are allocating.",
        },
        {
          text: "Scan or type each serial. They collect in a list you can see and clear before committing.",
          note: "A scanner that ends its read with Enter works here without any configuration — the field commits each read on Enter.",
        },
        {
          text: "Or import a spreadsheet. \"Download Template\" gives you the exact columns, and \"View Template Guide\" explains them.",
        },
        {
          text: "Commit with \"Allocate Scanned Serial Numbers\".",
        },
      ],
      rules: [
        "A serial can only be at one event at a time. A serial already allocated elsewhere is reported back rather than moved silently.",
        "Serial numbers are text, not numbers. \"SN-0007\" and \"SN-7\" are different devices, and leading zeros matter.",
      ],
      pitfalls: [
        "\"Clear\" empties the list you have scanned but does not undo an allocation you already committed.",
        "Reading the same serial twice is reported as a duplicate rather than counted twice — the count you see is devices, not scans.",
      ],
      related: ["events-page", "events-close", "inventory-locations"],
    },
    {
      id: "events-consumers",
      title: "Finding a consumer at an event",
      appRoute: "/events/event-quickglance",
      summary:
        "The consumers table answers one question quickly: who still has equipment. The four coloured pills above it are both the legend and the filter.",
      steps: [
        {
          text: "Search by anything on the record — name, email, phone, even an id. The search reads the whole record, not just the columns.",
        },
        {
          text: "Click a pill to see only those consumers. The pill says how many there are before you click.",
          note: "Click the same pill again to show everybody. A pill whose count is zero cannot be clicked, because it would only empty the table.",
        },
        {
          text: "Click a row to open that consumer's transactions and assigned devices.",
        },
        {
          text: "\"Refresh table\" re-reads the list from the server, for when somebody else has just handed equipment out.",
        },
      ],
      rules: [
        "No devices — nothing has been assigned to this consumer at this event.",
        "Devices in use — everything they were given is still out.",
        "Devices pending to return — some came back, some did not. This is the group to work through at the end of an event.",
        "Devices returned — everything they were given is back.",
        "The Status column's own dropdown and the pills are the same single filter, so changing one moves the other.",
      ],
      related: ["events-close", "consumers-assign"],
    },
    {
      id: "events-close",
      title: "Closing an event",
      appRoute: "/events/event-quickglance",
      summary:
        "Closing counts the inventory first. What you count comes back to the warehouse; what you do not stays on the record with whoever has it. The count is the point of the step — the number the old confirmation showed was what the database believed, which says nothing about what is on the pallet.",
      elevated: true,
      steps: [
        {
          text: "Press \"End event\". The count opens before any confirmation.",
        },
        {
          text: "Scan every device that came back, or paste your reader's export — one code per line.",
          note: "The four tiles keep score as you go: Expected, Counted, Not counted, and the value still out.",
        },
        {
          text: "Read the reconciliation. Filter to \"Not counted\" to get the list to chase, and the table names who is still holding each device.",
        },
        {
          text: "Then choose. \"Close event\" returns what you counted and closes the event. \"Keep open\" leaves it running so you can go and find the rest.",
        },
      ],
      rules: [
        "Closing needs a count, not a clean count. You can close an event with devices missing — they stay on the record against the consumer holding them.",
        "\"Keep open\" keeps your scans. Coming back to the count does not mean sweeping the room again.",
        "A device counted back that a consumer record still shows as out is flagged rather than quietly reconciled — the two sides disagreeing is worth a person looking.",
        "If the holder list cannot be read, the count still works: the value still out shows \"—\" and \"Holder list unavailable\" instead of a $0 that would read like good news.",
      ],
      pitfalls: [
        "Closing cannot be reversed. It returns inventory, closes transactions and removes staff access to the event.",
        "Test this on a practice event before doing it on a real one.",
      ],
      related: ["events-consumers", "events-devices"],
    },
    {
      id: "events-staff",
      title: "Staff at an event",
      appRoute: "/events/event-quickglance",
      summary:
        "Who can work this event, and what they can do while it runs. Staff access is per event, and closing the event takes it away.",
      steps: [
        {
          text: "Open \"Update staff\" from the staff block on the event page.",
        },
        {
          text: "Add the people working the event, and give each the role they need on site.",
        },
        {
          text: "Removing somebody takes their access to this event away without touching their account.",
        },
      ],
      rules: [
        "\"Update staff\" is only offered to roles allowed to change it — an assistant does not see it.",
        "Closing an event removes staff access to it. That is part of what closing does, not a side effect.",
      ],
      related: ["events-close", "staff-roles"],
    },
  ],
};
