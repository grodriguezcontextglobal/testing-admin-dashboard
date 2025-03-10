import { groupBy } from "lodash";

const getBarChartData = (advanceSearch) => {
  const labelOption = {
    show: false,
    position: "insideBottom",
    distance: 15,
    align: "left",
    verticalAlign: "middle",
    rotate: 90,
    textWrap: 'wrap',
    formatter:"{name|{a}}", // "{c}  {name|{a}}",
    fontSize: 16,
    fontFamily:"Inter",
    innerHeight:"100%",
    color:"#000",
    rich: {
      name: {},
    },
  };


  // 1. Group records by location
  const groupedByLocation = groupBy(advanceSearch, "location");
  const allLocations = Object.keys(groupedByLocation); // x-axis categories

  // 2. For each location, further group by item_group to get { item, quantity }
  //    Also collect all distinct item names in a Set
  const itemSet = new Set();
  const locationMap = new Map();

  allLocations.forEach((location) => {
    // Group the records for this location by "item_group"
    const groupedByItem = groupBy(groupedByLocation[location], "item_group");
    // Build an array of { item, quantity }
    const itemArray = Object.keys(groupedByItem).map((itemName) => {
      itemSet.add(itemName);
      return {
        item: itemName,
        quantity: groupedByItem[itemName].length,
      };
    });
    locationMap.set(location, itemArray);
  });

  // 3. Now we have:
  //    locationMap = Map(
  //       "Plantation, FL" => [ { item: "Iphone 20 Pro Max", quantity: 1400 }, ...],
  //       "New York, NY"   => [ { item: "Infrared Receiver", quantity: 1 }, ...]
  //    )
  //    itemSet = { "Iphone 20 Pro Max", "TESTER", "Infrared Receiver" }

  // 4. Build an array of ECharts series, one per unique item
  const allItems = [...itemSet];
  const series = allItems.map((itemName) => {
    // For each location, find quantity or default to 0
    const dataArray = allLocations.map((loc) => {
      const itemsAtLoc = locationMap.get(loc) || [];
      const foundItem = itemsAtLoc.find((i) => i.item === itemName);
      return foundItem ? foundItem.quantity : 0;
    });

    return {
      name: itemName,
      barGap: 0.1,
      label: labelOption,
      showBackground: true,
      type: "bar",
      data: dataArray, // same index order as `allLocations`
    };
  });

  // 5. Return the final structure
  return {
    xAxisData: allLocations, // for the category axis
    series, // an array of bar-series objects
  };
};

export default getBarChartData;
