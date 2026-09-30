import { devitrakApi } from "../../../api/devitrakApi";

/**
 * Member photos placed inside the cells of the import spreadsheet (meeting
 * 2026-09-29 `14:56`: "the same thing as we did on the inventory").
 *
 * Reading them is the inventory's job, and it is reused as is
 * (`readWorkbookCellImages`). Uploading is not: the inventory uploader names a
 * file after a category and group and registers it in the device gallery. A
 * member photo is named after the member, and during an import no member
 * exists yet.
 *
 * So each import gets an id prefix of its own, `member_import_<company>_<time>`.
 * A fixed name like `<company>_image1` would let the next import overwrite, in
 * Cloudinary, the photo of every member the previous import created — they all
 * point at the same URL.
 *
 * Like the inventory, a failed upload is not a failed import: the member is
 * created without a photo and the caller is told which files failed.
 */

const fileStem = (mediaPath) =>
  String(mediaPath).split("/").pop().replace(/\.[^.]+$/, "");

/**
 * @param {{
 *   media: Map<string, {mediaPath: string, dataUrl: string}>,
 *   companyId: number|string,
 *   post?: (url: string, body: object) => Promise<object>,
 *   now?: () => number,
 *   onProgress?: (done: number, total: number) => void,
 * }} input
 * @returns {Promise<{urlByMediaPath: Map<string, string>, failed: Array<{mediaPath: string, reason: string}>}>}
 */
export const uploadMemberImportImages = async ({
  media,
  companyId,
  post = (url, body) => devitrakApi.post(url, body),
  now = Date.now,
  onProgress,
}) => {
  const urlByMediaPath = new Map();
  const failed = [];
  if (!media || media.size === 0) return { urlByMediaPath, failed };

  const stamp = now();
  const files = [...media.values()];
  let done = 0;

  for (const file of files) {
    try {
      const response = await post("/cloudinary/upload-image", {
        imageFile: file.dataUrl,
        imageID: `member_import_${companyId}_${stamp}_${fileStem(file.mediaPath)}`,
        tags: ["member_import", companyId],
        context: `company_sql_id:${companyId}|created_at:${stamp}|updated_at:${stamp}`,
      });
      const url = response?.data?.imageUploaded?.secure_url;
      if (!url) throw new Error("Upload returned no URL");
      urlByMediaPath.set(file.mediaPath, url);
    } catch (error) {
      failed.push({
        mediaPath: file.mediaPath,
        reason: error?.response?.data?.msg ?? error?.message ?? "Upload failed",
      });
    } finally {
      done += 1;
      if (typeof onProgress === "function") onProgress(done, files.length);
    }
  }

  return { urlByMediaPath, failed };
};

/**
 * The `list` for `/db_member/bulk-members`: each row with the URL its picture
 * was uploaded to, and without the internal `imageMediaPath`.
 *
 * @param {object[]} rows validateAndNormalizeRows(...).rows
 * @param {Map<string, string>} urlByMediaPath
 * @returns {object[]}
 */
export const buildBulkMembersList = (rows = [], urlByMediaPath = new Map()) =>
  rows.map(({ imageMediaPath, ...row }) => ({
    ...row,
    image_url: imageMediaPath ? (urlByMediaPath.get(imageMediaPath) ?? "") : "",
  }));
