import { devitrakApi } from "../../../api/devitrakApi";

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
 */

/**
 * @param {{
 *   media: Map<string, {mediaPath: string, dataUrl: string}>,
 *   groups: Array<{category_name: string, item_group: string, imageMediaPath: string|null}>,
 *   user: object,
 *   onProgress?: (done: number, total: number) => void,
 * }} input
 * @returns {Promise<{urlByMediaPath: Map<string,string>, failed: Array<{mediaPath: string, reason: string}>}>}
 */
export const uploadImportImages = async ({
  media,
  groups = [],
  user,
  onProgress,
}) => {
  const urlByMediaPath = new Map();
  const failed = [];

  if (!media || media.size === 0) return { urlByMediaPath, failed };

  /* Which device group each file belongs to — it names the image in Cloudinary
     and is what the gallery searches on. */
  const groupByMediaPath = new Map();
  for (const group of groups) {
    if (group.imageMediaPath && !groupByMediaPath.has(group.imageMediaPath)) {
      groupByMediaPath.set(group.imageMediaPath, group);
    }
  }

  const companyMongoId = user?.companyData?.id;
  const files = [...media.values()];
  let done = 0;

  for (const file of files) {
    const group = groupByMediaPath.get(file.mediaPath);
    const categoryName = group?.category_name ?? "";
    const itemGroup = group?.item_group ?? "";

    try {
      const response = await devitrakApi.post("/cloudinary/upload-image", {
        imageFile: file.dataUrl,
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
        await devitrakApi.post("/image/new_image", {
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
