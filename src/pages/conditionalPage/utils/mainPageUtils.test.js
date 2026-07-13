import { describe, it, expect, vi } from "vitest";
import { buildManageMembersMenu } from "./mainPageUtils";

describe("buildManageMembersMenu", () => {
  it("retorna un item de agregar, un divider y un item de eliminar", () => {
    const items = buildManageMembersMenu({ titleParams: "members" });
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ key: "add" });
    expect(items[1]).toMatchObject({ type: "divider" });
    expect(items[2]).toMatchObject({ key: "delete", danger: true });
  });

  it("interpola titleParams en las etiquetas y capitaliza nada extra", () => {
    const items = buildManageMembersMenu({ titleParams: "patients" });
    expect(items[0].label).toBe("Add new patients");
    expect(items[2].label).toBe("Delete patients");
  });

  it("usa un fallback cuando titleParams está vacío", () => {
    const items = buildManageMembersMenu({ titleParams: "" });
    expect(items[0].label).toBe("Add new member");
    expect(items[2].label).toBe("Delete member");
  });

  it("cablea onAdd al onClick del item add", () => {
    const onAdd = vi.fn();
    const items = buildManageMembersMenu({ titleParams: "members", onAdd });
    items[0].onClick();
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("cablea onDelete al onClick del item delete", () => {
    const onDelete = vi.fn();
    const items = buildManageMembersMenu({ titleParams: "members", onDelete });
    items[2].onClick();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("no lanza error cuando no se pasan callbacks", () => {
    const items = buildManageMembersMenu({ titleParams: "members" });
    expect(() => items[0].onClick()).not.toThrow();
    expect(() => items[2].onClick()).not.toThrow();
  });

  it("omite el item add cuando canAdd es false", () => {
    const items = buildManageMembersMenu({ titleParams: "members", canAdd: false });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ key: "delete" });
  });

  it("omite el item delete cuando canDelete es false", () => {
    const items = buildManageMembersMenu({ titleParams: "members", canDelete: false });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ key: "add" });
  });

  it("retorna lista vacía cuando canAdd y canDelete son false", () => {
    const items = buildManageMembersMenu({
      titleParams: "members",
      canAdd: false,
      canDelete: false,
    });
    expect(items).toHaveLength(0);
  });
});
