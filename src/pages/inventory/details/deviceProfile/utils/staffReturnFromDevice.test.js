import { describe, expect, it } from "vitest";
import { openStaffLeaseRow, staffReturnDeviceInfo } from "./staffReturnFromDevice";

/**
 * 2b.10, reunión del 29-09 `[21]`, y repetido el 2026-10-06: alguien encuentra
 * un equipo en el pasillo que figura asignado a otra persona, y necesita
 * devolverlo al almacén desde la ficha del equipo.
 *
 * La ficha ya tenía "Return device", pero **solo cuando quien lo tiene es un
 * member**: un equipo en manos de un staff no ofrecía nada. La devolución de
 * staff existe (`ModalReturnDeviceFromStaff`) y hace la cadena entera —cerrar
 * el préstamo, borrar su fila, sacar el equipo del evento si lo había—, que es
 * la condición del tracker: ir por la devolución de verdad y no cambiar un
 * campo suelto, o el evento lo seguiría contando como fuera.
 *
 * Ese modal lee los campos del préstamo en plano y el inventario bajo
 * `item_id_info`, que **lo arma quien lo llama** (`AssignedDevicesTable` lo
 * une con el ítem que ya tiene). Aquí el ítem es el de la propia ficha.
 */
const lease = (overrides = {}) => ({
  id: 41,
  company_id: 147,
  staff_member_id: 207,
  subscription_initial_date: "2026-09-01",
  ...overrides,
});

const item = { item_id: 5001, serial_number: "SN-100006", item_group: "Laptop" };

describe("openStaffLeaseRow", () => {
  /* lease_info borra la fila al devolver, así que lo que haya aquí está
     prestado — lo dice el propio hook del perfil. */
  it("toma el préstamo abierto", () => {
    expect(openStaffLeaseRow([lease()])).toMatchObject({ id: 41 });
  });

  it("con varios, el más reciente, que es el que vale", () => {
    const rows = [lease(), lease({ id: 42, subscription_initial_date: "2026-10-01" })];
    expect(openStaffLeaseRow(rows).id).toBe(42);
    expect(openStaffLeaseRow([...rows].reverse()).id).toBe(42);
  });

  it("es null cuando no hay ninguno, y no revienta con lo que no es lista", () => {
    expect(openStaffLeaseRow([])).toBeNull();
    expect(openStaffLeaseRow(undefined)).toBeNull();
  });

  /* Una fila sin fecha no puede compararse, pero sigue siendo un préstamo. */
  it("sirve una fila sin fecha en vez de descartarla", () => {
    expect(openStaffLeaseRow([lease({ subscription_initial_date: null })])).toMatchObject({
      id: 41,
    });
  });
});

describe("staffReturnDeviceInfo", () => {
  it("entrega el préstamo en plano y el inventario bajo item_id_info", () => {
    const info = staffReturnDeviceInfo(lease(), item);
    expect(info).toMatchObject({
      id: 41,
      company_id: 147,
      subscription_initial_date: "2026-09-01",
      item_id_info: item,
    });
  });

  /* Sin préstamo no hay nada que cerrar: devolver un objeto a medias haría
     que el modal mandase un borrado sin device_id. */
  it("es null sin préstamo o sin ítem", () => {
    expect(staffReturnDeviceInfo(null, item)).toBeNull();
    expect(staffReturnDeviceInfo(lease(), null)).toBeNull();
    expect(staffReturnDeviceInfo(lease(), {})).toBeNull();
  });
});
