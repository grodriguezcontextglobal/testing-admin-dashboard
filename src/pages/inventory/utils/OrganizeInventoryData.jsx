import { groupBy } from "lodash";

export function organizeInventoryBySubLocation(data) {
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (!result[key]) {
      result[key] = {
        total: 0,
        available: 0,
        children: {},
      };
    }

    for (const item of value) {
      const subLocArray = item?.data?.sub_location ?? [];
      const isAvailable = item?.data?.enableAssignFeature === 1;

      // Main Location Count
      result[key].total = value.length;
      result[key].available =
        groupBy(value, "data.enableAssignFeature")[1]?.length ?? 0;

      // Walk through sub_key levels
      let pointer = result[key];
      for (const sub of subLocArray) {
        if (!pointer.children[sub]) {
          pointer.children[sub] = {
            total: 0,
            available: 0,
            children: {},
          };
        }

        pointer.children[sub].total += 1;
        if (isAvailable) pointer.children[sub].available += 1;

        pointer = pointer.children[sub];
      }
    }

    // Recursively clean up children with no content
    const cleanChildren = (node) => {
      if (!node.children) return;
      for (const key in node.children) {
        cleanChildren(node.children[key]);
      }
      if (Object.keys(node.children).length === 0) {
        node.children = null;
      }
    };

    cleanChildren(result[key]);
  }

  return result;
}
