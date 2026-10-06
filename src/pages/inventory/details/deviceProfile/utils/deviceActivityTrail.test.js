import { describe, expect, it } from "vitest";
import { buildActivityTimeline, mergeDeviceTimeline } from "./deviceActivityTrail";

/**
 * 2b.7, pedido en la reunión del 29-09 (`1:08:32`): quién hizo qué y cuándo
 * sobre cada dispositivo, "con un formato común para todos los audit trails
 * de la app", enseñando el historial de auditoría de una factura de QuickBooks
 * como referencia.
 *
 * El historial del dispositivo salía solo de las tablas SQL de custodia, que
 * dicen a quién se le entregó pero **no quién lo entregó**. Desde el
 * 2026-10-05 el servidor audita toda escritura, y desde el 05-10 el reporte
 * acepta `?serial_number=`, así que ya se puede saber.
 *
 * Las frases salen de `staffActivityLogUtils`, el mismo vocabulario que la
 * bitácora de staff: dos audit trails que dijeran lo mismo con otras palabras
 * serían dos formatos, que es lo que Fredrik pidió evitar.
 */
const log = (overrides = {}) => ({
  id: "log-1",
  staff_member_id: { _id: "s1", name: "Gustavo", lastName: "Santeliz", email: "g@x.com" },
  action: "UPDATE",
  target_model: "Device",
  context: { serial_numbers: ["SN-100006"], event_name: "TEST _ 2" },
  details: {
    route: "PATCH /api/receiver/receivers-pool-update/:id",
    status: 201,
    request: { activity: false },
  },
  timestamp: "2026-10-05T19:05:54.633Z",
  ...overrides,
});

describe("buildActivityTimeline", () => {
  it("dice quién lo hizo, que es lo que la custodia no sabe", () => {
    const [entry] = buildActivityTimeline([log()]);
    expect(entry).toMatchObject({
      kind: "activity",
      personLabel: "Gustavo Santeliz",
      date: "2026-10-05T19:05:54.633Z",
    });
  });

  it("usa la misma frase que la bitácora de staff", () => {
    expect(buildActivityTimeline([log()])[0].title).toBe("Returned a device");
  });

  it("lleva el contexto que identifica la acción", () => {
    expect(buildActivityTimeline([log()])[0].detail).toContain("TEST _ 2");
  });

  /* Los borrados de caché los escribe la máquina y no los entiende nadie: no
     entran aquí tampoco. */
  it("deja fuera lo que escribió la máquina sola", () => {
    const cache = log({ action: "CLEAR", target_model: "Cache", id: "log-2" });
    expect(buildActivityTimeline([log(), cache])).toHaveLength(1);
  });

  it("no se traga una respuesta vacía ni una que no es lista", () => {
    expect(buildActivityTimeline([])).toEqual([]);
    expect(buildActivityTimeline(undefined)).toEqual([]);
  });

  it("da a cada entrada un id propio, para que React no las confunda", () => {
    const ids = buildActivityTimeline([log(), log({ id: "log-2" })]).map((e) => e.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("mergeDeviceTimeline", () => {
  const custody = [
    { id: "assign-1", kind: "assigned", date: "2026-10-04T10:00:00.000Z" },
    { id: "created-1", kind: "created", date: "2026-09-01T10:00:00.000Z" },
  ];

  it("entrelaza las dos fuentes por fecha, lo más nuevo arriba", () => {
    const merged = mergeDeviceTimeline(custody, buildActivityTimeline([log()]));
    expect(merged.map((e) => e.id.split("-")[0])).toEqual(["activity", "assign", "created"]);
  });

  /* La custodia dice a quién se le entregó; la actividad, quién lo entregó.
     Son dos hechos distintos sobre el mismo momento, y los dos se quedan. */
  it("no descarta una entrada de custodia por haber una de actividad cerca", () => {
    const merged = mergeDeviceTimeline(custody, buildActivityTimeline([log()]));
    expect(merged).toHaveLength(3);
  });

  it("funciona cuando una de las dos fuentes no trajo nada", () => {
    expect(mergeDeviceTimeline(custody, [])).toHaveLength(2);
    expect(mergeDeviceTimeline([], buildActivityTimeline([log()]))).toHaveLength(1);
    expect(mergeDeviceTimeline(undefined, undefined)).toEqual([]);
  });
});
