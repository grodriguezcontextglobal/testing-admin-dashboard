import { describe, expect, it } from "vitest";
import { initialDeviceReviewState } from "./deviceReviewState";

describe("initialDeviceReviewState", () => {
  it("returns empty selections for an empty setup", () => {
    expect(initialDeviceReviewState([])).toEqual({
      dataToRender: [],
      checkConsumerUses: [],
      container: [],
      allConsumerUsesChecked: false,
      allContainersChecked: false,
    });
  });

  it("treats a missing setup as empty", () => {
    expect(initialDeviceReviewState(undefined).dataToRender).toEqual([]);
  });

  it("marks the indexes already set for consumer use and as containers", () => {
    const a = { category_name: "A", consumerUses: true, isItSetAsContainerForEvent: false };
    const b = { category_name: "B", consumerUses: false, isItSetAsContainerForEvent: true };
    const c = { category_name: "C", consumerUses: true, isItSetAsContainerForEvent: true };
    const state = initialDeviceReviewState([a, b, c]);
    expect(state.dataToRender).toEqual([a, b, c]);
    expect(state.checkConsumerUses).toEqual([0, 2]);
    expect(state.container).toEqual([1, 2]);
    expect(state.allConsumerUsesChecked).toBe(false);
    expect(state.allContainersChecked).toBe(false);
  });

  it("sets the 'all' flags when every row is checked", () => {
    const row = { consumerUses: true, isItSetAsContainerForEvent: true };
    const state = initialDeviceReviewState([row, { ...row }]);
    expect(state.allConsumerUsesChecked).toBe(true);
    expect(state.allContainersChecked).toBe(true);
  });

  it("drops a row that appears twice as the same object", () => {
    const row = { category_name: "A" };
    expect(initialDeviceReviewState([row, row]).dataToRender).toEqual([row]);
  });

  it("returns a new array, not the store's", () => {
    const setup = [{ category_name: "A" }];
    expect(initialDeviceReviewState(setup).dataToRender).not.toBe(setup);
  });
});
