/**
 * Transactions and deposits — the manual.
 *
 * Written against the code: the action names come from
 * quickGlance/consumer/ConsumerDetail/ConsumerActionRail, the device actions
 * from transaction/useTransactionDeviceActions, and the deposit wording from
 * actions/deposit/DepositActionModal — which reads the held amount from the
 * payment provider rather than from our own record.
 *
 * This is the money side of an event. The people are documented under Events
 * (the consumers table) and Students; what happens once you open one of them
 * is here.
 */

export const transactionsSection = {
  id: "transactions",
  title: "Transactions and deposits",
  summary:
    "A transaction is the container equipment hangs from at an event. Nothing goes out without one, and the choice you make when you open it decides whether money is involved — and whether somebody has to be given money back later.",
  articles: [
    {
      id: "transactions-start",
      title: "Opening a transaction",
      appRoute: "/events/event-quickglance",
      summary:
        "Three ways to start, and the difference is money. Pick deliberately: turning a no-charge transaction into a paid one afterwards is not a thing you can do.",
      steps: [
        {
          text: "\"New transaction · no charge\" — equipment goes out, nothing is taken. The common case when the client is covering the kit.",
        },
        {
          text: "\"New transaction · take payment\" → Card deposit — an amount is authorised on the card and held. It is not a charge yet.",
        },
        {
          text: "\"New transaction · take payment\" → Cash — recorded as money received, with no card involved.",
        },
        {
          text: "\"Add a service\" puts a chargeable extra on the transaction rather than a device.",
        },
      ],
      rules: [
        "One consumer can hold several transactions at the same event. A second one does not close the first.",
        "A transaction settles itself once its last device is returned — you do not close it by hand.",
      ],
      related: ["transactions-assign", "transactions-deposit"],
    },
    {
      id: "transactions-assign",
      title: "Putting devices on a transaction",
      appRoute: "/events/event-quickglance",
      summary:
        "Assigning by serial moves a device from the event's pool into a person's hands, and emails them what they now hold.",
      steps: [
        { text: "Open the consumer, then the transaction the device belongs on." },
        { text: "Scan or type the serial." },
        { text: "The consumer is emailed the list of what was assigned." },
      ],
      rules: [
        "Only a device allocated to this event can be assigned at it. A serial that is not in the pool is refused rather than pulled in from the warehouse.",
        "A device already out cannot be assigned to a second person until it is returned.",
      ],
      pitfalls: [
        "Serials are text with a counter on the end — typing \"7\" for \"CAM-0007\" finds nothing.",
      ],
      related: ["events-devices", "transactions-return"],
    },
    {
      id: "transactions-return",
      title: "Taking devices back",
      appRoute: "/events/event-quickglance",
      summary:
        "One device or all of them, and either way the consumer gets a record of what came back.",
      steps: [
        { text: "Return a single device from its row." },
        {
          text: "Or return everything at once when somebody is handing back their whole set.",
        },
        {
          text: "\"Send device report\" emails the full picture of the transaction rather than one return.",
        },
      ],
      rules: [
        "Returning the last device settles the transaction.",
        "Returning equipment does not release a card deposit. That is a separate action, and it is the one people forget.",
      ],
      related: ["transactions-deposit", "events-close"],
    },
    {
      id: "transactions-deposit",
      title: "Deposits — held, released, or captured",
      appRoute: "/events/event-quickglance",
      summary:
        "A card deposit is money held against equipment, not money taken. Three things can happen to it, and only one of them is automatic: none of them.",
      steps: [
        {
          text: "Open the deposit action on the transaction. The amount shown is read live from the payment provider, so it is what the consumer's bank is actually holding — not what our record thinks.",
        },
        {
          text: "\"Release deposit\" returns the hold. The consumer is emailed that it was released.",
        },
        {
          text: "Capture instead when the equipment is not coming back: capturing turns the hold into a real charge.",
        },
      ],
      rules: [
        "Release and capture are opposite outcomes, not a confirm and a cancel. Releasing gives it back; capturing keeps it.",
        "A deposit that is neither released nor captured stays on the consumer's card until it expires with their bank.",
      ],
      pitfalls: [
        "Closing an event does not release deposits. A held deposit outlives the event, and a consumer chasing their money is how you find out one was missed — work the list before closing.",
      ],
      related: ["transactions-lostfee", "events-close", "profile-billing"],
    },
    {
      id: "transactions-lostfee",
      title: "Charging for equipment that did not come back",
      appRoute: "/events/event-quickglance",
      summary:
        "When a device is lost, the fee can be taken by card or recorded as cash — for one device, or for everything a consumer is holding at once.",
      steps: [
        { text: "Mark the device lost from the consumer's device list." },
        { text: "Settle the fee by credit card, or record it as cash received." },
        {
          text: "For somebody who has lost several, charge them all in one pass rather than device by device.",
        },
        { text: "The consumer is emailed a receipt for the fee." },
      ],
      rules: [
        "A lost device is its own state — neither out nor returned — and it is counted separately in the event's device health so losses are never hidden inside \"still out\".",
        "Charging needs a permission not every role has. If the card form never appears, that is the gate, not a payment failure.",
      ],
      related: ["transactions-refund", "events-close"],
    },
    {
      id: "transactions-refund",
      title: "Refunds, and what they are not",
      appRoute: "/events/event-quickglance",
      summary:
        "A refund returns money that was actually charged. It is a different act from releasing a deposit, and mixing the two is the most expensive mistake available on this screen.",
      steps: [
        { text: "Open the transaction's payment history and refund the charge." },
        { text: "The consumer is emailed a refund receipt." },
      ],
      rules: [
        "Refunding does not release a hold, and releasing does not refund a charge. If a consumer says they were charged, check which of the two actually happened before doing either.",
        "A captured deposit is a charge, so undoing that is a refund — not a release.",
      ],
      related: ["transactions-deposit", "transactions-lostfee"],
    },
  ],
};
