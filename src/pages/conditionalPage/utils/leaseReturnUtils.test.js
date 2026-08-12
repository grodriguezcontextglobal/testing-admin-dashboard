import { describe, it, expect } from "vitest";
import {
  isChargeableOutcome,
  buildFeeFields,
  shouldOfferFeeCollection,
  buildLostItemPayload,
  buildReturnNotification,
  RETURN_NOTIFICATION_ENDPOINT,
  INCIDENT_NOTIFICATION_ENDPOINT,
} from "./leaseReturnUtils";

const record = {
  device_serial_number: "SN-1",
  device_category_name: "Laptop",
  device_item_group: "Chromebook",
  device_id: 900,
  member_id: 158,
};

describe("buildLostItemPayload — el equipo perdido NO vuelve al almacén", () => {
  const payload = buildLostItemPayload({ record, companyId: 62 });

  // El bug que esto corrige: declarar perdido no tocaba el inventario, así que
  // el equipo quedaba "assigned" para siempre aunque el lease ya estaba cerrado.
  it("marca logistic_status lost", () => {
    expect(payload.logistic_status).toBe("lost");
  });

  it("mantiene warehouse en 0 — un equipo perdido no se puede restockear", () => {
    expect(payload.warehouse).toBe(0);
  });

  it("identifica el equipo igual que el resto del flujo", () => {
    expect(payload).toMatchObject({
      company_id: 62,
      item_group: "Chromebook",
      category_name: "Laptop",
      data: ["SN-1"],
    });
  });

  it("devuelve null cuando no hay serial que actualizar", () => {
    expect(buildLostItemPayload({ record: {}, companyId: 62 })).toBeNull();
    expect(buildLostItemPayload({ companyId: 62 })).toBeNull();
    expect(buildLostItemPayload({ record, companyId: null })).toBeNull();
  });
});

describe("buildReturnNotification — a un menor se le avisa al guardián", () => {
  const adult = { first_name: "Ada", last_name: "L", email: "ada@s.edu", minor: 0 };
  const teen = {
    first_name: "Blaise",
    last_name: "P",
    email: "teen@s.edu",
    minor: 1,
    parent_guardian_email: "parent@home.com",
  };

  // El bug reportado: el aviso de equipo perdido llegaba al estudiante de 15
  // años en lugar de a su representante.
  it("manda el correo al guardián cuando el miembro es menor", () => {
    const { payload, recipient } = buildReturnNotification({ member: teen, record });
    expect(payload.member.email).toBe("parent@home.com");
    expect(recipient.isGuardian).toBe(true);
  });

  it("no usa el correo del estudiante aunque exista", () => {
    const { payload } = buildReturnNotification({ member: teen, record });
    expect(payload.member.email).not.toBe("teen@s.edu");
  });

  it("manda el correo al miembro adulto directamente", () => {
    const { payload, recipient } = buildReturnNotification({ member: adult, record });
    expect(payload.member.email).toBe("ada@s.edu");
    expect(recipient.isGuardian).toBe(false);
  });

  it("conserva el nombre del estudiante en el cuerpo, no el del guardián", () => {
    const { payload } = buildReturnNotification({ member: teen, record });
    expect(payload.member.firstName).toBe("Blaise");
    expect(payload.member.lastName).toBe("P");
  });

  it("describe el equipo devuelto", () => {
    const { payload } = buildReturnNotification({ member: adult, record });
    expect(payload.devices).toEqual([
      { device: { serialNumber: "SN-1", deviceType: "Laptop" } },
    ]);
  });

  // Sin destinatario resoluble no se manda nada: mandarlo al menor sería
  // exactamente el bug que se está corrigiendo.
  it("no arma payload cuando el menor no tiene guardián en ficha", () => {
    const { payload, recipient } = buildReturnNotification({
      member: { ...teen, parent_guardian_email: "" },
      record,
    });
    expect(payload).toBeNull();
    expect(recipient.error).toMatch(/guardian/i);
  });

  it("no arma payload sin miembro", () => {
    expect(buildReturnNotification({ record }).payload).toBeNull();
    expect(buildReturnNotification({}).payload).toBeNull();
  });
});

// El bug reportado en prueba manual: al declarar un equipo PERDIDO, el guardián
// recibió el correo de "devolución exitosa". El payload y el endpoint eran los
// mismos para los tres outcomes, así que el backend no tenía forma de elegir
// otra plantilla. Decirle a una familia que el equipo volvió bien cuando se
// perdió no es solo un correo feo: queda como constancia de una devolución que
// nunca ocurrió.
describe("buildReturnNotification — el aviso distingue devolución de incidente", () => {
  const adult = { first_name: "Ada", last_name: "L", email: "ada@s.edu", minor: 0 };

  it("una devolución normal sigue usando el endpoint (y payload) que ya existe", () => {
    const { endpoint, payload } = buildReturnNotification({
      member: adult,
      record,
      outcome: "returned",
    });
    expect(endpoint).toBe(RETURN_NOTIFICATION_ENDPOINT);
    expect(payload.outcome).toBeUndefined();
  });

  it("sin outcome se asume devolución — no inventa un incidente", () => {
    expect(buildReturnNotification({ member: adult, record }).endpoint).toBe(
      RETURN_NOTIFICATION_ENDPOINT
    );
  });

  it("perdido y dañado van al aviso de incidente, no al de devolución", () => {
    ["lost", "damaged"].forEach((outcome) => {
      const { endpoint } = buildReturnNotification({
        member: adult,
        record,
        outcome,
      });
      expect(endpoint).toBe(INCIDENT_NOTIFICATION_ENDPOINT);
      expect(endpoint).not.toBe(RETURN_NOTIFICATION_ENDPOINT);
    });
  });

  it("el incidente lleva outcome, etiqueta legible y nota de condición", () => {
    const { payload } = buildReturnNotification({
      member: adult,
      record,
      outcome: "lost",
      note: "Reportado perdido el 6/2",
    });
    expect(payload.outcome).toBe("lost");
    expect(payload.outcomeLabel).toBe("Declared lost — device not recovered");
    expect(payload.conditionNote).toBe("Reportado perdido el 6/2");
  });

  it("informa el monto de la multa solo cuando se registró una", () => {
    const withFee = buildReturnNotification({
      member: adult,
      record,
      outcome: "lost",
      fee: { fee_amount: 250, fee_reason: "Not recovered" },
    });
    expect(withFee.payload.feeAmount).toBe(250);

    const withoutFee = buildReturnNotification({
      member: adult,
      record,
      outcome: "lost",
      fee: {},
    });
    expect(withoutFee.payload.feeAmount).toBeNull();
  });

  it("el destinatario del incidente se resuelve igual: guardián si es menor", () => {
    const { payload, recipient } = buildReturnNotification({
      member: {
        first_name: "Blaise",
        last_name: "P",
        email: "teen@s.edu",
        minor: 1,
        parent_guardian_email: "parent@home.com",
      },
      record,
      outcome: "lost",
    });
    expect(payload.member.email).toBe("parent@home.com");
    expect(recipient.isGuardian).toBe(true);
  });

  it("sin destinatario resoluble no hay endpoint que llamar", () => {
    const { endpoint, payload } = buildReturnNotification({
      member: { minor: 1, parent_guardian_email: "" },
      record,
      outcome: "lost",
    });
    expect(payload).toBeNull();
    expect(endpoint).toBeNull();
  });
});

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
