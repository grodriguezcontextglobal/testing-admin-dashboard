import { groupBy } from "lodash";

export const retrieveExistingSubLocationsForCompanyInventory = (props) => {
  const result = {
    0: [],
    1: [],
    2: [],
  };
  if (props) {
    const industryData = props;
    const groupingByItemGroup = groupBy(industryData, "sub_location");
    for (let key of Object.keys(groupingByItemGroup)) {
      const sub_locations_split = String(key).split(",");
      sub_locations_split.forEach((sub_location, index) => {
        if (
          sub_location === "" ||
          sub_location === null ||
          sub_location === "null"
        )
          return;
        result[index] = [...result[index], {value: sub_location}];
      });
    }
    return result;
  }
  return result;
};
