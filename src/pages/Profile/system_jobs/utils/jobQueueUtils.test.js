import { describe, it, expect } from "vitest";
import { isValidJobId, getJobStatusMeta } from "./jobQueueUtils";

// ─── isValidJobId ──────────────────────────────────────────────────────────────

describe("isValidJobId", () => {
  it("acepta un ObjectId válido de 24 caracteres hexadecimales", () => {
    expect(isValidJobId("507f1f77bcf86cd799439011")).toBe(true);
  });

  it("acepta mayúsculas hexadecimales", () => {
    expect(isValidJobId("507F1F77BCF86CD799439011")).toBe(true);
  });

  it("rechaza un string más corto de 24 caracteres", () => {
    expect(isValidJobId("507f1f77bcf86cd79943901")).toBe(false);
  });

  it("rechaza un string más largo de 24 caracteres", () => {
    expect(isValidJobId("507f1f77bcf86cd7994390111")).toBe(false);
  });

  it("rechaza caracteres no hexadecimales", () => {
    expect(isValidJobId("507f1f77bcf86cd79943901g")).toBe(false);
  });

  it("rechaza vacío, null o undefined", () => {
    expect(isValidJobId("")).toBe(false);
    expect(isValidJobId(null)).toBe(false);
    expect(isValidJobId(undefined)).toBe(false);
  });

  it("ignora espacios en blanco alrededor", () => {
    expect(isValidJobId("  507f1f77bcf86cd799439011  ")).toBe(true);
  });
});

// ─── getJobStatusMeta ──────────────────────────────────────────────────────────

describe("getJobStatusMeta", () => {
  it("pending -> label y color de espera", () => {
    expect(getJobStatusMeta("pending")).toEqual({ label: "Pending", color: "default" });
  });

  it("processing -> label y color en progreso", () => {
    expect(getJobStatusMeta("processing")).toEqual({ label: "Processing", color: "blue" });
  });

  it("done -> label y color de éxito", () => {
    expect(getJobStatusMeta("done")).toEqual({ label: "Done", color: "green" });
  });

  it("failed -> label y color de error", () => {
    expect(getJobStatusMeta("failed")).toEqual({ label: "Failed", color: "orange" });
  });

  it("dead -> label y color de error terminal", () => {
    expect(getJobStatusMeta("dead")).toEqual({ label: "Dead", color: "red" });
  });

  it("status desconocido -> fallback neutro usando el valor crudo como label", () => {
    expect(getJobStatusMeta("something-else")).toEqual({ label: "something-else", color: "default" });
  });

  it("status vacío o ausente -> fallback neutro con label vacío", () => {
    expect(getJobStatusMeta(undefined)).toEqual({ label: "—", color: "default" });
    expect(getJobStatusMeta(null)).toEqual({ label: "—", color: "default" });
    expect(getJobStatusMeta("")).toEqual({ label: "—", color: "default" });
  });
});
