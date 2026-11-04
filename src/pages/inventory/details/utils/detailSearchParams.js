/**
 * The search value the category, group, brand and ownership detail pages are
 * opened with: `/inventory/<kind>?<name>&search=<value>`.
 *
 * Each page used to read it inline, four slightly different ways. They threw
 * when the `&` was missing, the category page read a character of the name
 * instead of the parameter, and a missing value came back as the string
 * "undefined", which an effect then had to clear after the first render.
 */
const EMPTY_WORDS = new Set(["undefined", "null"]);

const decode = (value) => {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
};

export const readDetailSearchValue = (search) => {
  const raw = String(search ?? "").split("&")[1]?.split("=")[1];
  if (!raw) return "";
  const value = decode(raw);
  return EMPTY_WORDS.has(value) ? "" : value;
};
