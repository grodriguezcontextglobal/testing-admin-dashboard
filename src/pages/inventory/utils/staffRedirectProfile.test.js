import { describe, expect, it } from "vitest";
import { buildStaffRedirectProfile } from "./staffRedirectProfile";

// What the inventory filters hand to the staff profile when someone clicks a
// staff member's email (useStaffMemberRedirection).
describe("buildStaffRedirectProfile", () => {
  const companyData = {
    id: "c1",
    employees: [
      { user: "ada@x.com", firstName: "Ada", roleType: "manager", status: "Confirmed" },
    ],
  };
  const adminUser = { id: "au-1", name: "Ada" };

  it("joins the company's employee record with the admin user", () => {
    expect(
      buildStaffRedirectProfile({ staffEmail: "ada@x.com", companyData, adminUser }),
    ).toEqual({
      user: "ada@x.com",
      firstName: "Ada",
      roleType: "manager",
      status: "Confirmed",
      email: "ada@x.com",
      adminUserInfo: adminUser,
      companyData,
    });
  });

  it("does not throw for someone missing from the employees list", () => {
    expect(
      buildStaffRedirectProfile({ staffEmail: "bob@x.com", companyData, adminUser }),
    ).toEqual({
      email: "bob@x.com",
      status: undefined,
      adminUserInfo: adminUser,
      companyData,
    });
  });

  it("copes with no company data", () => {
    expect(
      buildStaffRedirectProfile({ staffEmail: "ada@x.com", companyData: undefined, adminUser }).email,
    ).toBe("ada@x.com");
  });
});
