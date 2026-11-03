// Query keys and status rules for the search page's transaction screens.
// Each key carries what the request depends on, so react-query fetches again
// when it changes. Before, the keys were bare strings and an effect called
// refetch() by hand, which served the previous search's or deposit's data
// until the refetch landed.

export const transactionSearchQueryKey = (company, searchParams) => [
  "listOfPaymentIntent",
  company,
  searchParams,
];

// Same keys and requests as DepositActionModal, so both share a cache entry.
export const releaseDepositQueryKeys = (paymentIntent) => ({
  intent: ["stripePaymentIntent", paymentIntent],
  transaction: ["transactionByIntent", paymentIntent],
});

// What to tell the operator when the hold cannot be released any more.
export const depositStatusNotice = (status) => {
  if (status === "canceled")
    return {
      text: "This transaction has been released or canceled already.",
      closeModal: true,
    };
  if (status === "succeeded")
    return {
      text: "This transaction has been captured already.",
      closeModal: false,
    };
  return null;
};
