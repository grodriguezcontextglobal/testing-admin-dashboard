/**
 * Consumers — the manual.
 *
 * Written against the code: the action names come from
 * quickGlance/consumer/ConsumerDetail/ConsumerActionRail, the device actions
 * from transaction/useTransactionDeviceActions, the deposit wording from
 * actions/deposit/DepositActionModal, and the fee routes from AuthRoutes.
 */

export const consumersSection = {
  id: "consumers",
  title: "Consumers",
  summary:
    "The people who receive equipment. A consumer belongs to the company, not to one event — the same person can attend several. What ties them to equipment is a transaction, and what ties a transaction to a device is a serial number.",
  articles: [
    {
      id: "consumers-find",
      title: "Finding a consumer",
      appRoute: "/consumers",
      summary:
        "Two ways in, and they answer different questions. The Consumers page is everybody the company has ever served. The consumers table on an event page is only the people at that event.",
      steps: [
        {
          text: "For history across events, start from the Consumers page and open the person.",
        },
        {
          text: "For what is happening right now at a job, start from the event page's consumers table.",
        },
        {
          text: "Either way, opening a consumer shows their transactions and the devices on each one.",
        },
      ],
      related: ["events-consumers", "consumers-transaction"],
    },
    {
      id: "consumers-transaction",
      title: "Starting a transaction",
      appRoute: "/events/event-quickglance",
      summary:
        "A transaction is the container equipment hangs from. Nothing can be handed to a consumer without one, and the choice you make here decides whether money is involved.",
      steps: [
        {
          text: "\"New transaction · no charge\" — equipment goes out, nothing is taken. This is the common case for events where the client covers the kit.",
        },
        {
          text: "\"New transaction · take payment\" — choose Card deposit or Cash.",
          note: "A card deposit is an authorisation, not a charge: the money is held and released when the equipment comes back. Cash is recorded as taken.",
        },
        {
          text: "\"Add a service\" puts a chargeable extra on the transaction rather than a device.",
        },
      ],
      rules: [
        "One consumer can hold several transactions at the same event — a second transaction does not close the first.",
        "A transaction with no devices left on it settles itself once the last one is returned.",
      ],
      related: ["consumers-assign", "consumers-deposit"],
    },
    {
      id: "consumers-assign",
      title: "Handing a device to a consumer",
      appRoute: "/events/event-quickglance",
      summary:
        "Assigning moves a device from the event's pool into a person's hands, and the consumer is emailed what they now hold.",
      steps: [
        {
          text: "Open the consumer, then the transaction the device belongs on.",
        },
        {
          text: "Assign by serial — scan it or type it.",
        },
        {
          text: "The consumer receives an email listing what was assigned.",
        },
      ],
      rules: [
        "Only a device allocated to this event can be assigned at it. A serial that is not in the event's pool is refused rather than pulled in from the warehouse.",
        "A device already in someone's hands cannot be assigned to a second person until it is returned.",
      ],
      pitfalls: [
        "Serials are text with a counter on the end. Typing \"7\" for \"CAM-0007\" will not find the device.",
      ],
      related: ["consumers-return", "events-devices"],
    },
    {
      id: "consumers-return",
      title: "Taking devices back",
      appRoute: "/events/event-quickglance",
      summary:
        "Returning is per device or all at once, and either way the consumer gets a receipt of what came back.",
      steps: [
        {
          text: "Return one device from its row, or use return-all when a consumer is handing back everything.",
        },
        {
          text: "The consumer is emailed a confirmation of what was returned.",
        },
        {
          text: "\"Send device report\" emails the consumer the full picture of the transaction rather than a single return.",
        },
      ],
      rules: [
        "Returning the last device on a transaction settles the transaction.",
        "A held card deposit is released as part of finishing up — see the deposits article, because release is a separate action and it is the one people forget.",
      ],
      related: ["consumers-deposit", "events-close"],
    },
    {
      id: "consumers-deposit",
      title: "Deposits — holding and releasing",
      appRoute: "/events/event-quickglance",
      summary:
        "A card deposit is money held against equipment, not money taken. It has to be released, and until it is, the consumer's card still has a hold on it.",
      steps: [
        {
          text: "The deposit is authorised when the transaction is created with Card deposit.",
        },
        {
          text: "Open the deposit action on the transaction to see what is actually held, read live from the payment provider.",
        },
        {
          text: "\"Release deposit\" returns the hold. The consumer is emailed that it was released.",
        },
      ],
      rules: [
        "The amount shown is read from the payment provider, not from our own record, so it is what the consumer's bank is actually holding.",
        "Capturing a deposit turns a hold into a real charge. That is the action to use when equipment is not coming back — not release.",
      ],
      pitfalls: [
        "Closing an event does not release deposits. A held deposit outlives the event, and a consumer chasing their money is how you find out it was missed — release before closing, or work the list afterwards.",
      ],
      related: ["consumers-lostfee", "consumers-return"],
    },
    {
      id: "consumers-lostfee",
      title: "Charging for equipment that did not come back",
      appRoute: "/events/event-quickglance",
      summary:
        "When a device is lost, the fee can be taken by card or recorded as cash, for one device or for everything a consumer is holding.",
      steps: [
        {
          text: "Mark the device lost from the consumer's device list.",
        },
        {
          text: "Choose how the fee is settled — credit card, or cash recorded as received.",
        },
        {
          text: "For a consumer who has lost several, charge them all in one pass rather than device by device.",
        },
        {
          text: "The consumer is emailed a receipt for the fee.",
        },
      ],
      rules: [
        "A lost device is its own state. It is neither out nor returned, and it is counted separately in the event's device health so losses are not hidden inside \"still out\".",
        "Charging a fee needs a permission not every role has; if the card form never appears, that is the gate, not a payment failure.",
      ],
      pitfalls: [
        "A refund of a fee is a separate action from releasing a deposit. Refunding does not release a hold, and releasing does not refund a charge.",
      ],
      related: ["consumers-deposit", "events-close"],
    },
  ],
};
