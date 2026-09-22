import { render, screen } from "@testing-library/react";
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

/* Three sentences on one screen that all promised a number in a tense the app
   cannot keep. They were raised separately and they are one idea: say what was
   found, do not promise what will happen. */
describe("what the screen promises", () => {
  it("says the items will be updated, in his words", () => {
    setup();

    expect(document.body.textContent).toContain("items will be updated");
    expect(document.body.textContent).not.toMatch(/items will change/);
  });

  /* `23:19` — "it's nice to have 12 items will change at the top. We may change
     that later on, but keep that for now." The count stays; the line under it
     is what keeps it honest. */
  it("keeps the count in the heading, with what it is worth", () => {
    setup();

    expect(document.body.textContent).toContain("2000");
    expect(document.body.textContent).toContain("counted a moment ago");
  });

  /* `19:00` — "you should say these are the changes that will be made." */
  it("heads the diff with what it is", () => {
    setup({
      watch: () => ({ cost: "99" }),
      scopeSummary: { matchCount: 2000, fields: { cost: { value: "50" } } },
    });

    expect(document.body.textContent).toContain(
      "These are the changes that will be made"
    );
    expect(document.body.textContent).not.toMatch(/fields? that change/);
  });

  /* `22:27` — "don't say apply to 12 items because that may not be true… You
     will just say apply at the bottom." A heading describes what was found; a
     button promises what it will do, and only the button can still be wrong by
     the time it is clicked. */
  it("promises nothing on the button", () => {
    setup();

    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/apply to \d+ item/i);
  });
});
