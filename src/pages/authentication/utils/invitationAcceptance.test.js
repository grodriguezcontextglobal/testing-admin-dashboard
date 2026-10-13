import { describe, it, expect } from "vitest";
import {
  NO_INVITATION_MESSAGE,
  buildAcceptInvitationPayload,
  invitationErrorMessage,
} from "./invitationAcceptance";

// ─── buildAcceptInvitationPayload ────────────────────────────────────────────

describe("buildAcceptInvitationPayload", () => {
  const identity = {
    firstName: "Maria",
    lastName: "Lopez",
    email: "maria@test.com",
    companyName: "Acme Corp",
  };

  it("manda la identidad y la compañía", () => {
    expect(buildAcceptInvitationPayload(identity)).toEqual({
      user: { name: "Maria", lastName: "Lopez", email: "maria@test.com" },
      company: { company_name: "Acme Corp" },
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
