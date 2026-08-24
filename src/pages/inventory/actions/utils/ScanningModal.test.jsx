import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import ScanningModal from "./ScanningModal";

/** Mirrors how BulkComponents supplies the caller-owned list. */
function Harness({ initial = [] }) {
  const [scannedSerialNumbers, setScannedSerialNumbers] = useState(initial);
  return (
    <ScanningModal
      openScanningModal={true}
      setOpenScanningModal={() => {}}
      scannedSerialNumbers={scannedSerialNumbers}
      setScannedSerialNumbers={setScannedSerialNumbers}
    />
  );
}

const scan = async (value) => {
  fireEvent.change(
    screen.getByPlaceholderText("Scan/type serial number to check in."),
    { target: { value } },
  );
  fireEvent.click(screen.getByRole("button", { name: /add/i }));
  await waitFor(() =>
    expect(
      screen.getByPlaceholderText("Scan/type serial number to check in."),
    ).toHaveValue(""),
  );
};

describe("ScanningModal", () => {
  it("renders without the list props instead of taking the screen down", () => {
    // Regression: BulkComponents had these two props commented out, so the
    // modal threw on the count in its own title the moment it opened.
    expect(() =>
      render(
        <ScanningModal
          openScanningModal={true}
          setOpenScanningModal={() => {}}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText(/Total scanned\/typed: 0/)).toBeInTheDocument();
  });

  it("adds a scanned serial, trimmed, and shows it as a chip", async () => {
    render(<Harness />);
    await scan("  300  ");
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText(/Total scanned\/typed: 1/)).toBeInTheDocument();
  });

  it("does not add the same tag twice when the reader re-reads it", async () => {
    render(<Harness />);
    await scan("3425E16CB400000000003039");
    await scan("3425E16CB400000000003039");
    expect(screen.getAllByText("3425E16CB400000000003039")).toHaveLength(1);
    expect(screen.getByText(/Total scanned\/typed: 1/)).toBeInTheDocument();
  });

  it("keeps accumulating distinct reads", async () => {
    render(<Harness />);
    await scan("300");
    await scan("301");
    expect(screen.getByText(/Total scanned\/typed: 2/)).toBeInTheDocument();
  });

  it("accepts a long EPC and a short serial in the same session", async () => {
    render(<Harness />);
    await scan("300");
    await scan("3425E16CB400000000003039");
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("3425E16CB400000000003039")).toBeInTheDocument();
    expect(screen.getByText(/Total scanned\/typed: 2/)).toBeInTheDocument();
  });
});
