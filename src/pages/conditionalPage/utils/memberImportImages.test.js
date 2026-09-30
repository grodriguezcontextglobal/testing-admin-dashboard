import { describe, expect, it, vi } from "vitest";
import {
  buildBulkMembersList,
  uploadMemberImportImages,
} from "./memberImportImages";

/**
 * Pictures placed inside the cells of the member spreadsheet (meeting
 * 2026-09-29 `14:56`, "the same thing as we did on the inventory").
 *
 * The workbook reader is the inventory one. What differs is the upload: a
 * member picture is named after the member in Cloudinary, and during an import
 * no member exists yet. So each import gets its own id prefix — a fixed name
 * like `<company>_image1` would let the next import overwrite the pictures of
 * every member created by the last one.
 */

const media = new Map([
  ["xl/media/image1.png", { mediaPath: "xl/media/image1.png", dataUrl: "data:image/png;base64,AAA" }],
  ["xl/media/image2.jpeg", { mediaPath: "xl/media/image2.jpeg", dataUrl: "data:image/jpeg;base64,BBB" }],
]);

const okPost = () =>
  vi.fn(async (_url, body) => ({
    data: { imageUploaded: { secure_url: `https://cdn/${body.imageID}` } },
  }));

describe("uploadMemberImportImages", () => {
  it("uploads each distinct file once", async () => {
    const post = okPost();
    const { urlByMediaPath, failed } = await uploadMemberImportImages({
      media,
      companyId: 62,
      post,
      now: () => 1700000000000,
    });
    expect(post).toHaveBeenCalledTimes(2);
    expect(failed).toEqual([]);
    expect(urlByMediaPath.get("xl/media/image1.png")).toBe(
      "https://cdn/member_import_62_1700000000000_image1"
    );
  });

  it("sends the member-photo shape to the same endpoint as a manual upload", async () => {
    const post = okPost();
    await uploadMemberImportImages({ media, companyId: 62, post, now: () => 5 });
    const [url, body] = post.mock.calls[0];
    expect(url).toBe("/cloudinary/upload-image");
    expect(body).toMatchObject({
      imageFile: "data:image/png;base64,AAA",
      imageID: "member_import_62_5_image1",
      tags: ["member_import", 62],
    });
    expect(body.context).toMatch(/^company_sql_id:62\|created_at:5\|updated_at:5$/);
  });

  it("gives two imports different names, so one cannot overwrite the other", async () => {
    const first = okPost();
    const second = okPost();
    await uploadMemberImportImages({ media, companyId: 62, post: first, now: () => 1 });
    await uploadMemberImportImages({ media, companyId: 62, post: second, now: () => 2 });
    expect(first.mock.calls[0][1].imageID).not.toBe(second.mock.calls[0][1].imageID);
  });

  /* A member without a photo is still a member. Failing the import over one
     picture would make a school re-enter 300 students for it. */
  it("reports a failed upload instead of failing the import", async () => {
    const post = vi
      .fn()
      .mockRejectedValueOnce({ response: { data: { msg: "Too large" } } })
      .mockResolvedValueOnce({ data: { imageUploaded: { secure_url: "https://cdn/2" } } });
    const { urlByMediaPath, failed } = await uploadMemberImportImages({
      media,
      companyId: 62,
      post,
      now: () => 1,
    });
    expect(failed).toEqual([{ mediaPath: "xl/media/image1.png", reason: "Too large" }]);
    expect(urlByMediaPath.get("xl/media/image2.jpeg")).toBe("https://cdn/2");
  });

  it("counts an answer with no URL as a failure", async () => {
    const post = vi.fn(async () => ({ data: {} }));
    const { failed } = await uploadMemberImportImages({
      media: new Map([...media].slice(0, 1)),
      companyId: 62,
      post,
    });
    expect(failed).toHaveLength(1);
  });

  it("does nothing for a workbook without pictures", async () => {
    const post = okPost();
    const result = await uploadMemberImportImages({ media: new Map(), companyId: 62, post });
    expect(post).not.toHaveBeenCalled();
    expect(result.urlByMediaPath.size).toBe(0);
  });

  it("reports progress file by file", async () => {
    const onProgress = vi.fn();
    await uploadMemberImportImages({ media, companyId: 62, post: okPost(), onProgress });
    expect(onProgress.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
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
