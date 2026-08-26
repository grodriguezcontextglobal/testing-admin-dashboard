/**
 * The supplier form: its empty shape, its rules, and the body it posts.
 *
 * All of this existed twice, byte for byte — once in
 * inventory/actions/utils/suppliers/NewSupplier.jsx and once in
 * Profile/providers/Main.jsx — and the two copies had already drifted: both
 * seeded `industry`/`services` with a placeholder, and both reset them to
 * `""`/`[]` afterwards, which is the state the endpoint rejects.
 */

/**
 * `POST /api/company/new_provider` answers 400 without `industry` and
 * `services`, and nothing in the app displays either one — not the provider
 * card, not the list, not the edit form. So they are sent filled with this and
 * are not asked about: inventing a question for a field nobody reads would be
 * worse than a placeholder that is honest about being one.
 */
export const SERVER_REQUIRED_PLACEHOLDER = "not needed";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value) => String(value ?? "").trim();

/** A fresh, complete form. Every reset must go through this. */
export const emptyProviderForm = () => ({
  companyName: "",
  industry: SERVER_REQUIRED_PLACEHOLDER,
  services: [SERVER_REQUIRED_PLACEHOLDER],
  address: {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
  },
  contactInfo: {
    name: "",
    email: "",
    phone: "",
    website: "",
  },
  status: "active",
  documents: [],
});

/**
 * One message per field, keyed by the dotted name its input carries, so the
 * form can look each one up where it renders the field.
 *
 * Deliberately says nothing about `industry` or `services`: the Save button used
 * to be disabled on `!industry` and `services.length === 0`, two values with no
 * control on the form, so it could sit greyed out with every visible field
 * complete and nothing on screen explaining what was missing.
 */
export const providerFieldErrors = (provider) => {
  const errors = {};
  const address = provider?.address ?? {};
  const contact = provider?.contactInfo ?? {};

  if (!text(provider?.companyName)) {
    errors.companyName = "Enter the supplier's company name.";
  }
  if (!text(address.street)) errors["address.street"] = "Enter a street address.";
  if (!text(address.city)) errors["address.city"] = "Enter a city.";
  if (!text(address.state)) errors["address.state"] = "Enter a state.";
  if (!text(address.postalCode)) {
    errors["address.postalCode"] = "Enter a ZIP or postal code.";
  }

  if (!text(contact.name)) {
    // The button required this and the submit handler did not — the two gates
    // had drifted apart.
    errors["contactInfo.name"] = "Enter the name of your contact there.";
  }
  if (!text(contact.email)) {
    errors["contactInfo.email"] = "Enter a contact email address.";
  } else if (!EMAIL_PATTERN.test(text(contact.email))) {
    errors["contactInfo.email"] = "That email address is not valid.";
  }
  if (!text(contact.phone)) {
    errors["contactInfo.phone"] = "Enter a contact phone number.";
  }

  return errors;
};

/** The dotted-name setter both screens had written out inline. */
export const setProviderField = (provider, name, value) => {
  if (name === "services") {
    return {
      ...provider,
      services: String(value ?? "")
        .split(",")
        .map((service) => service.trim()),
    };
  }
  if (String(name).includes(".")) {
    const [parent, child] = String(name).split(".");
    return {
      ...provider,
      [parent]: { ...provider?.[parent], [child]: value },
    };
  }
  return { ...provider, [name]: value };
};

/**
 * Body for POST /api/company/new_provider.
 *
 * Same keys as before. `timestamp` is passed in rather than read here so the
 * two stamps cannot disagree — they were two separate `new Date().toISOString()`
 * calls on the same record — and so this stays testable.
 *
 * The typed values are trimmed: "Acme " and "Acme" are one supplier, and the
 * old form would have stored two.
 */
export const buildNewProviderPayload = ({ provider, user, timestamp }) => ({
  ...provider,
  companyName: text(provider?.companyName),
  address: {
    street: text(provider?.address?.street),
    city: text(provider?.address?.city),
    state: text(provider?.address?.state),
    postalCode: text(provider?.address?.postalCode),
    country: text(provider?.address?.country),
  },
  contactInfo: {
    name: text(provider?.contactInfo?.name),
    email: text(provider?.contactInfo?.email),
    phone: text(provider?.contactInfo?.phone),
    website: text(provider?.contactInfo?.website),
  },
  services: (Array.isArray(provider?.services) ? provider.services : [])
    .map((service) => text(service))
    .filter((service) => service.length > 0),
  creator: user?.companyData?.id,
  createdAt: timestamp,
  updatedAt: timestamp,
});

/**
 * The id of the supplier that was just created, so a document can be filed
 * against it without leaving the modal.
 *
 * `POST /company/new_provider` is documented by its request only, so the shape
 * of what comes back is not something the client can rely on. Every plausible
 * spelling is tried, and the caller is expected to fall back to matching the
 * refetched list by name — which is why this returns null rather than guessing.
 */
export const resolveCreatedProviderId = (responseData) => {
  const record =
    responseData?.provider ??
    responseData?.providerCompany ??
    responseData?.newProvider ??
    responseData;
  const id = record?.id ?? record?._id;
  return id ? String(id) : null;
};

/** The supplier in a refetched list that matches the name just submitted. */
export const findProviderByName = (providers, companyName) => {
  const wanted = text(companyName).toLowerCase();
  if (!wanted) return null;
  return (
    (Array.isArray(providers) ? providers : []).find(
      (provider) => text(provider?.companyName).toLowerCase() === wanted
    ) ?? null
  );
};
