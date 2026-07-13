import * as yup from "yup";

/**
 * Pure logic for EditProfileModal — extracted so it can be unit-tested and so
 * the modal component stays presentational. See design.md + TDD methodology.
 */

export const MAX_IMAGE_BYTES = 1048576; // 1 MB

export const editProfileSchema = yup.object({
  firstName: yup.string().trim().required("First name is required"),
  lastName: yup.string().trim().required("Last name is required"),
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
  phone: yup.string().trim().nullable(),
});

/**
 * Validates the react-hook-form file list. Bug fix: tolerate the case where no
 * new image was selected (the old code read `data.image[0].size` and crashed).
 */
export const validateImageSize = (fileList, maxBytes = MAX_IMAGE_BYTES) => {
  const file = fileList?.[0];
  if (!file) return { valid: true, hasImage: false };
  if (file.size > maxBytes) {
    return {
      valid: false,
      hasImage: true,
      error:
        "Image is bigger than allowed. Please resize the image or select a new one.",
    };
  }
  return { valid: true, hasImage: true };
};

/** Converts a File/Blob to a base64 data URL (async, DOM-dependent). */
export const convertToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

/** PATCH payload for /admin/admin-user/:id. Omits imageProfile if unchanged. */
export const buildAdminUserPayload = (data, base64) => {
  const payload = {
    name: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
  };
  if (base64) payload.imageProfile = base64;
  return payload;
};

/** Updated staffDetail profile object for onAddStaffProfile. */
export const buildStaffProfileUpdate = (profile, data, base64) => ({
  ...profile,
  name: data.firstName,
  lastName: data.lastName,
  email: data.email,
  phone: data.phone,
  ...(base64 ? { imageProfile: base64 } : {}),
});

/**
 * Updated admin user object for onLogin. Bug fix: the old code set `name` from
 * `data.name` (always undefined — the form field is `firstName`).
 */
export const buildLoginUpdate = (user, data, base64) => ({
  ...user,
  data: {
    ...user.data,
    name: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    ...(base64 ? { imageProfile: base64 } : {}),
  },
  name: data.firstName,
  lastName: data.lastName,
  email: data.email,
  phone: data.phone,
});
