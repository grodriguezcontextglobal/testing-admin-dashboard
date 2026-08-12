import { describe, it, expect } from "vitest";
import {
  isChargeableOutcome,
  buildFeeFields,
  shouldOfferFeeCollection,
} from "./leaseReturnUtils";

describe("shouldOfferFeeCollection", () => {
  it("true cuando buildFeeFields produjo un monto positivo", () => {
    expect(
      shouldOfferFeeCollection(
        buildFeeFields({ outcome: "lost", feeAmount: 250 })
      )
    ).toBe(true);
  });

  // El caso que importa: un retorno normal no debe abrirle un formulario de
  // pago a quien solo estaba registrando una devolución.
  it("false para el objeto vacío que devuelve un retorno sin cargo", () => {
    expect(
      shouldOfferFeeCollection(buildFeeFields({ outcome: "returned" }))
    ).toBe(false);
    expect(
      shouldOfferFeeCollection(buildFeeFields({ outcome: "lost", feeAmount: 0 }))
    ).toBe(false);
    expect(shouldOfferFeeCollection({})).toBe(false);
  });

  it("false sin argumento o con un monto inutilizable", () => {
    for (const bad of [undefined, null, { fee_amount: "" }, { fee_amount: "x" }, { fee_amount: -5 }]) {
      expect(shouldOfferFeeCollection(bad)).toBe(false);
    }
  });
});

describe("isChargeableOutcome", () => {
  it("true para damaged/lost", () => {
    expect(isChargeableOutcome("damaged")).toBe(true);
    expect(isChargeableOutcome("lost")).toBe(true);
  });
  it("false para returned y desconocidos", () => {
    expect(isChargeableOutcome("returned")).toBe(false);
    expect(isChargeableOutcome(undefined)).toBe(false);
  });
});

describe("buildFeeFields", () => {
  it("no cobra en un retorno normal (returned)", () => {
    expect(buildFeeFields({ outcome: "returned", feeAmount: 50 })).toEqual({});
  });

  it("emite fee para damaged/lost con monto positivo", () => {
    expect(buildFeeFields({ outcome: "lost", feeAmount: 250, feeReason: "Not recovered" })).toEqual({
      fee_amount: 250,
      fee_reason: "Not recovered",
    });
    expect(buildFeeFields({ outcome: "damaged", feeAmount: "75.5" })).toEqual({
      fee_amount: 75.5,
      fee_reason: "damaged",
    });
  });

  it("no cobra si el monto es 0, vacío o no numérico", () => {
    expect(buildFeeFields({ outcome: "lost", feeAmount: 0 })).toEqual({});
    expect(buildFeeFields({ outcome: "lost", feeAmount: "" })).toEqual({});
    expect(buildFeeFields({ outcome: "lost", feeAmount: "abc" })).toEqual({});
    expect(buildFeeFields({ outcome: "damaged", feeAmount: -10 })).toEqual({});
  });

  it("usa el outcome como razón cuando no hay nota", () => {
    expect(buildFeeFields({ outcome: "damaged", feeAmount: 20 }).fee_reason).toBe("damaged");
  });

  it("tolera args vacíos", () => {
    expect(buildFeeFields()).toEqual({});
    expect(buildFeeFields({})).toEqual({});
  });
});
