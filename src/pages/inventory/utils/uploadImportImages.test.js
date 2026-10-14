import { describe, expect, it, vi } from "vitest";

import {
  INVENTORY_PHOTO_MAX_PX,
  prepareImportImage,
  uploadImportImages,
  usedImportMedia,
} from "./uploadImportImages";

const file = (mediaPath, dataUrl = `data:image/jpeg;base64,${mediaPath}`) => ({
  mediaPath,
  dataUrl,
});

const media = (...paths) => new Map(paths.map((path) => [path, file(path)]));

const unit = (imageMediaPath, extra = {}) => ({
  category_name: "Audio",
  item_group: "Microphone",
  imageMediaPath,
  ...extra,
});

const okPost = () =>
  vi.fn((url) =>
    Promise.resolve(
      url === "/cloudinary/upload-image"
        ? { data: { imageUploaded: { secure_url: "https://res.cloudinary.com/x.jpg" } } }
        : { data: { ok: true } }
    )
  );

/* Every picture in the workbook used to be uploaded, including ones no unit
   points at: a picture on a skipped row, or in a column that is not Image.
   Each is Cloudinary storage nobody can reach. */
describe("usedImportMedia", () => {
  it("keeps only the files some unit points at", () => {
    const used = usedImportMedia(media("a.jpeg", "b.jpeg", "c.jpeg"), [
      unit("a.jpeg"),
      unit("a.jpeg"),
      unit(null),
      unit("c.jpeg"),
    ]);
    expect([...used.keys()]).toEqual(["a.jpeg", "c.jpeg"]);
  });

  it("is empty when there is nothing to upload", () => {
    expect(usedImportMedia(undefined, [unit("a.jpeg")]).size).toBe(0);
    expect(usedImportMedia(media("a.jpeg"), []).size).toBe(0);
  });
});

describe("prepareImportImage", () => {
  it("shrinks to the inventory size", async () => {
    const shrink = vi.fn(() => Promise.resolve("data:image/jpeg;base64,AA"));
    await prepareImportImage("data:image/png;base64,AAAAAAAA", shrink);
    /* reencode: a picture already under the size limit can still be several
       hundred KB of barely compressed JPEG — the mock workbook has one. */
    expect(shrink).toHaveBeenCalledWith("data:image/png;base64,AAAAAAAA", INVENTORY_PHOTO_MAX_PX, {
      reencode: true,
    });
  });

  it("uses the shrunk picture when it is smaller", async () => {
    const shrink = () => Promise.resolve("data:image/jpeg;base64,AA");
    expect(await prepareImportImage("data:image/png;base64,AAAAAAAA", shrink)).toBe(
      "data:image/jpeg;base64,AA"
    );
  });

  /* Re-encoding a small, well-compressed file can come out bigger. */
  it("keeps the original when re-encoding did not save anything", async () => {
    const original = "data:image/jpeg;base64,AA";
    const shrink = () => Promise.resolve("data:image/jpeg;base64,AAAAAAAA");
    expect(await prepareImportImage(original, shrink)).toBe(original);
  });
});

describe("uploadImportImages", () => {
  it("does not upload a picture no unit uses", async () => {
    const post = okPost();
    const { urlByMediaPath } = await uploadImportImages({
      media: media("used.jpeg", "orphan.jpeg"),
      units: [unit("used.jpeg")],
      user: { companyData: { id: "co" } },
      post,
      prepare: (dataUrl) => Promise.resolve(dataUrl),
    });

    const uploads = post.mock.calls.filter(([url]) => url === "/cloudinary/upload-image");
    expect(uploads).toHaveLength(1);
    expect([...urlByMediaPath.keys()]).toEqual(["used.jpeg"]);
  });

  it("uploads the prepared picture, not the one in the workbook", async () => {
    const post = okPost();
    await uploadImportImages({
      media: media("a.jpeg"),
      units: [unit("a.jpeg")],
      user: { companyData: { id: "co" } },
      post,
      prepare: () => Promise.resolve("data:image/jpeg;base64,SMALL"),
    });
    const [, body] = post.mock.calls.find(([url]) => url === "/cloudinary/upload-image");
    expect(body.imageFile).toBe("data:image/jpeg;base64,SMALL");
    expect(body.imageID).toBe("co_Audio_Microphone");
  });

  it("counts progress against what is actually uploaded", async () => {
    const onProgress = vi.fn();
    await uploadImportImages({
      media: media("a.jpeg", "orphan.jpeg"),
      units: [unit("a.jpeg")],
      user: { companyData: { id: "co" } },
      post: okPost(),
      prepare: (dataUrl) => Promise.resolve(dataUrl),
      onProgress,
    });
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it("a failed upload is reported and does not stop the others", async () => {
    const post = vi.fn((url, body) =>
      url === "/cloudinary/upload-image" && body.imageFile.endsWith("bad.jpeg")
        ? Promise.reject({ response: { data: { msg: "File too large" } } })
        : okPost()(url)
    );
    const { urlByMediaPath, failed } = await uploadImportImages({
      media: media("bad.jpeg", "good.jpeg"),
      units: [unit("bad.jpeg"), unit("good.jpeg")],
      user: { companyData: { id: "co" } },
      post,
      prepare: (dataUrl) => Promise.resolve(dataUrl),
    });
    expect(failed).toEqual([{ mediaPath: "bad.jpeg", reason: "File too large" }]);
    expect([...urlByMediaPath.keys()]).toEqual(["good.jpeg"]);
  });
});
