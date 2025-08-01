const gettingInventoryTotalCount = ({
    inventoryEventData,
    event,
}) => {
    const totalCountItemsInventoryEvent = () => {
      if (inventoryEventData?.length === 0) return 0;
      const checkContainersInEvent = event.deviceSetup.filter(
        (item) => item.isItSetAsContainerForEvent
      );
      const gettingContainersData = {};
      const checkIf = (type) => {
        const result = checkContainersInEvent?.some(
          (item) => item.group === type
        );
        if (result) {
          gettingContainersData[type] = checkContainersInEvent
            .filter((item) => item.group === type)
            .at(0).quantity;
        }
        return result;
      };
      const chec = inventoryEventData?.some((item) => checkIf(item.type));
      if (!chec) return inventoryEventData?.length;
      let result = 0;
      Object.values(gettingContainersData).forEach((item) => {
        if (item) {
          result = result + Number(item);
        }
      });
      return inventoryEventData?.length - result;
    };
    return totalCountItemsInventoryEvent();
}

export default gettingInventoryTotalCount
