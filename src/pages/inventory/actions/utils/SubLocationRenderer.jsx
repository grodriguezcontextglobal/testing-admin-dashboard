import { orderBy } from "lodash";

export const retrieveExistingSubLocationsForCompanyInventory = (props) => {
  const result = [];
  const trackers = new Set();

  if (Array.isArray(props) && props.length > 0) {
    for (const item of props) {
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
