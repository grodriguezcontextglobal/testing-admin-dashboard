import { describe, expect, it } from "vitest";
import {
  SERVER_REQUIRED_PLACEHOLDER,
  buildNewProviderPayload,
  emptyProviderForm,
  findProviderByName,
  providerFieldErrors,
  resolveCreatedProviderId,
  setProviderField,
} from "./providerForm";

const user = { companyData: { id: "co-1" } };

const filled = {
  companyName: "Acme Supplies",
  industry: SERVER_REQUIRED_PLACEHOLDER,
  services: [SERVER_REQUIRED_PLACEHOLDER],
  address: {
    street: "1 Main St",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    country: "USA",
  },
  contactInfo: {
    name: "Ada Lovelace",
    email: "ada@acme.com",
    phone: "+15550000000",
    website: "",
  },
  status: "active",
  documents: [],
};

describe("emptyProviderForm", () => {
  it("keeps the two fields the server requires but the form never asks about", () => {
    // POST /api/company/new_provider answers 400 without `industry` and
    // `services`, and nothing in the app ever displays either one. The
    // placeholder is what satisfies the contract without inventing a question.
    const form = emptyProviderForm();
    expect(form.industry).toBe(SERVER_REQUIRED_PLACEHOLDER);
    expect(form.services).toEqual([SERVER_REQUIRED_PLACEHOLDER]);
  });

  it("keeps the contact name, which the old reset silently dropped", () => {
    expect(emptyProviderForm().contactInfo).toHaveProperty("name", "");
  });

  it("defaults the country rather than leaving it blank", () => {
    expect(emptyProviderForm().address.country).toBe("USA");
  });

  it("is a new object each call, so one form cannot mutate the next", () => {
    const first = emptyProviderForm();
    first.address.city = "typed";
    expect(emptyProviderForm().address.city).toBe("");
  });

  it("produces a form the payload builder accepts once the visible fields are filled", () => {
    // The old reset blanked industry and services, so the *second* provider
    // added without closing the modal was submitted with `industry: ""` and
    // `services: []` — a 400, or a permanently dead Save button.
    const form = {
      ...emptyProviderForm(),
      companyName: "Acme",
      address: { ...emptyProviderForm().address, street: "1", city: "A", state: "TX", postalCode: "1" },
      contactInfo: { name: "A", email: "a@b.com", phone: "1", website: "" },
    };
    expect(providerFieldErrors(form)).toEqual({});
    expect(buildNewProviderPayload({ provider: form, user, timestamp: "t" }).services)
      .toEqual([SERVER_REQUIRED_PLACEHOLDER]);
  });
});

describe("providerFieldErrors", () => {
  it("keys a message per field, by the same dotted name the input uses", () => {
    expect(providerFieldErrors(emptyProviderForm())).toEqual({
      companyName: "Enter the supplier's company name.",
      "address.street": "Enter a street address.",
      "address.city": "Enter a city.",
      "address.state": "Enter a state.",
      "address.postalCode": "Enter a ZIP or postal code.",
      "contactInfo.name": "Enter the name of your contact there.",
      "contactInfo.email": "Enter a contact email address.",
      "contactInfo.phone": "Enter a contact phone number.",
    });
  });

  it("says nothing about industry or services, which nobody can fill in", () => {
    // The Save button was disabled on `!industry` and `services.length === 0`
    // — two values with no field on the form — so it could sit greyed out with
    // every visible field complete and nothing explaining why.
    const errors = providerFieldErrors({ ...filled, industry: "", services: [] });
    expect(errors).toEqual({});
  });

  it("returns nothing for a complete form", () => {
    expect(providerFieldErrors(filled)).toEqual({});
  });

  it("treats whitespace as empty", () => {
    const errors = providerFieldErrors({ ...filled, companyName: "   " });
    expect(errors.companyName).toBe("Enter the supplier's company name.");
  });

  it("rejects a malformed contact email, which used to save as typed", () => {
    // type="email" on an OutlinedInput outside a <form>, with a button that is
    // not a submit, means native validation never ran.
    const badEmail = (email) =>
      providerFieldErrors({ ...filled, contactInfo: { ...filled.contactInfo, email } });
    expect(badEmail("ada@").email).toBeUndefined();
    expect(badEmail("ada@")["contactInfo.email"]).toBe("That email address is not valid.");
    expect(badEmail("ada")["contactInfo.email"]).toBe("That email address is not valid.");
    expect(badEmail("a b@c.com")["contactInfo.email"]).toBe("That email address is not valid.");
  });

  it("leaves the website and the country alone — neither was ever required", () => {
    const errors = providerFieldErrors({
      ...filled,
      contactInfo: { ...filled.contactInfo, website: "" },
      address: { ...filled.address, country: "" },
    });
    expect(errors).toEqual({});
  });

  it("does not throw on a provider missing whole sections", () => {
    expect(Object.keys(providerFieldErrors({}))).toHaveLength(8);
    expect(Object.keys(providerFieldErrors(undefined))).toHaveLength(8);
  });
});

describe("setProviderField", () => {
  it("writes a nested field by its dotted name without losing its siblings", () => {
    const next = setProviderField(filled, "address.city", "Dallas");
    expect(next.address).toEqual({ ...filled.address, city: "Dallas" });
    expect(next.contactInfo).toEqual(filled.contactInfo);
  });

  it("writes a top-level field", () => {
    expect(setProviderField(filled, "status", "inactive").status).toBe("inactive");
  });

  it("splits services on commas, as the form has always done", () => {
    expect(setProviderField(filled, "services", "wiring, cases , ").services).toEqual([
      "wiring",
      "cases",
      "",
    ]);
  });

  it("never mutates the form it was given", () => {
    setProviderField(filled, "address.city", "Dallas");
    expect(filled.address.city).toBe("Austin");
  });
});

describe("buildNewProviderPayload", () => {
  it("pins the body POST /company/new_provider already accepts", () => {
    expect(
      buildNewProviderPayload({ provider: filled, user, timestamp: "2026-08-26T00:00:00.000Z" })
    ).toEqual({
      companyName: "Acme Supplies",
      industry: SERVER_REQUIRED_PLACEHOLDER,
      services: [SERVER_REQUIRED_PLACEHOLDER],
      address: {
        street: "1 Main St",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "USA",
      },
      contactInfo: {
        name: "Ada Lovelace",
        email: "ada@acme.com",
        phone: "+15550000000",
        website: "",
      },
      status: "active",
      documents: [],
      creator: "co-1",
      createdAt: "2026-08-26T00:00:00.000Z",
      updatedAt: "2026-08-26T00:00:00.000Z",
    });
  });

  it("adds no field outside the contract", () => {
    const payload = buildNewProviderPayload({ provider: filled, user, timestamp: "t" });
    expect(Object.keys(payload).sort()).toEqual(
      [
        "address",
        "companyName",
        "contactInfo",
        "createdAt",
        "creator",
        "documents",
        "industry",
        "services",
        "status",
        "updatedAt",
      ].sort()
    );
  });

  it("stamps createdAt and updatedAt from one clock reading", () => {
    // Two separate `new Date().toISOString()` calls could disagree by a
    // millisecond on the very record that is being created.
    const payload = buildNewProviderPayload({ provider: filled, user, timestamp: "t" });
    expect(payload.createdAt).toBe(payload.updatedAt);
  });

  it("drops the empty entries a trailing comma leaves in services", () => {
    const payload = buildNewProviderPayload({
      provider: { ...filled, services: [" wiring ", "", "  "] },
      user,
      timestamp: "t",
    });
    expect(payload.services).toEqual(["wiring"]);
  });

  it("trims what was typed, so 'Acme ' and 'Acme' are not two suppliers", () => {
    const payload = buildNewProviderPayload({
      provider: {
        ...filled,
        companyName: "  Acme Supplies  ",
        contactInfo: { ...filled.contactInfo, email: " ada@acme.com " },
        address: { ...filled.address, city: " Austin " },
      },
      user,
      timestamp: "t",
    });
    expect(payload.companyName).toBe("Acme Supplies");
    expect(payload.contactInfo.email).toBe("ada@acme.com");
    expect(payload.address.city).toBe("Austin");
  });

  it("carries the creator the endpoint requires", () => {
    expect(buildNewProviderPayload({ provider: filled, user: {}, timestamp: "t" }).creator)
      .toBeUndefined();
    expect(buildNewProviderPayload({ provider: filled, user, timestamp: "t" }).creator)
      .toBe("co-1");
  });
});

describe("resolveCreatedProviderId", () => {
  it("finds the id under any of the spellings the response might use", () => {
    expect(resolveCreatedProviderId({ ok: true, provider: { id: "p1" } })).toBe("p1");
    expect(resolveCreatedProviderId({ ok: true, providerCompany: { _id: "p2" } })).toBe("p2");
    expect(resolveCreatedProviderId({ ok: true, newProvider: { id: "p3" } })).toBe("p3");
    expect(resolveCreatedProviderId({ ok: true, id: "p4" })).toBe("p4");
    expect(resolveCreatedProviderId({ ok: true, _id: "p5" })).toBe("p5");
  });

  it("coerces an id the server sent as a number", () => {
    expect(resolveCreatedProviderId({ provider: { id: 77 } })).toBe("77");
  });

  it("is null rather than a guess when the response carries no id", () => {
    // The endpoint is documented by its request only, so the caller has to be
    // able to fall back to matching the refetched list.
    expect(resolveCreatedProviderId({ ok: true })).toBeNull();
    expect(resolveCreatedProviderId(undefined)).toBeNull();
  });
});

describe("findProviderByName", () => {
  const providers = [
    { id: "p1", companyName: "Acme Supplies" },
    { id: "p2", companyName: "Beta Rentals" },
  ];

  it("matches the supplier just submitted, ignoring case and padding", () => {
    expect(findProviderByName(providers, "  acme supplies ")?.id).toBe("p1");
  });

  it("is null when nothing matches", () => {
    expect(findProviderByName(providers, "Gamma")).toBeNull();
    expect(findProviderByName(providers, "")).toBeNull();
    expect(findProviderByName(undefined, "Acme Supplies")).toBeNull();
  });
});
