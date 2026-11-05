import { describe, expect, it } from "vitest";
import {
  NETWORK_ERROR_MESSAGE,
  userFacingError,
} from "./userFacingError";

const axiosError = (overrides = {}) => ({
  isAxiosError: true,
  message: "Request failed with status code 500",
  config: { headers: { "x-token": "secret-jwt" }, url: "/api/x" },
  ...overrides,
});

describe("userFacingError", () => {
  it("shows the server's msg", () => {
    const error = axiosError({ response: { status: 400, data: { msg: "Serial already in use." } } });
    expect(userFacingError(error)).toBe("Serial already in use.");
  });

  it("falls back to the server's message field", () => {
    const error = axiosError({ response: { status: 409, data: { message: "Duplicate member." } } });
    expect(userFacingError(error)).toBe("Duplicate member.");
  });

  it("never shows axios' own text for a server error without a message", () => {
    const error = axiosError({ response: { status: 500, data: {} } });
    expect(userFacingError(error, "Could not save.")).toBe("Could not save.");
  });

  it("says the server could not be reached when there is no response", () => {
    expect(userFacingError(axiosError({ message: "Network Error" }))).toBe(
      NETWORK_ERROR_MESSAGE
    );
  });

  it("never includes the request config or its headers", () => {
    const error = axiosError({ response: { status: 500, data: { error: { stack: "..." } } } });
    const shown = userFacingError(error);
    expect(shown).not.toContain("secret-jwt");
    expect(shown).not.toContain("/api/x");
    expect(shown).not.toContain("{");
  });

  it("ignores a server msg that is not text", () => {
    const error = axiosError({ response: { status: 400, data: { msg: { code: 7 } } } });
    expect(userFacingError(error, "Fallback.")).toBe("Fallback.");
  });

  it("shows the message of an error the app threw on purpose", () => {
    expect(userFacingError(new Error("Staff member not found."))).toBe(
      "Staff member not found."
    );
  });

  it("shows a plain string as is", () => {
    expect(userFacingError("Pick a location first.")).toBe("Pick a location first.");
  });

  it("uses the fallback for anything else", () => {
    expect(userFacingError({ weird: true }, "Fallback.")).toBe("Fallback.");
    expect(userFacingError(undefined, "Fallback.")).toBe("Fallback.");
    expect(userFacingError(new Error(""), "Fallback.")).toBe("Fallback.");
  });

  it("has a default fallback", () => {
    expect(userFacingError(null)).toMatch(/try again/i);
  });

  it("caps a very long message", () => {
    const long = "x".repeat(1000);
    expect(userFacingError(long).length).toBeLessThanOrEqual(300);
  });
});
