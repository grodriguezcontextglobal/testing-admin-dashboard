import { devitrakApi } from "../../../api/devitrakApi";

/**
 * Member photos placed inside the cells of the import spreadsheet (meeting
 * 2026-09-29 `14:56`: "the same thing as we did on the inventory").
 *
 * Reading them is the inventory's job, and it is reused as is
 * (`readWorkbookCellImages`). Uploading is not: the inventory uploader names a
 * file after a category and group and registers it in the device gallery. A
 * member photo belongs to one person, and during an import no member exists
 * yet to name it after.
 *
 * A school sheet can carry 2000+ rows with a photo on each, so the upload does
 * the least it can (2026-09-30):
 *
 * - **One upload per distinct picture, by content.** Not by the file Excel
 *   stored it in: the same photo pasted into two cells can be two files.
 * - **The Cloudinary id is that content hash**, `member_<company>_<hash>`.
 *   Re-importing a sheet overwrites its photos instead of piling up a copy of
 *   each; two different photos can never share an id, so one import cannot
 *   overwrite another member's photo. The hash is of the ORIGINAL picture, so
 *   the id does not depend on how a given browser shrinks it.
 * - **Each photo is shrunk first** (`prepare`, default `shrinkDataUrl`). That
 *   is where a large import spends its time and its Cloudinary storage.
 *
 * Cloudinary does not rate-limit the Upload API (only the Admin API), and the
 * uploads go one at a time, so the ceiling here is time and storage.
 *
 * A failed upload is not a failed import: those members are created without a
 * photo and the caller is told which files failed.
 */

/** Longest side of an uploaded member photo — an avatar, not a print. */
export const MEMBER_PHOTO_MAX_PX = 512;

/**
 * First 20 hex chars of the SHA-256 of a data URL's payload: short enough for
 * an id, far too long to collide within one company's photos.
 *
 * @param {string} dataUrl
 * @returns {Promise<string>}
 */
export const contentHash = async (dataUrl) => {
  const payload = String(dataUrl).slice(String(dataUrl).indexOf(",") + 1);
  const subtle = globalThis.crypto?.subtle;
  // Only in a secure context (https, localhost). Plain http gets the fallback
  // rather than an import that dies on its first picture.
  if (!subtle) return fallbackHash(payload);
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 20);
};

/**
 * Two independent 32-bit FNV-1a passes, 80 bits of hex — not cryptographic,
 * which an id does not need, but the same length and alphabet as the digest.
 */
const fallbackHash = (text) => {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ text.length;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193);
    b = Math.imul(b ^ code, 0x5bd1e995);
  }
  const hex = (n) => (n >>> 0).toString(16).padStart(8, "0");
  return (hex(a) + hex(b) + hex(Math.imul(a ^ b, 0x27d4eb2d))).slice(0, 20);
};

/** The size a photo is shrunk to: the longer side at `max`, never enlarged. */
export const fitWithin = (width, height, max) => {
  if (width <= max && height <= max) return { width, height };
  const scale = max / Math.max(width, height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
};

/**
 * Re-encodes a photo at MEMBER_PHOTO_MAX_PX as JPEG. Any failure — an
 * undecodable file, no canvas — returns the original: a photo uploaded at full
 * size is better than no photo.
 *
 * @param {string} dataUrl
 * @returns {Promise<string>}
 */
export const shrinkDataUrl = async (dataUrl, max = MEMBER_PHOTO_MAX_PX) => {
  try {
    const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
    if (width === bitmap.width && height === bitmap.height) return dataUrl;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    // JPEG has no transparency: without a fill, a transparent PNG turns black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return dataUrl;
  }
};

/**
 * @param {{
 *   media: Map<string, {mediaPath: string, dataUrl: string}>,
 *   companyId: number|string,
 *   post?: (url: string, body: object) => Promise<object>,
 *   prepare?: (dataUrl: string) => Promise<string>,
 *   now?: () => number,
 *   onProgress?: (done: number, total: number) => void,
 * }} input
 * @returns {Promise<{urlByMediaPath: Map<string, string>, failed: Array<{mediaPath: string, reason: string}>}>}
 */
export const uploadMemberImportImages = async ({
  media,
  companyId,
  post = (url, body) => devitrakApi.post(url, body),
  prepare = shrinkDataUrl,
  now = Date.now,
  onProgress,
}) => {
  const urlByMediaPath = new Map();
  const failed = [];
  if (!media || media.size === 0) return { urlByMediaPath, failed };

  /* Files grouped by what is in them. */
  const byHash = new Map();
  for (const file of media.values()) {
    const hash = await contentHash(file.dataUrl);
    if (!byHash.has(hash)) byHash.set(hash, { dataUrl: file.dataUrl, mediaPaths: [] });
    byHash.get(hash).mediaPaths.push(file.mediaPath);
  }

  const stamp = now();
  let done = 0;

  for (const [hash, picture] of byHash) {
    try {
      const response = await post("/cloudinary/upload-image", {
        imageFile: await prepare(picture.dataUrl),
        imageID: `member_${companyId}_${hash}`,
        tags: ["member_import", companyId],
        context: `company_sql_id:${companyId}|created_at:${stamp}|updated_at:${stamp}`,
      });
      const url = response?.data?.imageUploaded?.secure_url;
      if (!url) throw new Error("Upload returned no URL");
      picture.mediaPaths.forEach((mediaPath) => urlByMediaPath.set(mediaPath, url));
    } catch (error) {
      const reason = error?.response?.data?.msg ?? error?.message ?? "Upload failed";
      picture.mediaPaths.forEach((mediaPath) => failed.push({ mediaPath, reason }));
    } finally {
      done += 1;
      if (typeof onProgress === "function") onProgress(done, byHash.size);
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
