import { describe, expect, it } from "vitest";
import { staffLeaseRows } from "./staffLeaseTable";

/**
 * "Qué equipos tiene el staff", pedido el 2026-10-06 con el mismo navegador
 * por pestañas que ya tiene la página de members. Sale de
 * `POST /api/db_lease/status` (`FRONTEND_server_updates_2026-07.md` §4).
 *
 * El contrato documenta `device_id` y `lessee_id` y deja el resto abierto
 * ("…"), así que el nombre del equipo se busca en el inventario de la
 * compañía, que esta página ya sabe pedir, y lo que no se pueda resolver se
 * enseña por su id antes que como un hueco.
 */
const lease = (overrides = {}) => ({
  lease_key: "staff-41",
  lessee_type: "staff",
  lessee_id: 207,
  device_id: 5001,
  expected_return_date: "2026-10-01",
  outstanding: 1,
  overdue: true,
  status: "overdue",
  ...overrides,
});

const itemsById = new Map([[5001, { item_id: 5001, serial_number: "SN-100006", item_group: "Laptop" }]]);

describe("staffLeaseRows", () => {
  it("nombra el equipo con su serial y su grupo", () => {
    const [row] = staffLeaseRows([lease()], { itemsById });
    expect(row.deviceLabel).toBe("Laptop · SN-100006");
  });

  it("enseña el id cuando el equipo no está en el inventario cargado", () => {
    const [row] = staffLeaseRows([lease({ device_id: 9999 })], { itemsById });
    expect(row.deviceLabel).toBe("Device 9999");
  });

  /* El id de staff no identifica a nadie de un vistazo, que es para lo que se
     mira esta tabla. El nombre y el email se resuelven como en la ficha del
     dispositivo: el id da el email, y el email da el nombre entre los
     empleados de la compañía. */
  it("identifica a la persona por su nombre y su email", () => {
    const staffById = new Map([[207, { name: "Ana Gil", email: "ana@x.com" }]]);
    expect(staffLeaseRows([lease()], { itemsById, staffById })[0]).toMatchObject({
      holderName: "Ana Gil",
      holderEmail: "ana@x.com",
    });
  });

  it("se conforma con el email cuando el nombre no está entre los empleados", () => {
    const staffById = new Map([[207, { email: "ana@x.com" }]]);
    expect(staffLeaseRows([lease()], { itemsById, staffById })[0]).toMatchObject({
      holderName: "ana@x.com",
      holderEmail: null,
    });
  });

  it("usa el nombre que traiga la propia fila si lo trae", () => {
    expect(staffLeaseRows([lease({ lessee_name: "Ana Gil" })], { itemsById })[0].holderName).toBe(
      "Ana Gil"
    );
  });

  /* Mientras las consultas por id están en vuelo no hay nombre todavía: el id
     es feo pero no miente, y desaparece en cuanto llega la respuesta. */
  it("cae al id solo cuando no se sabe nada de la persona", () => {
    expect(staffLeaseRows([lease()], { itemsById })[0].holderName).toBe("Staff 207");
  });

  /* 2026-10-07: a staff member keeps a device until they leave or it has to
     change — there is no return date to miss. "Overdue" and a status column
     said more about a date nobody set than about the device. */
  it("no habla de vencimientos ni de fechas de devolución", () => {
    const [row] = staffLeaseRows([lease()], { itemsById });
    expect(row).not.toHaveProperty("overdue");
    expect(row).not.toHaveProperty("dueDate");
    expect(row).not.toHaveProperty("statusLabel");
  });

  /* Sin la columna Status, una fila devuelta parecería seguir en manos del
     staff: el endpoint sirve también returned, lost y damaged. */
  it("solo lleva lo que el staff tiene ahora", () => {
    const rows = staffLeaseRows(
      [
        lease(),
        lease({ lease_key: "staff-2", overdue: false, status: "outstanding" }),
        lease({ lease_key: "staff-3", outstanding: 0, status: "returned" }),
        lease({ lease_key: "staff-4", outstanding: 0, status: "lost" }),
        lease({ lease_key: "staff-5", outstanding: 0, status: "damaged" }),
      ],
      { itemsById }
    );
    expect(rows.map((row) => row.key)).toEqual(["staff-41", "staff-2"]);
  });

  it("aguanta una fila sin outstanding, guiándose por su estado", () => {
    const open = lease({ status: "outstanding" });
    delete open.outstanding;
    const closed = lease({ lease_key: "staff-9", status: "returned" });
    delete closed.outstanding;
    expect(staffLeaseRows([open, closed], { itemsById })).toHaveLength(1);
  });

  it("solo lleva préstamos de staff, aunque el endpoint sirva de todo", () => {
    const rows = staffLeaseRows([lease(), lease({ lessee_type: "member", lease_key: "member-9" })], {
      itemsById,
    });
    expect(rows).toHaveLength(1);
  });

  it("da a cada fila una clave estable y aguanta una respuesta vacía", () => {
    expect(staffLeaseRows([lease()], { itemsById })[0].key).toBe("staff-41");
    expect(staffLeaseRows(undefined, {})).toEqual([]);
    expect(staffLeaseRows([], {})).toEqual([]);
  });
});
