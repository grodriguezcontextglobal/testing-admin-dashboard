import { describe, expect, it } from "vitest";

import {
  RETURN_CONDITIONS,
  conditionLabel,
  conditionValues,
} from "./returnConditions";

/**
 * The condition picked on a return is sent verbatim as `status` to
 * /db_event/returning-item and stored, so the VALUES are a server contract and
 * cannot be reworded. Only what the operator reads may change.
 *
 * The review found two problems with the list. "None" was offered as a
 * condition, which is not a condition — it is a blank field wearing a name.
 * And "Network" and "Hardware" say nothing on their own: asked what Network
 * meant as a condition, nobody in the room could answer from the word.
 */
describe("RETURN_CONDITIONS", () => {
  it("keeps the exact values the server already stores", () => {
    expect(conditionValues()).toEqual([
      "Operational",
      "Network",
      "Hardware",
      "Damaged",
      "Battery",
    ]);
  });

  it("never offers an empty value — blank is the absence of a choice", () => {
    expect(RETURN_CONDITIONS.every((option) => option.value !== "")).toBe(true);
    expect(
      RETURN_CONDITIONS.some((option) => /^none$/i.test(option.label))
    ).toBe(false);
  });

  it("says what each condition means, not just what it is called", () => {
    for (const option of RETURN_CONDITIONS) {
      expect(option.label.length).toBeGreaterThan(option.value.length);
      expect(option.label.startsWith(option.value)).toBe(true);
    }
  });

  it("reads back the label for a stored value", () => {
    expect(conditionLabel("Network")).toBe("Network — will not connect");
  });

  it("hands back an unknown or missing value rather than hiding it", () => {
    // Rows written before this list existed still have to render.
    expect(conditionLabel("Waterlogged")).toBe("Waterlogged");
    expect(conditionLabel("")).toBe("");
    expect(conditionLabel(null)).toBe("");
    expect(conditionLabel(undefined)).toBe("");
  });
});
