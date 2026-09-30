import { describe, expect, it, vi } from "vitest";
import {
  buildBulkMembersList,
  contentHash,
  fitWithin,
  uploadMemberImportImages,
} from "./memberImportImages";

/**
 * Pictures placed inside the cells of the member spreadsheet (meeting
 * 2026-09-29 `14:56`, "the same thing as we did on the inventory").
 *
 * A sheet can carry 2000+ rows with a photo on each, so the upload does the
 * least it can (2026-09-30):
 *
 * - one upload per distinct picture, told apart by CONTENT, not by the file
 *   Excel stored it in — the same photo pasted twice can be two files;
 * - the Cloudinary id is that content hash, so re-importing a sheet overwrites
 *   its photos instead of piling up copies, and two different photos can never
 *   share an id;
 * - each photo is shrunk in the browser first (`prepare`), which is the time
 *   and storage a 2000-row import actually spends.
 */

const IMAGE_A = "data:image/png;base64,AAAA";
const IMAGE_B = "data:image/jpeg;base64,BBBB";

const mediaOf = (entries) =>
  new Map(entries.map(([mediaPath, dataUrl]) => [mediaPath, { mediaPath, dataUrl }]));

const media = mediaOf([
  ["xl/media/image1.png", IMAGE_A],
  ["xl/media/image2.jpeg", IMAGE_B],
]);

const okPost = () =>
  vi.fn(async (_url, body) => ({
    data: { imageUploaded: { secure_url: `https://cdn/${body.imageID}` } },
  }));

const identity = async (dataUrl) => dataUrl;

const upload = (overrides = {}) =>
  uploadMemberImportImages({
    media,
    companyId: 62,
    post: okPost(),
    prepare: identity,
    now: () => 5,
    ...overrides,
  });

describe("uploadMemberImportImages — what gets uploaded", () => {
  it("uploads each distinct picture once", async () => {
    const post = okPost();
    const { urlByMediaPath, failed } = await upload({ post });
    expect(post).toHaveBeenCalledTimes(2);
    expect(failed).toEqual([]);
    expect(urlByMediaPath.size).toBe(2);
  });

  it("uploads the same picture once even when Excel stored it as two files", async () => {
    const post = okPost();
    const { urlByMediaPath } = await upload({
      post,
      media: mediaOf([
        ["xl/media/image1.png", IMAGE_A],
        ["xl/media/image7.png", IMAGE_A],
      ]),
    });
    expect(post).toHaveBeenCalledTimes(1);
    expect(urlByMediaPath.get("xl/media/image7.png")).toBe(
      urlByMediaPath.get("xl/media/image1.png")
    );
  });

  it("does nothing for a workbook without pictures", async () => {
    const post = okPost();
    const result = await upload({ post, media: new Map() });
    expect(post).not.toHaveBeenCalled();
    expect(result.urlByMediaPath.size).toBe(0);
  });
});

describe("uploadMemberImportImages — the Cloudinary id", () => {
  it("names the picture after its content", async () => {
    const post = okPost();
    await upload({ post });
    const hash = await contentHash(IMAGE_A);
    expect(post.mock.calls[0][1].imageID).toBe(`member_62_${hash}`);
  });

  /* The same sheet imported twice must not leave two copies of every photo. */
  it("gives the same picture the same id on the next import", async () => {
    const first = okPost();
    const second = okPost();
    await upload({ post: first, now: () => 1 });
    await upload({ post: second, now: () => 2 });
    expect(first.mock.calls[0][1].imageID).toBe(second.mock.calls[0][1].imageID);
  });

  /* And a new photo can never overwrite a different member's. */
  it("gives different pictures different ids", async () => {
    const post = okPost();
    await upload({ post });
    expect(post.mock.calls[0][1].imageID).not.toBe(post.mock.calls[1][1].imageID);
  });

  it("keeps companies apart", async () => {
    const a = okPost();
    const b = okPost();
    await upload({ post: a, companyId: 1 });
    await upload({ post: b, companyId: 2 });
    expect(a.mock.calls[0][1].imageID).not.toBe(b.mock.calls[0][1].imageID);
  });

  it("sends the member-photo shape to the endpoint a manual upload uses", async () => {
    const post = okPost();
    await upload({ post });
    const [url, body] = post.mock.calls[0];
    expect(url).toBe("/cloudinary/upload-image");
    expect(body.tags).toEqual(["member_import", 62]);
    expect(body.context).toBe("company_sql_id:62|created_at:5|updated_at:5");
  });
});

describe("uploadMemberImportImages — shrinking first", () => {
  it("uploads the prepared picture, not the original", async () => {
    const post = okPost();
    await upload({ post, prepare: async () => "data:image/jpeg;base64,SMALL" });
    expect(post.mock.calls[0][1].imageFile).toBe("data:image/jpeg;base64,SMALL");
  });

  it("names the picture after the ORIGINAL, so the id does not depend on the browser", async () => {
    const post = okPost();
    await upload({ post, prepare: async () => "data:image/jpeg;base64,SMALL" });
    expect(post.mock.calls[0][1].imageID).toBe(`member_62_${await contentHash(IMAGE_A)}`);
  });

  it("prepares each distinct picture once", async () => {
    const prepare = vi.fn(identity);
    await upload({
      prepare,
      media: mediaOf([
        ["xl/media/image1.png", IMAGE_A],
        ["xl/media/image7.png", IMAGE_A],
      ]),
    });
    expect(prepare).toHaveBeenCalledTimes(1);
  });
});

describe("uploadMemberImportImages — failures", () => {
  /* A member without a photo is still a member. Failing the import over one
     picture would make a school re-enter 300 students for it. */
  it("reports a failed upload instead of failing the import", async () => {
    const post = vi
      .fn()
      .mockRejectedValueOnce({ response: { data: { msg: "Too large" } } })
      .mockResolvedValueOnce({ data: { imageUploaded: { secure_url: "https://cdn/2" } } });
    const { urlByMediaPath, failed } = await upload({ post });
    expect(failed).toEqual([{ mediaPath: "xl/media/image1.png", reason: "Too large" }]);
    expect(urlByMediaPath.get("xl/media/image2.jpeg")).toBe("https://cdn/2");
  });

  it("reports every file behind a failed picture", async () => {
    const post = vi.fn().mockRejectedValue(new Error("down"));
    const { failed } = await upload({
      post,
      media: mediaOf([
        ["xl/media/image1.png", IMAGE_A],
        ["xl/media/image7.png", IMAGE_A],
      ]),
    });
    expect(failed.map((f) => f.mediaPath)).toEqual([
      "xl/media/image1.png",
      "xl/media/image7.png",
    ]);
  });

  it("counts an answer with no URL as a failure", async () => {
    const { failed } = await upload({ post: vi.fn(async () => ({ data: {} })) });
    expect(failed).toHaveLength(2);
  });

  it("reports progress per distinct picture", async () => {
    const onProgress = vi.fn();
    await upload({ onProgress });
    expect(onProgress.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });
});

describe("contentHash", () => {
  it("is stable and tells different content apart", async () => {
    expect(await contentHash(IMAGE_A)).toBe(await contentHash(IMAGE_A));
    expect(await contentHash(IMAGE_A)).not.toBe(await contentHash(IMAGE_B));
  });

  it("is short enough for an id and made of hex", async () => {
    expect(await contentHash(IMAGE_A)).toMatch(/^[0-9a-f]{20}$/);
  });

  /* crypto.subtle only exists in a secure context. Opened over plain http, the
     import must still work rather than die on its first picture. */
  it("still hashes where crypto.subtle is missing", async () => {
    vi.stubGlobal("crypto", {});
    try {
      const a = await contentHash(IMAGE_A);
      expect(a).toMatch(/^[0-9a-f]{20}$/);
      expect(a).toBe(await contentHash(IMAGE_A));
      expect(a).not.toBe(await contentHash(IMAGE_B));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("fitWithin — the size a photo is shrunk to", () => {
  it("scales the longer side down to the limit, keeping the proportion", () => {
    expect(fitWithin(4000, 3000, 512)).toEqual({ width: 512, height: 384 });
    expect(fitWithin(3000, 4000, 512)).toEqual({ width: 384, height: 512 });
  });

  it("never enlarges a photo that is already small", () => {
    expect(fitWithin(300, 200, 512)).toEqual({ width: 300, height: 200 });
  });
});

describe("buildBulkMembersList", () => {
  const rows = [
    { first_name: "Ada", image_url: "", imageMediaPath: "xl/media/image1.png" },
    { first_name: "Blaise", image_url: "", imageMediaPath: null },
    { first_name: "Carl", image_url: "", imageMediaPath: "xl/media/gone.png" },
  ];
  const urls = new Map([["xl/media/image1.png", "https://cdn/1"]]);

  it("puts the uploaded URL on the row that carried the picture", () => {
    expect(buildBulkMembersList(rows, urls)[0].image_url).toBe("https://cdn/1");
  });

  it("leaves image_url empty for a row without a picture, or whose upload failed", () => {
    const list = buildBulkMembersList(rows, urls);
    expect(list[1].image_url).toBe("");
    expect(list[2].image_url).toBe("");
  });

  it("does not send the internal media path to the server", () => {
    buildBulkMembersList(rows, urls).forEach((row) =>
      expect(row).not.toHaveProperty("imageMediaPath")
    );
  });

  it("keeps every other field as parsed", () => {
    expect(buildBulkMembersList(rows, urls)[1]).toEqual({
      first_name: "Blaise",
      image_url: "",
    });
  });
});
