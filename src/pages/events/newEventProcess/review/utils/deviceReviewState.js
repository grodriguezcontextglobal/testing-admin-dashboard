/**
 * The device review step's starting state, read from the event setup in the
 * store: the rows, which rows are already set for consumer use or as
 * containers (by index), and the two "select all" flags.
 *
 * The rows are a copy, so editing them never touches the store's array.
 */
export const initialDeviceReviewState = (deviceSetup) => {
  const dataToRender = Array.from(new Set(deviceSetup ?? []));
  const indexesWhere = (flag) =>
    dataToRender.flatMap((item, index) => (item?.[flag] ? [index] : []));
  const every = (flag) =>
    dataToRender.length > 0 && dataToRender.every((item) => item?.[flag]);

  return {
    dataToRender,
    checkConsumerUses: indexesWhere("consumerUses"),
    container: indexesWhere("isItSetAsContainerForEvent"),
    allConsumerUsesChecked: every("consumerUses"),
    allContainersChecked: every("isItSetAsContainerForEvent"),
  };
};
