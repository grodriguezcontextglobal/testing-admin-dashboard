/**
 * Finding an existing device to copy details from, when adding new ones.
 *
 * The company almost always already owns a unit of whatever is being added, and
 * its cost, brand, description, ownership and image are the same. Rather than
 * retyping them, the user picks category / device name / brand and the matching
 * device's details fill the form.
 *
 * This was inline in useBulkActionLogic, which is also why the two facts that
 * matter most to the user were invisible: how many devices matched, and that
 * the details come from the *first* of them. If a group's units disagree —
 * different costs, different images — the first one silently wins. Surfacing
 * the count and the source unit is the point of pulling it out here.
 */

const isFilled = (value) => String(value ?? "").trim() !== "";

export const hasReferenceCriteria = ({ category, itemGroup, brand } = {}) =>
  isFilled(category) || isFilled(itemGroup) || isFilled(brand);

/**
 * @param {Array} inventoryItems - the company's current units.
 * @param {{category?: string, itemGroup?: string, brand?: string}} criteria -
 *   blank fields are ignored, so any combination narrows rather than excludes.
 * @returns {{matches: Array, source: object|null, matchCount: number,
 *   imageUrl: string|null, imageConflict: boolean}}
 *   `imageUrl` is set only when every match agrees on one picture;
 *   `imageConflict` says the matches carry more than one, in which case the
 *   caller should leave the image alone rather than pick one.
 */
export const findReferenceMatches = (inventoryItems, criteria = {}) => {
  const nothing = {
    matches: [],
    source: null,
    matchCount: 0,
    imageUrl: null,
    imageConflict: false,
  };

  if (!Array.isArray(inventoryItems) || !hasReferenceCriteria(criteria)) {
    return nothing;
  }

  const { category, itemGroup, brand } = criteria;
  const matches = inventoryItems.filter(
    (item) =>
      (!isFilled(category) || item?.category_name === category) &&
      (!isFilled(itemGroup) || item?.item_group === itemGroup) &&
      (!isFilled(brand) || item?.brand === brand),
  );

  if (matches.length === 0) return nothing;

  // A blank image_url is "no picture recorded", not a second variant, so it
  // must not make a group look like it has conflicting images.
  const images = [
    ...new Set(matches.map((item) => item?.image_url).filter(Boolean)),
  ];

  return {
    matches,
    source: matches[0],
    matchCount: matches.length,
    imageUrl: images.length === 1 ? images[0] : null,
    imageConflict: images.length > 1,
  };
};
