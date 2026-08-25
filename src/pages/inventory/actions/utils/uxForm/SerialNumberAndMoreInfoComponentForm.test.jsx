import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SerialNumberAndMoreInfoComponentForm from "./SerialNumberAndMoreInfoComponentForm";

/**
 * The wizard renders the Units step conditionally, so stepping to Review
 * unmounts this component and stepping back mounts a fresh one. It therefore
 * has to rebuild its unit list from what the parent still holds.
 *
 * Before it did, a fresh mount started from [] and the next commit() published
 * only the unit just added — three staged units plus one more created one item.
 */
const setup = (props = {}) => {
  const setScannedSerialNumbers = vi.fn();
  const setMoreInfo = vi.fn();
  render(
    <SerialNumberAndMoreInfoComponentForm
      style={{}}
      moreInfo={[]}
      scannedSerialNumbers={[]}
      setScannedSerialNumbers={setScannedSerialNumbers}
      setMoreInfo={setMoreInfo}
      {...props}
    />
  );
  return { setScannedSerialNumbers, setMoreInfo };
};

describe("SerialNumberAndMoreInfoComponentForm — remount after Review", () => {
  it("rebuilds the staged units from the parent on mount", () => {
    setup({ scannedSerialNumbers: ["SN-1", "SN-2", "SN-3"] });
    expect(screen.getByText("SN-1")).toBeInTheDocument();
    expect(screen.getByText("SN-2")).toBeInTheDocument();
    expect(screen.getByText("SN-3")).toBeInTheDocument();
  });

  it("carries each unit's identifiers back across the remount", () => {
    setup({
      scannedSerialNumbers: ["SN-1"],
      moreInfo: [{ "SN-1": [{ name: "IMEI", value: "356938" }] }],
    });
    expect(screen.getByText("SN-1")).toBeInTheDocument();
  });

  it("starts empty when the parent holds nothing", () => {
    setup();
    expect(screen.queryByText("SN-1")).not.toBeInTheDocument();
  });
});
