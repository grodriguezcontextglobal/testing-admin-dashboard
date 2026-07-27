import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn() },
}));

import { devitrakApi } from "../../../api/devitrakApi";
import {
  fetchStudentConsent,
  saveGuardian,
  sendConsentRequest,
  searchGuardians,
} from "./guardianConsentApi";

beforeEach(() => {
  devitrakApi.post.mockReset();
});

describe("fetchStudentConsent", () => {
  it("calls POST /school/consent with company_id and member_id", async () => {
    devitrakApi.post.mockResolvedValue({ data: { status: "pending" } });
    const result = await fetchStudentConsent(137, 42);
    expect(devitrakApi.post).toHaveBeenCalledWith("/school/consent", {
      company_id: 137,
      member_id: 42,
    });
    expect(result).toEqual({ status: "pending" });
  });

  it("propagates errors", async () => {
    devitrakApi.post.mockRejectedValue(new Error("Consent failed"));
    await expect(fetchStudentConsent(137, 42)).rejects.toThrow("Consent failed");
  });
});

describe("saveGuardian", () => {
  it("calls POST /school/guardians/add with guardian payload", async () => {
    const payload = { member_id: 42, company_id: 137, email: "jane@test.com" };
    devitrakApi.post.mockResolvedValue({ data: { guardian_id: 7 } });
    const result = await saveGuardian(payload);
    expect(devitrakApi.post).toHaveBeenCalledWith("/school/guardians/add", payload);
    expect(result).toEqual({ guardian_id: 7 });
  });
});

describe("sendConsentRequest", () => {
  it("calls POST /school/consent/request with request payload", async () => {
    const payload = { company_id: 137, member_id: 42, guardian_id: 7 };
    devitrakApi.post.mockResolvedValue({ data: { ok: true } });
    const result = await sendConsentRequest(payload);
    expect(devitrakApi.post).toHaveBeenCalledWith(
      "/school/consent/request",
      payload
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("searchGuardians", () => {
  it("calls POST /school/guardians/search with company_id and email", async () => {
    const payload = { company_id: 137, email: "jane@test.com" };
    devitrakApi.post.mockResolvedValue({ data: { guardians: [{ id: 7, email: "jane@test.com" }] } });
    const result = await searchGuardians(payload);
    expect(devitrakApi.post).toHaveBeenCalledWith("/school/guardians/search", payload);
    expect(result).toEqual({ guardians: [{ id: 7, email: "jane@test.com" }] });
  });

  it("propagates errors", async () => {
    devitrakApi.post.mockRejectedValue(new Error("Search failed"));
    await expect(searchGuardians({ company_id: 137, email: "jane@test.com" })).rejects.toThrow("Search failed");
  });
});

describe("guardian consent API return values", () => {
  it.each([
    ["saveGuardian", saveGuardian, [{ member_id: 42 }]],
    ["sendConsentRequest", sendConsentRequest, [{ member_id: 42 }]],
    ["searchGuardians", searchGuardians, [{ company_id: 137, email: "jane@test.com" }]],
  ])("%s returns response.data", async (_name, fn, args) => {
    devitrakApi.post.mockResolvedValue({ data: { ok: true, value: 1 } });
    await expect(fn(...args)).resolves.toEqual({ ok: true, value: 1 });
  });
});
