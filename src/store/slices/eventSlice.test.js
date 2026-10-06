import { describe, expect, it } from "vitest";
import { normalizeEventStaff } from "./eventSlice";

/**
 * El paso 1 del alta reventaba al retomar un borrador, con
 * "Cannot read properties of undefined (reading 'length')"
 * (`eventDetails/Form.jsx`, reportado 2026-10-06).
 *
 * Cinco sitios del asistente leen `staff.adminUser.length` sin guarda, y el
 * objeto entra en Redux desde fuera por tres caminos: el borrador que se
 * retoma (`draftResumeState`), el evento que devuelve el servidor al editar
 * staff, y el estado que redux-persist rehidrata de una sesión anterior. Un
 * borrador abandonado en el paso 1 no ha pasado por el paso de staff, así que
 * su documento trae `staff: {}` o ni eso — y el valor por defecto de antes
 * solo cubría el caso de que faltara del todo.
 *
 * La forma se garantiza aquí, en la frontera, en vez de poner un `?.` en cada
 * lectura: con `?.length === 0` un staff ausente diría que sí hay gente.
 */
describe("normalizeEventStaff", () => {
  it("completa las dos listas cuando el documento no las trae", () => {
    expect(normalizeEventStaff({})).toEqual({ adminUser: [], headsetAttendees: [] });
    expect(normalizeEventStaff(undefined)).toEqual({ adminUser: [], headsetAttendees: [] });
    expect(normalizeEventStaff(null)).toEqual({ adminUser: [], headsetAttendees: [] });
  });

  it("completa la que falta sin tocar la que viene", () => {
    expect(normalizeEventStaff({ headsetAttendees: [{ email: "a@x.com" }] })).toEqual({
      adminUser: [],
      headsetAttendees: [{ email: "a@x.com" }],
    });
  });

  it("deja igual un staff completo", () => {
    const staff = {
      adminUser: [{ email: "admin@x.com" }],
      headsetAttendees: [{ email: "a@x.com" }],
    };
    expect(normalizeEventStaff(staff)).toEqual(staff);
  });

  /* Un valor que no es una lista no se puede recorrer ni contar: se descarta
     en vez de dejar que reviente en la pantalla. */
  it("descarta lo que no sea una lista", () => {
    expect(normalizeEventStaff({ adminUser: "admin@x.com" })).toEqual({
      adminUser: [],
      headsetAttendees: [],
    });
    expect(normalizeEventStaff("staff")).toEqual({ adminUser: [], headsetAttendees: [] });
  });

  it("conserva lo demás que el documento traiga", () => {
    expect(normalizeEventStaff({ adminUser: [], extra: "dato" })).toMatchObject({
      extra: "dato",
    });
  });
});
