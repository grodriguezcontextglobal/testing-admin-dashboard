import { groupBy } from "lodash";

export function extractDataForRendering(structuredData) {
  const keys = ["category_name", "item_group", "brand", "ownership"];
  const extractedData = {};

  keys.forEach((key) => {
    if (structuredData[key]) {
      extractedData[key] = Object.entries(structuredData[key]).map(
        ([subKey, values]) => ({
          key: subKey,
          value: values.total,
          totalAvailable: values.totalAvailable,
        })
      );
    }
  });

  return extractedData;
}

export const sortingByParameters = ({ props, data }) => {
  const totalPerLocation = new Map();
  const parameter = props;
  let database = data ?? [];
  if (database?.length > 0) {
    for (let data of database) {
      if (totalPerLocation.has(data[parameter])) {
        totalPerLocation.set(
          data[parameter],
          totalPerLocation.get(data[parameter]) + 1
        );
      } else {
        totalPerLocation.set(data[parameter], 1);
      }
    }
  }
  const result = new Set();
  for (let [key, value] of totalPerLocation) {
    result.add({ key, value });
  }
  return Array.from(result);
};

const renderingTotalAvailableDevices = (props) => {
  const result = groupBy(props, "warehouse");
  if (result[1]) {
    const resultAssignable = groupBy(result[1], "data.warehouse");
    if (resultAssignable[1]) {
      return resultAssignable[1].length;
    }
    return 0;
  }
  return 0;
};

export const displayTotalDevicesAndTotalAvailablePerLocation = ({
  props,
  data,
}) => {
  const totalPerLocation = new Map();
  const parameter = props;
  const database  = data ?? [];
  if (database?.length > 0) {
    for (let data of database) {
      if (totalPerLocation.has(data[parameter])) {
        totalPerLocation.set(data[parameter], [
          ...totalPerLocation.get(data[parameter]),
          data,
        ]);
      } else {
        totalPerLocation.set(data[parameter], [data]);
      }
    }
  }
  const result = new Set();
  for (let [key, value] of totalPerLocation) {
    const valueParameter = {
      total: value.length ?? 0,
      available: renderingTotalAvailableDevices(value),
    };
    result.add({ key, valueParameter });
  }
  return Array.from(result);
};
