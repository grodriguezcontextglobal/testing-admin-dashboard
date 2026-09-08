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
 * Whether the shortcut can work at all, given the option lists that feed it.
 *
 * A company that has not loaded any inventory has nothing to copy from. Offering
 * the panel there promises a shortcut that cannot deliver: the user opens it,
 * finds three empty dropdowns, and cannot tell a broken feature from an empty
 * one.
 *
 * @param {Array<Array>} optionLists one list per criterion field.
 */
export const hasReferenceOptions = (optionLists = []) =>
  Array.isArray(optionLists) &&
  optionLists.some((list) => Array.isArray(list) && list.length > 0);

/** The three criteria fields, shared by the "copy from an existing device"
 * panel (create flow) and the update wizard's step 1 (edit flow) — both
 * search the same way, so they carry the same field list and option shape. */
export const REFERENCE_FIELDS = [
  {
    name: "reference_category_name",
    label: "Category",
    placeholder: "Any category",
    optionsKey: "category_name",
  },
  {
    name: "reference_item_group",
    label: "Group",
    placeholder: "Any device",
    optionsKey: "item_group",
  },
  {
    name: "reference_brand",
    label: "Brand",
    placeholder: "Any brand",
    optionsKey: "brand",
  },
];

export const toOptions = (options) =>
  (options ?? []).map((option) =>
    typeof option === "string" ? { value: option } : { value: option.value },
  );

/** How to name the unit the details came from, when it has no serial number. */
export const referenceSourceLabel = (copiedFrom) =>
  isFilled(copiedFrom?.serial_number)
    ? copiedFrom.serial_number
    : "an existing device";

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

/**
 * Whether an option should stay visible for what has been typed.
 *
 * antd's `AutoComplete` defaults `filterOption` to `false` — unlike `Select`,
 * which defaults it to `true` — so the category, group and brand fields on the
 * add-inventory form listed every option no matter what was typed into them.
 * On a company with a few hundred groups that makes the field a scroll, which
 * is the thing typing was supposed to avoid.
 *
 * Substring rather than prefix: nobody remembers the leading word of a model.
 */
export const matchesTypedText = (typed, option) => {
  const needle = String(typed ?? "").trim().toLowerCase();
  if (needle === "") return true;

  const haystack = String(option?.label ?? option?.value ?? "").toLowerCase();
  return haystack.includes(needle);
};
