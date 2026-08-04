import { describe, expect, it } from "vitest";
import {
  ASSIGNED_DEVICES_EXPORT_COLUMNS,
  MEMBERS_EXPORT_COLUMNS,
  buildAssignedDevicesExportRows,
  buildMemberProfileExportPairs,
  buildMembersExportRows,
} from "./memberExportUtils";

describe("buildMembersExportRows", () => {
  const member = {
    member_id: 42,
    first_name: "Alex",
    last_name: "Student",
    email: "alex@example.com",
    phone_number: "555-1111",
    address_street: "1 Main St",
    address_city: "Austin",
    address_state: "TX",
    address_zip: "78701",
    grade: "7",
    homeroom: "A",
    minor: 1,
    date_of_birth: "2014-01-01",
    parent_guardian_first_name: "Jane",
    parent_guardian_last_name: "Doe",
    parent_guardian_email: "jane@example.com",
    parent_guardian_phone_number: "555-0124",
  };

  it("returns [] for non-array input", () => {
    expect(buildMembersExportRows(null)).toEqual([]);
    expect(buildMembersExportRows(undefined)).toEqual([]);
  });

  it("maps every member field to its export column key", () => {
    const [row] = buildMembersExportRows([member]);
    expect(row).toEqual({
      member_id: 42,
      first_name: "Alex",
      last_name: "Student",
      email: "alex@example.com",
      phone_number: "555-1111",
      address_street: "1 Main St",
      address_city: "Austin",
      address_state: "TX",
      address_zip: "78701",
      grade: "7",
      homeroom: "A",
      minor: "Yes",
      date_of_birth: "2014-01-01",
      guardian_first_name: "Jane",
      guardian_last_name: "Doe",
      guardian_email: "jane@example.com",
      guardian_phone_number: "555-0124",
    });
  });

  it("maps minor:0 to 'No' and fills missing fields with empty strings", () => {
    const [row] = buildMembersExportRows([{ member_id: 1, minor: 0 }]);
    expect(row.minor).toBe("No");
    expect(row.first_name).toBe("");
    expect(row.guardian_email).toBe("");
  });

  it("exposes one export column definition per mapped field, in display order", () => {
    expect(MEMBERS_EXPORT_COLUMNS.map((c) => c.key)).toEqual([
      "member_id",
      "first_name",
      "last_name",
      "email",
      "phone_number",
      "address_street",
      "address_city",
      "address_state",
      "address_zip",
      "grade",
      "homeroom",
      "minor",
      "date_of_birth",
      "guardian_first_name",
      "guardian_last_name",
      "guardian_email",
      "guardian_phone_number",
    ]);
  });
});

describe("buildMemberProfileExportPairs", () => {
  it("returns [] for a falsy member", () => {
    expect(buildMemberProfileExportPairs(null)).toEqual([]);
  });

  it("transposes a single member's row into field/value pairs using the column labels", () => {
    const pairs = buildMemberProfileExportPairs({
      member_id: 42,
      first_name: "Alex",
      minor: 1,
    });
    const byField = Object.fromEntries(pairs.map((p) => [p.field, p.value]));
    expect(byField["Member ID"]).toBe(42);
    expect(byField["First name"]).toBe("Alex");
    expect(byField["Minor"]).toBe("Yes");
    expect(pairs).toHaveLength(MEMBERS_EXPORT_COLUMNS.length);
  });
});

describe("buildAssignedDevicesExportRows", () => {
  const device = {
    device_id: 7,
    device_serial_number: "SN-001",
    device_item_group: "Tablet",
    device_category_name: "iPad 9th gen",
    assigned_date: "2026-07-01",
    expected_return_date: "2026-08-01",
  };

  it("returns [] for non-array input", () => {
    expect(buildAssignedDevicesExportRows(undefined)).toEqual([]);
  });

  it("maps every device field to its export column key", () => {
    const [row] = buildAssignedDevicesExportRows([device]);
    expect(row).toEqual({
      device_serial_number: "SN-001",
      device_item_group: "Tablet",
      device_category_name: "iPad 9th gen",
      assigned_date: "2026-07-01",
      expected_return_date: "2026-08-01",
    });
  });

  it("fills missing fields with empty strings", () => {
    const [row] = buildAssignedDevicesExportRows([{}]);
    expect(row.device_serial_number).toBe("");
    expect(row.expected_return_date).toBe("");
  });

  it("exposes one export column definition per mapped field, in display order", () => {
    expect(ASSIGNED_DEVICES_EXPORT_COLUMNS.map((c) => c.key)).toEqual([
      "device_serial_number",
      "device_item_group",
      "device_category_name",
      "assigned_date",
      "expected_return_date",
    ]);
  });
});
