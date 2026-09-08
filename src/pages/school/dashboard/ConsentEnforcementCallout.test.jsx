import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

let roleType = "admin";

vi.mock("react-redux", () => ({
  useSelector: (fn) => fn({ admin: { user: { roleType } } }),
}));

const { default: ConsentEnforcementCallout, SCHOOL_COMPLIANCE_PATH } = await import(
  "./ConsentEnforcementCallout"
);

const wrap = (props = {}) =>
  render(
    <MemoryRouter>
      <ConsentEnforcementCallout {...props} />
    </MemoryRouter>
  );

const link = () => document.querySelector(`a[href="${SCHOOL_COMPLIANCE_PATH}"]`);

beforeEach(() => {
  roleType = "admin";
});

describe("ConsentEnforcementCallout, when enforcement is off", () => {
  it("says what enforcement does, not just that it is off", () => {
    wrap({ enforcementOn: false });
    expect(screen.getByText("Consent enforcement is off")).toBeTruthy();
    expect(
      screen.getByText(/cannot be assigned a device until their guardian has agreed/)
    ).toBeTruthy();
  });

  it("says the figures below are not being applied to anything", () => {
    // The state where the coverage tile reads nothing and the list is empty.
    wrap({ enforcementOn: false });
    expect(screen.getByText(/not being applied to anything/)).toBeTruthy();
  });

  it("offers one click through to the setting", () => {
    wrap({ enforcementOn: false });
    expect(screen.getByText("Turn it on in School compliance →")).toBeTruthy();
    expect(link()).toBeTruthy();
  });
});

describe("ConsentEnforcementCallout, when enforcement is on", () => {
  it("names the policy version the rule is measured against", () => {
    wrap({ enforcementOn: true, requiredPolicyVersion: "3" });
    expect(screen.getByText(/Consent enforcement is on · policy v3/)).toBeTruthy();
    expect(screen.getByText(/agreed to policy v3/)).toBeTruthy();
  });

  it("warns when enforcement is on but no version is required", () => {
    // Then any old agreement counts and nobody is ever asked to re-consent.
    wrap({ enforcementOn: true, requiredPolicyVersion: null });
    expect(screen.getByText(/No required policy version is set/)).toBeTruthy();
  });

  it("still links to the setting, to change it", () => {
    wrap({ enforcementOn: true, requiredPolicyVersion: "3" });
    expect(screen.getByText("Manage in School compliance →")).toBeTruthy();
  });
});

describe("ConsentEnforcementCallout, for somebody who cannot change it", () => {
  beforeEach(() => {
    roleType = "inventory_manager";
  });

  it("offers no link that would only redirect them away", () => {
    // The route is guarded by member:update, the same permission checked here.
    wrap({ enforcementOn: false });
    expect(link()).toBeNull();
    expect(screen.queryByText(/Turn it on in School compliance/)).toBeNull();
  });

  it("tells them where it lives and who to ask", () => {
    wrap({ enforcementOn: false });
    expect(screen.getByText(/Profile → School compliance/)).toBeTruthy();
    expect(screen.getByText(/needs an administrator/)).toBeTruthy();
  });

  it("uses the company's own word for its members", () => {
    wrap({ enforcementOn: false, audienceLabel: "students" });
    expect(screen.getByText(/manages student records/)).toBeTruthy();
  });

  it("hides the manage link when enforcement is already on", () => {
    wrap({ enforcementOn: true, requiredPolicyVersion: "3" });
    expect(link()).toBeNull();
    expect(screen.getByText(/Consent enforcement is on/)).toBeTruthy();
  });
});
