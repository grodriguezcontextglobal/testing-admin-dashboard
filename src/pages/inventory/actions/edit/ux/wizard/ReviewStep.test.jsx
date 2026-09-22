import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ReviewStep from "./ReviewStep";

/**
 * The scope sentence, pinned.
 *
 * Fredrik spent three minutes on it (P2 `19:46`–`21:41`) — built the worst case
 * himself, an accountant updating 2,000 Chromebooks across 50 warehouses while
 * managers keep adding stock, and had it confirmed twice that the new units are
 * swept in. It describes what happens to other people's data, so it is worth
 * more than a note in a file nobody opens.
 */
const setup = (props = {}) =>
  render(
    <ReviewStep
      updateAll
      scopeSummary={{ matchCount: 2000, fields: {} }}
      scannedSerialNumbers={[]}
      subLocationsSubmitted={[]}
      watch={() => ({})}
      handleSubmit={(fn) => fn}
      updateGroupItems={vi.fn()}
      loadingStatus={false}
      confirmed={false}
      setConfirmed={vi.fn()}
      goBack={vi.fn()}
      {...props}
    />
  );

describe("the whole-group scope", () => {
  /* Not "every item in this group": those three are literally the WHERE clause
     the job runs, so naming them says what defines the set. */
  it("names the three things that decide which items are updated", () => {
    setup();

    expect(document.body.textContent).toContain(
      "Every item with the same category, device name and brand"
    );
  });

  it("still says how many there were when the wizard opened", () => {
    setup();

    expect(document.body.textContent).toContain("2000");
  });

  /* `22:49` — "if items were added during this process and those items match
     the initial search criteria, all those items will also be updated per this
     request." It used to be a subclause; it is its own sentence now. */
  it("says outright that items added meanwhile are swept in", () => {
    setup();

    expect(document.body.textContent).toContain(
      "If someone adds an item matching those three while this is running, it is updated too."
    );
  });

  /* The boundary he established at `22:20`, and the reason it is where it is:
     the update catches whatever matches at the moment it runs. */
  it("says where the sweep stops", () => {
    setup();

    expect(document.body.textContent).toContain(
      "Items added after it finishes are not."
    );
  });

  it("no longer buries the race in a subclause", () => {
    setup();

    expect(document.body.textContent).not.toMatch(/if one was added since/i);
    expect(document.body.textContent).not.toMatch(/every item in this group/i);
  });
});

describe("the frozen list scope", () => {
  /* The other branch was already right and says the opposite thing, so it is
     pinned too — the two sentences are only useful while they stay different. */
  it("promises nothing about items added later", () => {
    setup({ updateAll: false, scannedSerialNumbers: ["SN-1", "SN-2"] });

    expect(document.body.textContent).toContain(
      "This list is frozen — items added to the group after now are not touched."
    );
    expect(document.body.textContent).not.toMatch(/is updated too/i);
  });
});
