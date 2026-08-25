import { describe, expect, it } from "vitest";
import {
  addServiceLine,
  cartTotal,
  removeServiceLine,
  serviceLineTotal,
  validateServiceLine,
} from "./servicesCart";

describe("serviceLineTotal", () => {
  it("multiplies price by quantity", () => {
    expect(serviceLineTotal({ price: 50, quantity: 3 })).toBe(150);
  });

  it("accepts the strings a form actually produces", () => {
    expect(serviceLineTotal({ price: "50", quantity: "3" })).toBe(150);
  });

  it("returns zero rather than NaN for a non-numeric price", () => {
    // The old total was `data.price * data.quantity` on raw form strings, so a
    // typo rendered the charge button as "Total to be charged: $NaN".
    expect(serviceLineTotal({ price: "abc", quantity: 2 })).toBe(0);
    expect(serviceLineTotal({ price: 50, quantity: "two" })).toBe(0);
  });

  it("returns zero for a missing line", () => {
    expect(serviceLineTotal(undefined)).toBe(0);
    expect(serviceLineTotal({})).toBe(0);
  });

  it("rounds to cents so a total never carries float noise", () => {
    expect(serviceLineTotal({ price: 0.1, quantity: 3 })).toBe(0.3);
  });
});

describe("cartTotal", () => {
  it("sums every line", () => {
    expect(
      cartTotal([
        { price: 50, quantity: 2 },
        { price: 25, quantity: 1 },
      ])
    ).toBe(125);
  });

  it("is zero for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
    expect(cartTotal(undefined)).toBe(0);
  });

  it("never returns NaN because one line is malformed", () => {
    const total = cartTotal([
      { price: 50, quantity: 2 },
      { price: "oops", quantity: 1 },
    ]);
    expect(total).toBe(100);
    expect(Number.isNaN(total)).toBe(false);
  });
});

describe("validateServiceLine", () => {
  const base = { service: "Rigging", price: "50", quantity: "2" };

  it("passes a complete line", () => {
    expect(validateServiceLine(base)).toEqual({ ok: true, problems: [] });
  });

  it("requires a service", () => {
    const result = validateServiceLine({ ...base, service: "" });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/service/i);
  });

  it("requires a positive price", () => {
    expect(validateServiceLine({ ...base, price: "0" }).ok).toBe(false);
    expect(validateServiceLine({ ...base, price: "-10" }).ok).toBe(false);
    expect(validateServiceLine({ ...base, price: "abc" }).ok).toBe(false);
  });

  it("requires a whole positive quantity", () => {
    expect(validateServiceLine({ ...base, quantity: "0" }).ok).toBe(false);
    expect(validateServiceLine({ ...base, quantity: "1.5" }).ok).toBe(false);
    expect(validateServiceLine({ ...base, quantity: "many" }).ok).toBe(false);
  });

  it("reports every problem at once", () => {
    const result = validateServiceLine({ service: "", price: "", quantity: "" });
    expect(result.problems.length).toBeGreaterThan(1);
  });
});

describe("addServiceLine", () => {
  it("appends a normalized line", () => {
    const cart = addServiceLine([], {
      service: "Rigging",
      price: "50",
      quantity: "2",
    });
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ service: "Rigging", price: 50, quantity: 2 });
  });

  it("gives every line a stable unique key", () => {
    // The old list keyed chips on `service-price-quantity`, so adding the same
    // service twice at the same price produced two chips with one key — and
    // deleting one removed the wrong row.
    const cart = addServiceLine(
      addServiceLine([], { service: "Rigging", price: "50", quantity: "2" }),
      { service: "Rigging", price: "50", quantity: "2" }
    );
    expect(cart).toHaveLength(2);
    expect(cart[0].key).not.toBe(cart[1].key);
  });

  it("carries the line total", () => {
    const cart = addServiceLine([], { service: "A", price: "10", quantity: "3" });
    expect(cart[0].total).toBe(30);
  });
});

describe("removeServiceLine", () => {
  it("removes the line with that key and no other", () => {
    let cart = addServiceLine([], { service: "A", price: "10", quantity: "1" });
    cart = addServiceLine(cart, { service: "A", price: "10", quantity: "1" });
    const survivor = cart[1].key;
    const next = removeServiceLine(cart, cart[0].key);
    expect(next).toHaveLength(1);
    expect(next[0].key).toBe(survivor);
  });

  it("is a no-op for an unknown key", () => {
    const cart = addServiceLine([], { service: "A", price: "10", quantity: "1" });
    expect(removeServiceLine(cart, "nope")).toHaveLength(1);
  });

  it("survives a missing cart", () => {
    expect(removeServiceLine(undefined, "k")).toEqual([]);
  });
});
