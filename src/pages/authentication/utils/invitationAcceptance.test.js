import { describe, it, expect } from "vitest";
import {
  ALREADY_ACCEPTED_MESSAGE,
  INVALID_LINK_MESSAGE,
  NO_INVITATION_MESSAGE,
  buildAcceptInvitationPayload,
  invitationErrorMessage,
  isInvitationAlreadyAccepted,
} from "./invitationAcceptance";

// ─── buildAcceptInvitationPayload ────────────────────────────────────────────

describe("buildAcceptInvitationPayload", () => {
  const identity = {
    invitationToken: "invite.jwt",
    firstName: "Maria",
    lastName: "Lopez",
  };

  // FRONTEND_invitation_signed_link_2026-10-13.md: el email y la compañía
  // salen del token firmado; los del body el servidor los ignora.
  it("manda el token del enlace y el nombre, no el email ni la compañía", () => {
    expect(
      buildAcceptInvitationPayload({ ...identity, email: "maria@test.com", companyName: "Acme Corp" }),
    ).toEqual({
      invitationToken: "invite.jwt",
      user: { name: "Maria", lastName: "Lopez" },
    });
  });

  it("incluye la contraseña solo cuando el usuario es nuevo", () => {
    expect(
      buildAcceptInvitationPayload({ ...identity, password: "S3cret!" }).user.password,
    ).toBe("S3cret!");
    expect(
      buildAcceptInvitationPayload(identity).user,
    ).not.toHaveProperty("password");
  });

  // La ruta de aceptación no lleva autenticación. Mientras el roleType viajaba
  // en el body, el propio invitado podía pedir root_admin y quedaba con ese rol
  // en company_staff. Ahora el backend lo resuelve desde la invitación.
  it("nunca manda el rol", () => {
    const payload = buildAcceptInvitationPayload({ ...identity, roleType: "root_admin" });
    expect(payload).not.toHaveProperty("roleType");
    expect(payload.user).not.toHaveProperty("role");
    expect(payload.user).not.toHaveProperty("roleType");
  });
});

// ─── invitationErrorMessage ──────────────────────────────────────────────────

describe("invitationErrorMessage", () => {
  it("explica un enlace falso, caducado o sin token", () => {
    const error = { response: { status: 400, data: { ok: false, invitationLinkInvalid: true, msg: "x" } } };
    expect(invitationErrorMessage(error)).toBe(INVALID_LINK_MESSAGE);
  });

  it("explica una invitación ya aceptada", () => {
    const error = { response: { status: 409, data: { ok: false, invitationAlreadyAccepted: true } } };
    expect(invitationErrorMessage(error)).toBe(ALREADY_ACCEPTED_MESSAGE);
  });

  it("explica el 404 en vez de repetir el mensaje del servidor", () => {
    const error = { response: { status: 404, data: { msg: "No hay una invitación pendiente" } } };
    expect(invitationErrorMessage(error)).toBe(NO_INVITATION_MESSAGE);
  });

  it("usa el mensaje del servidor para cualquier otro error", () => {
    const error = { response: { status: 400, data: { msg: "Email already registered" } } };
    expect(invitationErrorMessage(error)).toBe("Email already registered");
  });

  it("cae a un mensaje genérico cuando no hay respuesta", () => {
    expect(invitationErrorMessage(new Error("Network Error"))).toBe(
      "Something went wrong. Please try later.",
    );
  });
});

// ─── isInvitationAlreadyAccepted ─────────────────────────────────────────────

describe("isInvitationAlreadyAccepted", () => {
  it("reconoce el 409 de un enlace ya usado", () => {
    expect(
      isInvitationAlreadyAccepted({ response: { status: 409, data: { invitationAlreadyAccepted: true } } }),
    ).toBe(true);
  });

  it("no confunde otros errores", () => {
    expect(isInvitationAlreadyAccepted({ response: { status: 404, data: {} } })).toBe(false);
    expect(isInvitationAlreadyAccepted(new Error("Network Error"))).toBe(false);
  });
});
