import { describe, it, expect } from "vitest";
import {
  classifyAssignmentError,
  getAssignmentErrorMessage,
} from "./assignmentErrorUtils";

describe("classifyAssignmentError", () => {
  it("clasifica 422 CONSENT_REQUIRED correctamente", () => {
    const error = {
      response: {
        status: 422,
        data: {
          ok: false,
          code: "CONSENT_REQUIRED",
          msg: "Minor requires consent before device assignment",
          members: [101, 202],
        },
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "CONSENT_REQUIRED",
      message: "Minor requires consent before device assignment",
      members: [101, 202],
    });
  });

  it("clasifica 422 GUARDIAN_REQUIRED correctamente", () => {
    const error = {
      response: {
        status: 422,
        data: {
          ok: false,
          code: "GUARDIAN_REQUIRED",
          msg: "Minor must have a guardian on file",
          members: [55],
        },
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "GUARDIAN_REQUIRED",
      message: "Minor must have a guardian on file",
      members: [55],
    });
  });

  it("clasifica 422 UNDER_13_CONSENT_REQUIRED correctamente", () => {
    const error = {
      response: {
        status: 422,
        data: {
          ok: false,
          code: "UNDER_13_CONSENT_REQUIRED",
          msg: "Student under 13 requires COPPA consent",
          members: [303],
        },
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "UNDER_13_CONSENT_REQUIRED",
      message: "Student under 13 requires COPPA consent",
      members: [303],
    });
  });

  it("clasifica 422 con code desconocido como GENERIC_422", () => {
    const error = {
      response: {
        status: 422,
        data: {
          ok: false,
          code: "SOME_OTHER_CODE",
          msg: "Something else went wrong",
        },
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "GENERIC_422",
      message: "Something else went wrong",
      members: [],
    });
  });

  it("clasifica 422 sin body como GENERIC_422", () => {
    const error = {
      response: {
        status: 422,
        data: null,
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "GENERIC_422",
      message: "Request could not be completed.",
      members: [],
    });
  });

  it("clasifica 400 como GENERIC", () => {
    const error = {
      response: {
        status: 400,
        data: { ok: false, msg: "Invalid company_id" },
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "GENERIC",
      message: "Invalid company_id",
      members: [],
    });
  });

  it("clasifica 401 como GENERIC", () => {
    const error = {
      response: {
        status: 401,
        data: { ok: false, msg: "Not authenticated" },
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "GENERIC",
      message: "Not authenticated",
      members: [],
    });
  });

  it("clasifica 403 como GENERIC", () => {
    const error = {
      response: {
        status: 403,
        data: { ok: false, msg: "Forbidden" },
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "GENERIC",
      message: "Forbidden",
      members: [],
    });
  });

  it("clasifica 404 como GENERIC", () => {
    const error = {
      response: {
        status: 404,
        data: { ok: false, msg: "Member not found" },
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "GENERIC",
      message: "Member not found",
      members: [],
    });
  });

  it("clasifica error de red (sin response) como NETWORK", () => {
    const error = { message: "Network Error" };
    expect(classifyAssignmentError(error)).toEqual({
      type: "NETWORK",
      message: "Network Error",
      members: [],
    });
  });

  it("clasifica error timeout como NETWORK", () => {
    const error = { code: "ECONNABORTED", message: "timeout of 5000ms exceeded" };
    expect(classifyAssignmentError(error)).toEqual({
      type: "NETWORK",
      message: "timeout of 5000ms exceeded",
      members: [],
    });
  });

  it("tolera error nulo o indefinido", () => {
    expect(classifyAssignmentError(null)).toEqual({
      type: "GENERIC",
      message: "An unexpected error occurred.",
      members: [],
    });
    expect(classifyAssignmentError(undefined)).toEqual({
      type: "GENERIC",
      message: "An unexpected error occurred.",
      members: [],
    });
  });

  it("tolera response.data como string", () => {
    const error = {
      response: {
        status: 500,
        data: "Internal Server Error",
      },
    };
    expect(classifyAssignmentError(error)).toEqual({
      type: "GENERIC",
      message: "An unexpected error occurred.",
      members: [],
    });
  });
});

describe("getAssignmentErrorMessage", () => {
  it("CONSENT_REQUIRED genera mensaje con acción de consentimiento", () => {
    const classification = {
      type: "CONSENT_REQUIRED",
      message: "Minor requires consent before device assignment",
      members: [101],
    };
    const result = getAssignmentErrorMessage(classification);
    expect(result).toBe(
      "Minor requires consent before device assignment. Please record consent for the member before retrying."
    );
  });

  it("GUARDIAN_REQUIRED genera mensaje con acción de guardian", () => {
    const classification = {
      type: "GUARDIAN_REQUIRED",
      message: "Minor must have a guardian on file",
      members: [55],
    };
    const result = getAssignmentErrorMessage(classification);
    expect(result).toBe(
      "Minor must have a guardian on file. Please add guardian information before retrying."
    );
  });

  it("UNDER_13_CONSENT_REQUIRED genera mensaje COPPA", () => {
    const classification = {
      type: "UNDER_13_CONSENT_REQUIRED",
      message: "Student under 13 requires COPPA consent",
      members: [303],
    };
    const result = getAssignmentErrorMessage(classification);
    expect(result).toContain("COPPA");
    expect(result).toContain("consent");
  });

  it("UNDER_13_CONSENT_REQUIRED con mensaje vacío usa fallback COPPA", () => {
    const classification = {
      type: "UNDER_13_CONSENT_REQUIRED",
      message: "",
      members: [303],
    };
    const result = getAssignmentErrorMessage(classification);
    expect(result).toContain("under 13");
    expect(result).toContain("COPPA");
  });

  it("GENERIC usa el message del servidor", () => {
    const classification = {
      type: "GENERIC",
      message: "Invalid company_id",
      members: [],
    };
    expect(getAssignmentErrorMessage(classification)).toBe("Invalid company_id");
  });

  it("GENERIC_422 usa el message del servidor", () => {
    const classification = {
      type: "GENERIC_422",
      message: "Something else went wrong",
      members: [],
    };
    expect(getAssignmentErrorMessage(classification)).toBe(
      "Something else went wrong"
    );
  });

  it("NETWORK genera mensaje de conexión", () => {
    const classification = {
      type: "NETWORK",
      message: "Network Error",
      members: [],
    };
    expect(getAssignmentErrorMessage(classification)).toBe(
      "Unable to connect to the server. Please check your connection and try again."
    );
  });

  it("CONSENT_REQUIRED con mensaje vacío usa fallback", () => {
    const classification = {
      type: "CONSENT_REQUIRED",
      message: "",
      members: [101],
    };
    const result = getAssignmentErrorMessage(classification);
    expect(result).toContain("consent");
  });

  it("GENERIC con message vacío usa fallback", () => {
    const classification = {
      type: "GENERIC",
      message: "",
      members: [],
    };
    expect(getAssignmentErrorMessage(classification)).toBe(
      "An unexpected error occurred."
    );
  });
});
