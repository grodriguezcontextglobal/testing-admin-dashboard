import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DraftEventsTable from "./DraftEventsTable";

/**
 * Meeting 2026-09-29 `39:16`: "you should be able to go back to it". A draft
 * says it is a draft, and offers the two things you do with one: finish it,
 * or throw it away.
 */
const drafts = [
  {
    id: "m1",
    configuration: "in-progress",
    eventInfoDetail: {
      eventName: "BBQ",
      dateBegin: "2099-10-02T15:00:00.000Z",
      dateEnd: "2099-10-02T20:00:00.000Z",
    },
  },
];

const setup = (props = {}) => {
  const onResume = vi.fn();
  const onDelete = vi.fn();
  const utils = render(
    <DraftEventsTable
      drafts={drafts}
      onResume={onResume}
      onDelete={onDelete}
      canResume
      canDelete
      busyId={null}
      {...props}
    />
  );
  return { ...utils, onResume, onDelete };
};

describe("DraftEventsTable", () => {
  it("labels the event Draft", () => {
    setup();
    expect(screen.getByText("BBQ")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("takes you back into setup", () => {
    const { onResume } = setup();
    fireEvent.click(screen.getByRole("button", { name: /continue setup/i }));
    expect(onResume).toHaveBeenCalledWith(drafts[0]);
  });

  /* Deleting cannot be undone, so it asks first. */
  it("asks before deleting, then deletes", async () => {
    const { onDelete } = setup();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.getByText(/delete the draft “BBQ”\?/i)).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    expect(onDelete).toHaveBeenCalledWith(drafts[0]);
  });

  it("offers only what the role may do", () => {
    setup({ canResume: false, canDelete: false });
    expect(screen.queryByRole("button", { name: /continue setup/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("holds the row's buttons while its action runs", () => {
    setup({ busyId: "m1" });
    expect(screen.getByRole("button", { name: /continue setup/i })).toBeDisabled();
  });
});

/* 2026-09-30: side by side from md up, one above the other below it. */
describe("DraftEventsTable — button layout", () => {
  const viewport = (small) =>
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query) => ({
        // MUI asks "(max-width:899.95px)" for down("md").
        matches: small && /max-width/.test(query),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }))
    );
  const actions = () =>
    screen.getByRole("button", { name: /continue setup/i }).closest("[data-draft-actions]");

  it("puts the buttons side by side on md and larger screens", () => {
    viewport(false);
    try {
      setup();
      expect(actions().style.flexDirection).toBe("row");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("stacks them on small screens", () => {
    viewport(true);
    try {
      setup();
      expect(actions().style.flexDirection).toBe("column");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

/* A draft whose end date has passed reads Inactive (meeting 2026-09-29
   `40:00`), and can still be finished or deleted. */
describe("DraftEventsTable — a draft past its end date", () => {
  it("labels it Inactive and keeps both actions", () => {
    setup({
      drafts: [
        {
          ...drafts[0],
          id: "m2",
          eventInfoDetail: { ...drafts[0].eventInfoDetail, dateEnd: "2020-01-01T00:00:00.000Z" },
        },
      ],
    });
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue setup/i })).toBeInTheDocument();
  });
});
