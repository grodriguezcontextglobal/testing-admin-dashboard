import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentAssignmentBoard from "./DocumentAssignmentBoard";

/**
 * Meeting 2026-09-29: "people would think that they can drag and drop
 * something to that" (`34:41`), "here I can drag it, but I cannot click it"
 * (`40:43`–`42:18`), and the dragged card drawn behind the panel (`42:16`).
 */
const available = [
  { _id: "d1", title: "Waiver form", document_url: "https://docs/d1" },
  { _id: "d2", title: "Flyer", document_url: "https://docs/d2" },
];

const setup = (props = {}) => {
  const onAssign = vi.fn();
  const utils = render(
    <DocumentAssignmentBoard
      available={available}
      assigned={[]}
      loading={false}
      onAssign={onAssign}
      assignedTable={<div>assigned table</div>}
      {...props}
    />
  );
  return { ...utils, onAssign };
};

describe("DocumentAssignmentBoard", () => {
  it("says where documents are dragged from", () => {
    const { container } = setup();
    expect(container.textContent).toContain("Drag a document here from the list on the left");
    expect(container.textContent).not.toContain("Drop here to assign");
  });

  it("points a file on the computer to the upload, not to this zone", () => {
    const { container } = setup();
    expect(container.textContent).toContain(
      "To add a file from your computer, use “Upload a new document” below."
    );
  });

  it("assigns a document with a click, not only by dragging", () => {
    const { onAssign } = setup();
    fireEvent.click(screen.getByRole("button", { name: /assign waiver form/i }));
    expect(onAssign).toHaveBeenCalledWith(available[0]);
  });

  /* Dropping a file the browser does not handle makes it open the file and
     leave the wizard. The drop is caught and explained instead. */
  it("catches a file dropped from the computer and explains it", () => {
    setup();
    const zone = screen.getByTestId("assigned-dropzone");
    const dataTransfer = { types: ["Files"], files: [] };
    fireEvent.dragOver(zone, { dataTransfer });
    const dropped = fireEvent.drop(zone, { dataTransfer });

    expect(dropped).toBe(false); // preventDefault: the browser keeps the page
    // By text: dnd-kit keeps its own role="status" live region on the page.
    expect(
      screen.getByText(/Files from your computer cannot be dropped here/)
    ).toBeInTheDocument();
  });

  it("counts both lists", () => {
    const { container } = setup({ assigned: [{ id: "d9", title: "Old" }] });
    expect(container.textContent).toContain("Available documents (2)");
    expect(container.textContent).toContain("Assigned to this event (1)");
  });
});

describe("DocumentAssignmentBoard — an expired document", () => {
  it("is listed as Expired, with no way to assign it", () => {
    const onAssign = vi.fn();
    render(
      <DocumentAssignmentBoard
        available={[
          { _id: "old", title: "Old waiver", document_url: "u", expiration_date: "2020-01-01" },
        ]}
        assigned={[]}
        loading={false}
        onAssign={onAssign}
      />
    );
    expect(screen.getByText("Old waiver")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /assign old waiver/i })).toBeNull();
  });
});
