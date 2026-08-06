import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfileIdentityCard from "./ProfileIdentityCard";
import ProfileStatTiles from "./ProfileStatTiles";
import LoanDateCell from "./LoanDateCell";
import StatusChip from "./StatusChip";

const contactGroup = {
  label: "Contact",
  items: [
    { value: "nora.lopez.2668@summit-district.edu", href: "mailto:nora@x.edu" },
    { value: "(415) 555-3668" },
  ],
};

describe("ProfileIdentityCard", () => {
  it("shows initials in the avatar, not the whole name", () => {
    const { container } = render(
      <ProfileIdentityCard name="Nora Lopez" factGroups={[contactGroup]} />
    );
    const avatar = container.querySelector(".profile-avatar");
    expect(avatar.textContent).toBe("NL");
    expect(avatar.textContent).not.toContain("Nora Lopez");
  });

  it("renders exactly one level-1 heading", () => {
    render(
      <ProfileIdentityCard
        name="Nora Lopez"
        factGroups={[
          contactGroup,
          { label: "Guardian", items: [{ value: "Lucas Lopez" }] },
        ]}
      />
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("puts labels in <dt> and values in <dd> so they aren't styled alike", () => {
    const { container } = render(
      <ProfileIdentityCard name="Nora Lopez" factGroups={[contactGroup]} />
    );
    expect(container.querySelector("dt").textContent).toBe("Contact");
    expect(container.querySelectorAll("dd")).toHaveLength(2);
  });

  it("drops a fact group entirely when it has nothing to show", () => {
    render(
      <ProfileIdentityCard
        name="Marcus Chen"
        factGroups={[
          contactGroup,
          // A consumer has no guardian; the group should vanish rather than
          // render an empty heading.
          { label: "Guardian", items: [{ value: null }, { value: "" }] },
        ]}
      />
    );
    expect(screen.queryByText("Guardian")).toBeNull();
    expect(screen.getByText("Contact")).toBeTruthy();
  });

  it("keeps the action rail in its own column so buttons don't shift", () => {
    const { container, rerender } = render(
      <ProfileIdentityCard
        name="Nora Lopez"
        factGroups={[contactGroup, { label: "Guardian", items: [{ value: "Lucas" }] }]}
        actions={<button type="button">Assign devices</button>}
      />
    );
    expect(container.querySelector(".profile-identity__rail")).toBeTruthy();

    rerender(
      <ProfileIdentityCard
        name="Ada Smith"
        factGroups={[contactGroup]}
        actions={<button type="button">Assign devices</button>}
      />
    );
    // The rail is a sibling of the facts grid, not a cell inside it, so losing
    // the guardian group can't move it.
    const rail = container.querySelector(".profile-identity__rail");
    expect(rail).toBeTruthy();
    expect(rail.closest(".profile-facts")).toBeNull();
  });

  it("renders an em dash rather than a placeholder phone number", () => {
    render(
      <ProfileIdentityCard
        name="Nora Lopez"
        factGroups={[
          { label: "Contact", items: [{ value: "nora@x.edu" }, { value: "—" }] },
        ]}
      />
    );
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.queryByText("+1-000-000-0000")).toBeNull();
  });
});

describe("ProfileStatTiles", () => {
  it("marks only the critical tile with the severity stripe class", () => {
    const { container } = render(
      <ProfileStatTiles
        tiles={[
          { label: "Overdue", value: 1, tone: "critical" },
          { label: "Devices out", value: 3 },
          { label: "Due this week", value: 1 },
        ]}
      />
    );
    expect(container.querySelectorAll(".profile-tile")).toHaveLength(3);
    expect(container.querySelectorAll(".profile-tile--critical")).toHaveLength(1);
  });

  it("renders nothing when there are no tiles", () => {
    const { container } = render(<ProfileStatTiles tiles={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("LoanDateCell", () => {
  it("never prints the raw ISO string", () => {
    const { container } = render(
      <LoanDateCell value="2026-07-03T22:48:24.000Z" showRelative critical />
    );
    expect(container.textContent).not.toContain("2026-07-03T22:48:24.000Z");
    expect(container.textContent).not.toContain("T22:48");
    expect(container.textContent).toMatch(/2026/);
  });

  it("falls back to an em dash for a missing date", () => {
    const { container } = render(<LoanDateCell value={null} />);
    expect(container.textContent).toBe("—");
  });
});

describe("StatusChip", () => {
  it("carries its tone as a modifier class", () => {
    const { container } = render(
      <StatusChip tone="critical" pip label="Overdue 32d" />
    );
    const chip = container.querySelector(".profile-status");
    expect(chip.className).toContain("profile-status--critical");
    expect(chip.textContent).toBe("Overdue 32d");
  });

  it("uses no modifier for the neutral tone", () => {
    const { container } = render(<StatusChip label="On loan" />);
    expect(container.querySelector(".profile-status").className).toBe(
      "profile-status"
    );
  });
});
