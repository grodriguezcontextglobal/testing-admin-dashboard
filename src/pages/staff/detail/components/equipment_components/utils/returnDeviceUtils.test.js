import { describe, it, expect } from "vitest";
import {
  RETURN_REASONS,
  isReasonValid,
  buildReturningItemPayload,
  buildUpdateLeasePayload,
  buildDeleteLeasePayload,
} from "./returnDeviceUtils";

const deviceInfo = {
  item_id_info: {
    serial_number: "SN-48213-A",
    category_name: "Radio",
    item_group: "GRP-1",
    item_id: "item-99",
  },
  subscription_initial_date: "2026-01-10",
  staff_admin_id: "sa-1",
  company_id: "co-1",
  staff_member_id: "sm-1",
  device_id: "dev-1",
};

const user = { sqlInfo: { company_id: "sql-co-1" }, companyData: { id: "co-1" } };

describe("RETURN_REASONS / isReasonValid", () => {
  it("expone los 5 motivos esperados", () => {
    expect(RETURN_REASONS).toEqual([
      "Operational",
      "Network",
      "Hardware",
      "Damaged",
      "Battery",
    ]);
  });

  it("un motivo vacío es inválido", () => {
    expect(isReasonValid("")).toBe(false);
    expect(isReasonValid(undefined)).toBe(false);
    expect(isReasonValid("   ")).toBe(false);
  });

  it("un motivo con contenido es válido", () => {
    expect(isReasonValid("Hardware")).toBe(true);
  });
});

describe("buildReturningItemPayload", () => {
  it("arma el payload de /db_event/returning-item", () => {
    const payload = buildReturningItemPayload(deviceInfo, user, "Hardware", "2026-07-02");
    expect(payload).toEqual({
      warehouse: 1,
      status: "Hardware",
      update_at: "2026-07-02",
      serial_number: "SN-48213-A",
      category_name: "Radio",
      item_group: "GRP-1",
      company_id: "sql-co-1",
    });
  });
});

describe("buildUpdateLeasePayload", () => {
  it("arma el payload de /db_lease/update-lease-info con fechas inyectadas", () => {
    const payload = buildUpdateLeasePayload(deviceInfo, {
      initialDate: "2026-01-10",
      returnedDate: "2026-07-02",
    });
    expect(payload).toEqual({
      subscription_returned_date: "2026-07-02",
      staff_admin_id: "sa-1",
      company_id: "co-1",
      subscription_current_in_use: 0,
      staff_member_id: "sm-1",
      device_id: "item-99",
      active: 0,
      subscription_initial_date: "2026-01-10",
    });
  });
});

describe("buildDeleteLeasePayload", () => {
  it("arma el payload de /db_lease/delete-lease-info", () => {
    expect(buildDeleteLeasePayload(deviceInfo)).toEqual({
      company_id: "co-1",
      staff_member_id: "sm-1",
      device_id: "item-99",
    });
  });
});
