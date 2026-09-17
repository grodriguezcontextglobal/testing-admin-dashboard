import { describe, expect, it } from "vitest";
import { buildLocationPathUpdateBody } from "./locationPathUpdate";

describe("buildLocationPathUpdateBody", () => {
  // The server deployed today validates company_id and answers 400 without it;
  // the hardened one takes it from the verified context and answers 400 when
  // the body disagrees with the s-company-lq header. Sending the header's own
  // value satisfies both, which is what takes the deploy order — ours first or
  // theirs first — out of the question entirely.
  it("sends the company the header is carrying, when it is given one", () => {
    const body = buildLocationPathUpdateBody({
      newName: "Shelf B",
      path: ["Main warehouse", "Shelf A"],
      companyId: "137",
    });

    expect(body.company_id).toBe("137");
  });

  // The value comes from localStorage, where it can be missing. A key present
  // with undefined disappears from the JSON, which is the 400 we are avoiding —
  // so the key is absent instead, deliberately and visibly.
  it("leaves the field out rather than sending an empty one", () => {
    for (const companyId of [undefined, null, ""]) {
      const body = buildLocationPathUpdateBody({
        newName: "Shelf B",
        path: ["Main warehouse"],
        companyId,
      });

      expect("company_id" in body).toBe(false);
    }
  });

  // The reason this file exists. The server reads the company from the
  // verified context — the s-company-lq header, out of localStorage — and a
  // second copy from **Redux** disagrees with it right after a company switch.
  // `in`, not toBeUndefined(): a key present with an undefined value is gone
  // from the JSON but still reads as undefined here, so the weaker assertion
  // would pass on a body that carries the field.
  it("does not invent a company of its own", () => {
    const body = buildLocationPathUpdateBody({
      newName: "Shelf B",
      path: ["Main warehouse", "Shelf A"],
    });

    expect("company_id" in body).toBe(false);
  });

  // The one that actually closes the door: naming the absent field only
  // catches the field we thought of. Anything else re-added to the body fails
  // here, and the caller's company_id is the one addition that is allowed.
  it("emits the three keys of the path update, and nothing else", () => {
    const body = buildLocationPathUpdateBody({
      newName: "Shelf B",
      path: ["Main warehouse", "Shelf A"],
      companyId: "137",
    });

    expect(Object.keys(body).sort()).toEqual([
      "company_id",
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
