import { describe, it, expect } from "vitest";
import { isDocumentExpired } from "./documentExpirationUtils";

describe("isDocumentExpired", () => {
  it("retorna false cuando no hay expiration_date", () => {
    expect(isDocumentExpired(null)).toBe(false);
    expect(isDocumentExpired(undefined)).toBe(false);
    expect(isDocumentExpired("")).toBe(false);
  });

  it("retorna false cuando expiration_date es una fecha inválida", () => {
    expect(isDocumentExpired("not-a-date")).toBe(false);
  });

  it("retorna true cuando expiration_date ya pasó", () => {
    expect(
      isDocumentExpired("2020-01-01T00:00:00.000Z", new Date("2026-08-04T00:00:00.000Z"))
    ).toBe(true);
  });

  it("retorna false cuando expiration_date es en el futuro", () => {
    expect(
      isDocumentExpired("2030-01-01T00:00:00.000Z", new Date("2026-08-04T00:00:00.000Z"))
    ).toBe(false);
  });

  it("retorna true cuando expiration_date es exactamente ahora", () => {
    const now = new Date("2026-08-04T00:00:00.000Z");
    expect(isDocumentExpired("2026-08-04T00:00:00.000Z", now)).toBe(true);
  });

  it("usa la fecha actual real cuando no se pasa referenceDate", () => {
    expect(isDocumentExpired("2000-01-01T00:00:00.000Z")).toBe(true);
    expect(isDocumentExpired("2999-01-01T00:00:00.000Z")).toBe(false);
  });
});
