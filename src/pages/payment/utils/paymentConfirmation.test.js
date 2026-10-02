import { describe, expect, it } from "vitest";
import {
  confirmationStep,
  isDeclinedIntent,
  isDeclinedRedirect,
  markProcessed,
} from "./paymentConfirmation";

/**
 * The two pages Stripe redirects back to from an event's consumer page
 * (`payment-confirmed`, `payment-service-confirmation`) finish the transaction
 * in the browser. The draft they finish lives in redux-persist, which survives
 * a reload, and nothing cleared it: reloading the page — whose URL still
 * carries `payment_intent` — wrote the Stripe record, the transaction and the
 * assignments a second time.
 *
 * The fix is to refuse the second run rather than delete its copies later: the
 * draft is stamped with the intent before the first write, and a page that
 * mounts with a draft already stamped for that intent does nothing.
 */
const draft = { serialNumbers: ["A1", "A2"], deviceType: { group: "Tablet", value: 50 } };

describe("confirmationStep", () => {
  it("runs a fresh draft for the intent in the URL", () => {
    expect(confirmationStep({ paymentIntent: "pi_1", draft })).toBe("run");
  });

  it("does not run again for an intent this draft already processed", () => {
    expect(
      confirmationStep({ paymentIntent: "pi_1", draft: markProcessed(draft, "pi_1") })
    ).toBe("already-processed");
  });

  it("runs a draft stamped for a different, earlier intent", () => {
    expect(
      confirmationStep({ paymentIntent: "pi_2", draft: markProcessed(draft, "pi_1") })
    ).toBe("run");
  });

  it("has nothing to confirm without an intent or a draft", () => {
    expect(confirmationStep({ paymentIntent: null, draft })).toBe("missing");
    expect(confirmationStep({ paymentIntent: "pi_1", draft: undefined })).toBe("missing");
    expect(confirmationStep({ paymentIntent: "pi_1", draft: { serialNumbers: [] } })).toBe(
      "missing"
    );
  });

  it("only needs a device type when the page does not assign serials", () => {
    const service = { deviceType: { group: "Parking", value: 20 } };
    expect(
      confirmationStep({ paymentIntent: "pi_1", draft: service, requireSerials: false })
    ).toBe("run");
    expect(confirmationStep({ paymentIntent: "pi_1", draft: service })).toBe("missing");
  });

  /* Stripe redirects back after a failed authentication too. */
  it("stops on a declined redirect before checking anything else", () => {
    expect(
      confirmationStep({ paymentIntent: "pi_1", redirectStatus: "failed", draft })
    ).toBe("declined");
  });
});

describe("isDeclinedRedirect", () => {
  it("is true only for the statuses Stripe uses for a failed redirect", () => {
    expect(isDeclinedRedirect("failed")).toBe(true);
    expect(isDeclinedRedirect("requires_payment_method")).toBe(true);
    expect(isDeclinedRedirect("canceled")).toBe(true);
  });

  /* A deposit is a manual-capture hold. Only an explicit failure stops the
     page, so an authorized hold is never refused for its wording. */
  it("lets through success, processing, and no status at all", () => {
    expect(isDeclinedRedirect("succeeded")).toBe(false);
    expect(isDeclinedRedirect("processing")).toBe(false);
    expect(isDeclinedRedirect(null)).toBe(false);
    expect(isDeclinedRedirect(undefined)).toBe(false);
  });
});

describe("isDeclinedIntent", () => {
  it("is true for an intent left without a payment, or cancelled", () => {
    expect(isDeclinedIntent({ status: "requires_payment_method" })).toBe(true);
    expect(isDeclinedIntent({ status: "canceled" })).toBe(true);
  });

  it("accepts a held deposit, a captured payment, and an unknown shape", () => {
    expect(isDeclinedIntent({ status: "requires_capture" })).toBe(false);
    expect(isDeclinedIntent({ status: "succeeded" })).toBe(false);
    expect(isDeclinedIntent(undefined)).toBe(false);
  });
});

describe("markProcessed", () => {
  it("stamps the draft without dropping what it carried", () => {
    expect(markProcessed(draft, "pi_9")).toEqual({ ...draft, processedPaymentIntent: "pi_9" });
  });
});
