import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { formatDate } from "../../../components/utils/dateFormat";
import { parseDateInputValue, todayDateInputValue } from "./leaseDateUtils";

// El bug solo se manifiesta al oeste de Greenwich y el contenedor corre en UTC,
// donde pasaría desapercibido para siempre. America/New_York es la zona donde se
// reportó (UTC-4 en agosto). Node lee TZ en cada operación de Date, así que
// fijarla en beforeAll alcanza — no hace falta tocarla antes de los imports.
beforeAll(() => {
  vi.stubEnv("TZ", "America/New_York");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("el entorno del test reproduce la zona del bug", () => {
  it("corre al oeste de Greenwich (si no, el resto no prueba nada)", () => {
    expect(new Date().getTimezoneOffset()).toBeGreaterThan(0);
  });
});

// El bug reportado en prueba manual: se elegía una fecha de vencimiento y el
// dispositivo quedaba asignado con el día ANTERIOR. `<Input type="date">`
// entrega "2026-08-20" y `new Date("2026-08-20")` lo interpreta como medianoche
// UTC, que en UTC-4 es el 19 a las 20:00 — y formatDate lee componentes locales.
describe("parseDateInputValue — una fecha sin hora es medianoche LOCAL", () => {
  it("no pierde un día al parsear el valor de un input type=date", () => {
    const parsed = parseDateInputValue("2026-08-20");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getDate()).toBe(20);
  });

  it("es exactamente medianoche local, no una hora arrastrada del offset", () => {
    expect(parseDateInputValue("2026-08-20").getTime()).toBe(
      new Date(2026, 7, 20).getTime()
    );
  });

  // Esta es la comparación que demuestra el bug: el parseo ingenuo cae en el 19.
  it("difiere de new Date(string), que es lo que estaba en producción", () => {
    expect(new Date("2026-08-20").getDate()).toBe(19);
    expect(parseDateInputValue("2026-08-20").getDate()).toBe(20);
  });

  it("sobrevive el viaje completo hasta el string que se guarda", () => {
    expect(formatDate(parseDateInputValue("2026-08-20"))).toBe(
      "2026-08-20 00:00:00"
    );
  });

  it("respeta un string que ya trae hora — ahí no hay ambigüedad de zona", () => {
    const parsed = parseDateInputValue("2026-08-20 14:30:00");
    expect(parsed.getDate()).toBe(20);
    expect(parsed.getHours()).toBe(14);
  });

  it("devuelve el mismo Date cuando ya recibe un Date (react-datepicker)", () => {
    const date = new Date(2026, 7, 20, 9, 15);
    expect(parseDateInputValue(date)).toBe(date);
  });

  it("devuelve null en lugar de un Invalid Date que se guardaría como basura", () => {
    for (const bad of [undefined, null, "", "   ", "no es fecha", new Date("x")]) {
      expect(parseDateInputValue(bad)).toBeNull();
    }
  });

  it("no acepta un día imposible disfrazado de fecha válida", () => {
    // 2026-02-31 no existe; el constructor local lo rodaría a marzo en silencio.
    expect(parseDateInputValue("2026-02-31")).toBeNull();
  });
});

describe("todayDateInputValue — valor por defecto que el input sí acepta", () => {
  it("da el formato YYYY-MM-DD que exige input type=date", () => {
    expect(todayDateInputValue(new Date(2026, 7, 9, 23, 45))).toBe("2026-08-09");
  });

  it("usa el día local, no el UTC — a las 23:45 en UTC-4 ya es mañana en UTC", () => {
    expect(todayDateInputValue(new Date(2026, 7, 9, 23, 45))).not.toBe(
      "2026-08-10"
    );
  });

  it("hace ida y vuelta con parseDateInputValue sin corrimiento", () => {
    const today = new Date(2026, 7, 9);
    expect(parseDateInputValue(todayDateInputValue(today)).getTime()).toBe(
      today.getTime()
    );
  });
});
