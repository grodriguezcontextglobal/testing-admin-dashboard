export const retrieveExistingSubLocationsForCompanyInventory = (props) => {
  const result = { 0: [], 1: [], 2: [] };
  const trackers = { 0: new Set(), 1: new Set(), 2: new Set() };

  if (Array.isArray(props) && props.length > 0) {
    for (const item of props) {
      const subLocations = item.sub_location;
      if (!Array.isArray(subLocations)) continue;

      subLocations.forEach((sub_location, index) => {
        if (
          typeof sub_location !== "string" ||
          sub_location.trim() === "" ||
          sub_location === "null"
        ) return;

        if (!trackers[index].has(sub_location)) {
          trackers[index].add(sub_location);
          result[index].push({ value: sub_location });
        }
      });
    }
  }

  return result;
};
