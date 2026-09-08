import { describe, expect, it } from "vitest";
import {
  buildDeleteMemberAuditEntry,
  buildDeleteMemberPayload,
  deleteMemberEligibility,
  describeDeleteConsequence,
  memberLabel,
} from "./deleteMember";

const student = {
  member_id: 41,
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@school.edu",
  grade: "7",
};

describe("memberLabel", () => {
  it("uses the name", () => {
    expect(memberLabel(student)).toBe("Ada Lovelace");
  });

  it("falls back to the email, then to the id", () => {
    expect(memberLabel({ member_id: 41, email: "ada@school.edu" })).toBe(
      "ada@school.edu"
    );
    expect(memberLabel({ member_id: 41 })).toBe("member 41");
  });

  it("does not render half a name with a stray space", () => {
    expect(memberLabel({ member_id: 1, first_name: "Ada" })).toBe("Ada");
    expect(memberLabel({ member_id: 1, last_name: "Lovelace" })).toBe("Lovelace");
  });

  it("does not throw on nothing", () => {
    expect(memberLabel(undefined)).toBe("member");
  });
});

describe("deleteMemberEligibility", () => {
  it("allows it when nothing is assigned", () => {
    expect(deleteMemberEligibility({ out: 0, overdue: 0 })).toEqual({
      deletable: true,
      reason: null,
      detail: null,
    });
  });

  it("refuses while the member is still holding a device", () => {
    // Deleting them leaves the assignment pointing at nobody.
    const verdict = deleteMemberEligibility({ out: 2, overdue: 0 });
    expect(verdict.deletable).toBe(false);
    expect(verdict.reason).toBe("holding-devices");
    expect(verdict.detail).toBe(
      "2 devices still assigned. Check them in before removing the record."
    );
  });

  it("says how many are overdue, since that is the harder conversation", () => {
    expect(deleteMemberEligibility({ out: 3, overdue: 1 }).detail).toBe(
      "3 devices still assigned, 1 overdue. Check them in before removing the record."
    );
  });

  it("gets the singular right", () => {
    expect(deleteMemberEligibility({ out: 1 }).detail).toContain("1 device still");
  });

  it("waits rather than refusing while the summary has not resolved", () => {
    const verdict = deleteMemberEligibility(undefined);
    expect(verdict.deletable).toBe(false);
    expect(verdict.reason).toBe("unknown");
    expect(deleteMemberEligibility({}).reason).toBe("unknown");
    expect(deleteMemberEligibility({ out: null }).reason).toBe("unknown");
  });
});

describe("buildDeleteMemberPayload", () => {
  it("pins the body the endpoint already accepts", () => {
    expect(buildDeleteMemberPayload({ memberId: 41, companyId: 7 })).toEqual({
      member_ids: [41],
      company_id: 7,
    });
  });

  it("adds no field outside the contract", () => {
    expect(
      Object.keys(buildDeleteMemberPayload({ memberId: 41, companyId: 7 })).sort()
    ).toEqual(["company_id", "member_ids"]);
  });
});

describe("describeDeleteConsequence", () => {
  it("names the member and says it cannot be undone", () => {
    const copy = describeDeleteConsequence(student);
    expect(copy).toContain("Ada Lovelace");
    expect(copy).toContain("cannot be undone");
  });
});

describe("buildDeleteMemberAuditEntry", () => {
  it("matches what the bulk modal writes, plus who it was", () => {
    // The record is about to be gone, so the audit row is the only place the
    // name survives.
    expect(buildDeleteMemberAuditEntry(student)).toEqual({
      action: "DELETE",
      target_model: "Member",
      target_id: 41,
      details: {
        reason: "deleted_from_member_page",
        name: "Ada Lovelace",
        email: "ada@school.edu",
        grade: "7",
      },
    });
  });

  it("carries the two fields the endpoint requires even for a bare member", () => {
    const entry = buildDeleteMemberAuditEntry({ member_id: 9 });
    expect(entry.action).toBe("DELETE");
    expect(entry.target_model).toBe("Member");
    expect(entry.details.email).toBeNull();
  });
});
