import { describe, expect, it } from "vitest";
import {
  depositStatusNotice,
  releaseDepositQueryKeys,
  transactionSearchQueryKey,
} from "./searchQueries";

describe("transactionSearchQueryKey", () => {
  it("changes with the search text, so a new search is a new fetch", () => {
    expect(transactionSearchQueryKey(7, "pi_123")).not.toEqual(
      transactionSearchQueryKey(7, "pi_456"),
    );
  });

  it("changes with the company", () => {
    expect(transactionSearchQueryKey(7, "pi_123")).not.toEqual(
      transactionSearchQueryKey(8, "pi_123"),
    );
  });
});

describe("releaseDepositQueryKeys", () => {
  it("keys both queries on the payment intent", () => {
    const a = releaseDepositQueryKeys("pi_a");
    const b = releaseDepositQueryKeys("pi_b");
    expect(a.intent).not.toEqual(b.intent);
    expect(a.transaction).not.toEqual(b.transaction);
  });

  // Same requests as DepositActionModal, so the two screens share one cache entry.
  it("matches the keys DepositActionModal uses", () => {
    expect(releaseDepositQueryKeys("pi_a")).toEqual({
      intent: ["stripePaymentIntent", "pi_a"],
      transaction: ["transactionByIntent", "pi_a"],
    });
  });
});

describe("depositStatusNotice", () => {
  it("closes the modal for a hold already released", () => {
    expect(depositStatusNotice("canceled")).toEqual({
      text: "This transaction has been released or canceled already.",
      closeModal: true,
    });
  });

  it("warns, but keeps the modal open, for a hold already captured", () => {
    expect(depositStatusNotice("succeeded")).toEqual({
      text: "This transaction has been captured already.",
      closeModal: false,
    });
  });

  it("says nothing for a hold that can still be released, or before the status loads", () => {
    expect(depositStatusNotice("requires_capture")).toBeNull();
    expect(depositStatusNotice(undefined)).toBeNull();
  });
});
