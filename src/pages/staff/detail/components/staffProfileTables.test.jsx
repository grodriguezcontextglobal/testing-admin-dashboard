import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DeviceDocumentsTable from "./DeviceDocumentsTable";
import StaffEventsTable from "./StaffEventsTable";
import { deviceRowsForStaff } from "../utils/staffProfileSummary";

/**
 * The two props-driven tables of the staff profile. `AssignedDevicesTable` is
 * left out on purpose: it pulls in the return-device modal, which reaches for
 * Redux and the query client, and what is worth pinning here is the row and
 * permission behaviour these two express.
 */
describe("StaffEventsTable", () => {
  it("labels a running event and a closed one distinctly", () => {
    render(
      <StaffEventsTable
        rows={[
          { key: "e1", event: "Expo", role: "Administrator", active: true },
          { key: "e2", event: "Summit", role: "Coordinator", active: false },
        ]}
      />
    );
    expect(screen.getByText("Expo")).toBeTruthy();
    expect(screen.getByText("Running")).toBeTruthy();
    expect(screen.getByText("Closed")).toBeTruthy();
  });

  it("explains how to fix an empty list instead of just saying it is empty", () => {
    render(<StaffEventsTable rows={[]} />);
    expect(screen.getByText("Not on any event")).toBeTruthy();
  });
});

describe("DeviceDocumentsTable", () => {
  const documents = [
    { key: "d1", title: "Loan agreement", signed: true, date: "2026-06-01T10:00:00.000Z" },
    { key: "d2", title: "Damage policy", signed: false, url: "u2" },
  ];

  it("lets the holder sign, and says which action each row offers", () => {
    render(<DeviceDocumentsTable documents={documents} canSign />);
    expect(screen.getByText("Review & sign")).toBeTruthy();
    expect(screen.getByText("View")).toBeTruthy();
  });

  it("lets an administrator open only what has been signed", () => {
    render(<DeviceDocumentsTable documents={documents} canReview />);
    expect(screen.getByText("View")).toBeTruthy();
    expect(screen.queryByText("Review & sign")).toBeNull();
  });

  it("offers nothing to someone who may neither sign nor review", () => {
    render(<DeviceDocumentsTable documents={documents} />);
    expect(screen.queryByText("View")).toBeNull();
    expect(screen.queryByText("Review & sign")).toBeNull();
  });

  it("reports a failed document fetch instead of rendering an empty table", () => {
    render(<DeviceDocumentsTable isError />);
    expect(screen.getByText("Couldn't load the documents")).toBeTruthy();
  });

  it("calls back with the row, the document and what was asked for", () => {
    const onOpen = vi.fn();
    render(<DeviceDocumentsTable documents={documents} canSign onOpen={onOpen} />);
    screen.getByText("Review & sign").click();
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Damage policy" }),
      "sign"
    );
  });
});

describe("device rows feeding the table", () => {
  it("survives an item group with no photo, which used to throw", () => {
    expect(() =>
      deviceRowsForStaff(
        [{ device_id: 1, subscription_initial_date: "2026-06-01" }],
        [{ item_id: 1, item_group: "Radio", serial_number: "SN-1", cost: 10 }],
        []
      )
    ).not.toThrow();
  });
});
