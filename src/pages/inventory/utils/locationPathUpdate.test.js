import { describe, expect, it } from "vitest";
import { buildLocationPathUpdateBody } from "./locationPathUpdate";

describe("buildLocationPathUpdateBody", () => {
  // The reason this file exists. The server reads the company from the
  // verified context — the s-company-lq header, out of localStorage — and a
  // second copy from Redux disagrees with it right after a company switch.
  // `in`, not toBeUndefined(): a key present with an undefined value is gone
  // from the JSON but still reads as undefined here, so the weaker assertion
  // would pass on a body that carries the field.
  it("does not emit company_id", () => {
    const body = buildLocationPathUpdateBody({
      newName: "Shelf B",
      path: ["Main warehouse", "Shelf A"],
    });

    expect("company_id" in body).toBe(false);
  });

  // The one that actually closes the door: naming the absent field only
  // catches the field we thought of. Anything re-added to the body fails here.
  it("emits three keys, and only those three", () => {
    const body = buildLocationPathUpdateBody({
      newName: "Shelf B",
      path: ["Main warehouse", "Shelf A"],
    });

    expect(Object.keys(body).sort()).toEqual([
      "currentIndex",
      "newName",
      "path",
    ]);
  });

  it("points currentIndex at the last segment of the path", () => {
    expect(
      buildLocationPathUpdateBody({
        newName: "Shelf B",
        path: ["Main warehouse", "Shelf A"],
      }).currentIndex,
    ).toBe(1);

    expect(
      buildLocationPathUpdateBody({ newName: "Depot", path: ["Main warehouse"] })
        .currentIndex,
    ).toBe(0);
  });

  // Renaming to " Shelf B " is a rename to " Shelf B ". Trimming or casing
  // here would be the client deciding something the server never asked for.
  it("passes newName and path through untouched", () => {
    const path = ["Main warehouse", "Aisle 3"];
    const body = buildLocationPathUpdateBody({ newName: "  Shelf B  ", path });

    expect(body.newName).toBe("  Shelf B  ");
    expect(body.path).toBe(path);
  });
});
