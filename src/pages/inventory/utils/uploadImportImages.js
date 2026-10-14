import { devitrakApi } from "../../../api/devitrakApi";
import { shrinkDataUrl } from "../../conditionalPage/utils/memberImportImages";

/**
 * The pictures taken out of the spreadsheet, turned into URLs the item rows
 * can hold.
 *
 * Once per distinct file, not once per row that shows it. In the workbook this
 * was built against, 87 cells carry a picture and four files back them — one
 * per device group, repeated down the column — so uploading per cell would be
 * 87 round trips to say four things.
 *
 * The upload mirrors `storeAndGenerateImageUrl` in BulkItemActionsOptions: the
 * same `imageID` of company + category + group, the same tags and context, and
 * the same follow-up registration in `/image/new_image`. That is what makes an
 * imported picture show up wherever a manually added one would, instead of
 * being a URL only the item row knows about.
 *
 * A failed upload is not a failed import. The unit is created without a
 * picture and the caller is told which ones — a device with no photo is a
 * device you can still hand out, and re-uploading one image later is a much
 * smaller job than re-importing 500 rows.
 *
 * 2026-10-14, to spend less Cloudinary storage and upload time:
 *
 * - **Only the pictures a unit uses.** Every picture in the workbook used to
 *   go up, including one on a skipped row or in a column that is not Image —
 *   storage that no item points at.
 * - **Shrunk first** (`prepare`, default `prepareImportImage`): the longer side
 *   at INVENTORY_PHOTO_MAX_PX, re-encoded as JPEG by the members importer's
 *   `shrinkDataUrl` — also when it is already under that size, since a
 *   1280 px JPEG in the mock workbook is 650 KB. A phone photo is several MB; a device photo shown in the
 *   dashboard does not need that.
 */

/** Longest side of an uploaded device photo: detail view, not print. */
export const INVENTORY_PHOTO_MAX_PX = 1600;

/** The workbook's pictures that at least one unit points at. */
export const usedImportMedia = (media, units = []) => {
  const used = new Set(
    (Array.isArray(units) ? units : []).map((unit) => unit?.imageMediaPath).filter(Boolean)
  );
  return new Map([...(media ?? new Map())].filter(([mediaPath]) => used.has(mediaPath)));
};

/**
 * The picture as it is uploaded: shrunk, unless re-encoding came out no smaller
 * (a small, already compressed file can). `shrinkDataUrl` returns the original
 * on any failure, so this never loses a picture.
 */
export const prepareImportImage = async (dataUrl, shrink = shrinkDataUrl) => {
  const shrunk = await shrink(dataUrl, INVENTORY_PHOTO_MAX_PX, { reencode: true });
  return typeof shrunk === "string" && shrunk.length < dataUrl.length ? shrunk : dataUrl;
};

/**
 * @param {{
 *   media: Map<string, {mediaPath: string, dataUrl: string}>,
 *   units: Array<{category_name: string, item_group: string, imageMediaPath: string|null}>,
 *   user: object,
 *   post?: (url: string, body: object) => Promise<object>,
 *   prepare?: (dataUrl: string) => Promise<string>,
 *   onProgress?: (done: number, total: number) => void,
 * }} input
 * @returns {Promise<{urlByMediaPath: Map<string,string>, failed: Array<{mediaPath: string, reason: string}>}>}
 */
export const uploadImportImages = async ({
  media,
  units = [],
  user,
  post = (url, body) => devitrakApi.post(url, body),
  prepare = prepareImportImage,
  onProgress,
}) => {
  const urlByMediaPath = new Map();
  const failed = [];

  if (!media || media.size === 0) return { urlByMediaPath, failed };

  /* Which device each file belongs to — it names the image in Cloudinary and is
     what the gallery searches on. The first unit carrying a picture decides;
     the file this was built against never had two devices share one. */
  const unitByMediaPath = new Map();
  for (const unit of units) {
    if (unit.imageMediaPath && !unitByMediaPath.has(unit.imageMediaPath)) {
      unitByMediaPath.set(unit.imageMediaPath, unit);
    }
  }

  const companyMongoId = user?.companyData?.id;
  const files = [...usedImportMedia(media, units).values()];
  let done = 0;

  for (const file of files) {
    const owner = unitByMediaPath.get(file.mediaPath);
    const categoryName = owner?.category_name ?? "";
    const itemGroup = owner?.item_group ?? "";

    try {
      const response = await post("/cloudinary/upload-image", {
        imageFile: await prepare(file.dataUrl),
        imageID: `${companyMongoId}_${categoryName}_${itemGroup}`,
        tags: JSON.stringify([companyMongoId, itemGroup, categoryName]),
        context: `category_name:${categoryName}|group_name:${itemGroup}|created_at:${Date.now()}|updated_at:${Date.now()}`,
      });

      const url = response.data?.imageUploaded?.secure_url;
      if (!url) throw new Error("Upload returned no URL");

      urlByMediaPath.set(file.mediaPath, url);

      /* Registration is a convenience, not the upload. A failure here leaves
         the picture on the item and out of the gallery, which is worth
         swallowing rather than losing the URL we just obtained. */
      try {
        await post("/image/new_image", {
          source: url,
          category: categoryName,
          item_group: itemGroup,
          company: companyMongoId,
        });
      } catch (error) {
        console.error("uploadImportImages: gallery registration failed", error);
      }
    } catch (error) {
      console.error("uploadImportImages", file.mediaPath, error);
      failed.push({
        mediaPath: file.mediaPath,
        reason: error?.response?.data?.msg ?? error.message ?? "Upload failed",
      });
    } finally {
      done += 1;
      if (typeof onProgress === "function") onProgress(done, files.length);
    }
  }

  return { urlByMediaPath, failed };
};

export default uploadImportImages;
