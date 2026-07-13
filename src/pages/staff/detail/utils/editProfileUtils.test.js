import { describe, it, expect } from "vitest";
import {
  editProfileSchema,
  validateImageSize,
  buildAdminUserPayload,
  buildStaffProfileUpdate,
  buildLoginUpdate,
  MAX_IMAGE_BYTES,
} from "./editProfileUtils";

// ─── editProfileSchema ──────────────────────────────────────────────────────

const validForm = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@devitrak.com",
  phone: "+1 415 555 0172",
};

describe("editProfileSchema", () => {
  it("acepta un formulario válido", () => {
    expect(editProfileSchema.isValidSync(validForm)).toBe(true);
  });

  it("rechaza email inválido", () => {
    expect(editProfileSchema.isValidSync({ ...validForm, email: "not-an-email" })).toBe(false);
  });

  it("rechaza nombre o apellido vacíos", () => {
    expect(editProfileSchema.isValidSync({ ...validForm, firstName: "" })).toBe(false);
    expect(editProfileSchema.isValidSync({ ...validForm, lastName: "  " })).toBe(false);
  });

  it("permite phone vacío (opcional)", () => {
    expect(editProfileSchema.isValidSync({ ...validForm, phone: "" })).toBe(true);
  });
});

// ─── validateImageSize (bug #1: no crashear sin archivo) ──────────────────────

describe("validateImageSize", () => {
  it("es válido y sin imagen cuando no se seleccionó archivo", () => {
    expect(validateImageSize(undefined)).toEqual({ valid: true, hasImage: false });
    expect(validateImageSize([])).toEqual({ valid: true, hasImage: false });
  });

  it("es válido con imagen bajo el límite", () => {
    const result = validateImageSize([{ size: 500 * 1024 }]);
    expect(result.valid).toBe(true);
    expect(result.hasImage).toBe(true);
  });

  it("es inválido con imagen sobre el límite de 1MB", () => {
    const result = validateImageSize([{ size: MAX_IMAGE_BYTES + 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/bigger than allowed/i);
  });
});

// ─── buildAdminUserPayload ────────────────────────────────────────────────────

describe("buildAdminUserPayload", () => {
  it("mapea firstName al campo name del backend", () => {
    const payload = buildAdminUserPayload(validForm, "data:base64");
    expect(payload).toEqual({
      name: "Ada",
      lastName: "Lovelace",
      email: "ada@devitrak.com",
      phone: "+1 415 555 0172",
      imageProfile: "data:base64",
    });
  });

  it("omite imageProfile cuando no hay base64 (no sobreescribe la foto actual)", () => {
    const payload = buildAdminUserPayload(validForm, null);
    expect(payload).not.toHaveProperty("imageProfile");
  });
});

// ─── buildStaffProfileUpdate ──────────────────────────────────────────────────

describe("buildStaffProfileUpdate", () => {
  it("preserva el resto del profile y actualiza los campos editados", () => {
    const profile = { id: "p1", role: "admin", imageProfile: "old" };
    const result = buildStaffProfileUpdate(profile, validForm, "new64");
    expect(result).toMatchObject({
      id: "p1",
      role: "admin",
      name: "Ada",
      lastName: "Lovelace",
      email: "ada@devitrak.com",
      imageProfile: "new64",
    });
  });

  it("conserva la imagen previa cuando no hay base64 nuevo", () => {
    const profile = { id: "p1", imageProfile: "old" };
    const result = buildStaffProfileUpdate(profile, validForm, null);
    expect(result.imageProfile).toBe("old");
  });
});

// ─── buildLoginUpdate (bug #2: usar firstName, no data.name) ───────────────────

describe("buildLoginUpdate", () => {
  it("usa firstName para el name (corrige el undefined del bug)", () => {
    const user = { token: "t", data: { id: "u1", extra: 1 } };
    const result = buildLoginUpdate(user, validForm, "b64");
    expect(result.name).toBe("Ada");
    expect(result.data.name).toBe("Ada");
    expect(result.data.extra).toBe(1);
    expect(result.token).toBe("t");
  });
});
