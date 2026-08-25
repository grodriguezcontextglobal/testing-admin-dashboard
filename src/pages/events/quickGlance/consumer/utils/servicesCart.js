/**
 * The cart of extra services being charged to a consumer.
 *
 * Extracted from ServicesTransaction.jsx, where the total was computed as
 * `data.price * data.quantity` directly on the raw form strings. Any typo in
 * either field produced `NaN`, which was rendered straight into the primary
 * button: "Total to be charged: $NaN | Click to submit CC information" — and the
 * button stayed clickable, because the guard was `totalToBeCharged() > 0` and
 * `NaN > 0` is false, so it silently disappeared instead.
 *
 * Same family of defect as the `RRRRRNaN` in the device screens: arithmetic on
 * unvalidated strings, rendered without a guard.
 */

const toNumber = (value) => {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value) => Math.round(value * 100) / 100;

export function serviceLineTotal(line) {
  const price = toNumber(line?.price);
  const quantity = toNumber(line?.quantity);
  if (price === null || quantity === null) return 0;
  return round(price * quantity);
}

export function cartTotal(lines) {
  const list = Array.isArray(lines) ? lines : [];
  return round(list.reduce((total, line) => total + serviceLineTotal(line), 0));
}

export function validateServiceLine({ service, price, quantity }) {
  const problems = [];

  if (!String(service ?? "").trim()) {
    problems.push("Choose a service.");
  }

  const priceValue = toNumber(price);
  if (priceValue === null || priceValue <= 0) {
    problems.push("Enter a price greater than zero.");
  }

  const quantityValue = toNumber(quantity);
  if (
    quantityValue === null ||
    quantityValue <= 0 ||
    !Number.isInteger(quantityValue)
  ) {
    problems.push("Enter a whole quantity of at least one.");
  }

  return { ok: problems.length === 0, problems };
}

/**
 * Append a line, normalized and keyed.
 *
 * The key matters: chips were previously keyed on
 * `${service}-${price}-${quantity}`, so charging the same service twice at the
 * same price gave two chips one key, and removing either removed the wrong one.
 * `removeServiceLine` works by key, not by index, for the same reason.
 */
export function addServiceLine(lines, { service, price, quantity }) {
  const list = Array.isArray(lines) ? lines : [];
  const normalized = {
    // Positional and monotonic: no Date.now(), no random, so the key is stable
    // across re-renders and unique within the cart.
    key: `line-${list.length}-${list.reduce((sum, line) => sum + line.quantity, 0)}`,
    service: String(service ?? "").trim(),
    price: toNumber(price) ?? 0,
    quantity: toNumber(quantity) ?? 0,
  };
  return [...list, { ...normalized, total: serviceLineTotal(normalized) }];
}

export function removeServiceLine(lines, key) {
  const list = Array.isArray(lines) ? lines : [];
  return list.filter((line) => line.key !== key);
}
