/**
 * The ways a transaction can start.
 *
 * There used to be four wrapper components for this — AuthorizedTransaction,
 * CashTransaction, FreeTransaction and ChargedTransaction — each ~130 lines and
 * 95% identical to the others: same modal, same fake tab bar built from a Blue
 * and a LightBlue button, same "Please scan device for a X transaction:" line,
 * same redundant caption underneath repeating the selected tab. The only real
 * differences between them are in this table.
 *
 * ChargedTransaction is absent because it was unreachable: the dropdown that fed
 * it only ever emitted "0" and "2", never the "1" its branch was keyed to.
 */

export const TRANSACTION_MODES = {
  free: {
    key: "free",
    title: "New transaction · no charge",
    intro:
      "Hand devices over without collecting anything. The consumer is emailed what they are holding.",
    requiresAmount: false,
    strategy: "immediate",
    submitLabel: "Create transaction",
  },
  cash: {
    key: "cash",
    title: "New transaction · cash",
    intro:
      "Record money taken at the counter and hand the devices over in one step.",
    requiresAmount: true,
    amountLabel: "Cash collected",
    amountHint: "Recorded against your name in the transaction id.",
    strategy: "immediate",
    submitLabel: "Record cash and create",
  },
  deposit: {
    key: "deposit",
    title: "New transaction · card deposit",
    intro:
      "Authorize a hold on the consumer's card. Nothing is charged until the deposit is captured.",
    requiresAmount: true,
    amountLabel: "Deposit to authorize",
    amountHint: "Held, not charged. Capture or release it when the gear comes back.",
    strategy: "stripe",
    submitLabel: "Continue to card details",
  },
};

export const resolveMode = (key) => TRANSACTION_MODES[key] ?? TRANSACTION_MODES.free;
