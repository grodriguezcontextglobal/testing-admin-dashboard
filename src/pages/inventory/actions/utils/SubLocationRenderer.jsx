import { orderBy } from "lodash";

export const retrieveExistingSubLocationsForCompanyInventory = (props, selectedLocation) => {
  const result = [];
  const trackers = new Set();

  if (Array.isArray(props) && props.length > 0) {
    // Filter items by selected location first
    const locationItems = props.filter(item => item.location === selectedLocation);

    for (const item of locationItems) {
      const subLocations = item.sub_location;
      if (!Array.isArray(subLocations)) continue;

      subLocations.forEach((sub_location) => {
        if (
          typeof sub_location !== "string" ||
          sub_location.trim() === "" ||
          sub_location === "null"
        )
          return;

        if (!trackers.has(sub_location)) {
          trackers.add(sub_location);
          result.push({ value: sub_location });
        }
      });
    }
  }

  const orderedData = orderBy(result, ["value"], ["asc"]);
  return orderedData;
};

/**
 * Combine the committed sub-location chips (subLocationsSubmitted) with any
 * value still sitting in the "Sub location" field so a sub-location that was
 * picked/typed but not explicitly "added" as a chip is still saved. Skips a
 * field value that is already the last chip to avoid duplicating it.
 */
export const buildSubLocationPath = (subLocationsSubmitted, data) => {
  const chips = Array.isArray(subLocationsSubmitted) ? subLocationsSubmitted : [];
  const fieldValue =
    data && typeof data.sub_location === "string" ? data.sub_location.trim() : "";
  if (fieldValue && chips[chips.length - 1] !== fieldValue) {
    return [...chips, fieldValue];
  }
  return [...chips];
};
