/** Devices an event was set up with: the sum of its deviceSetup quantities. */
export const sumDeviceSetup = (event) =>
  (event?.deviceSetup ?? []).reduce(
    (acc, d) => acc + (Number(d.quantity) || 0),
    0
  );
