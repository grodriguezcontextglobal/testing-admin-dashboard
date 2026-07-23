import { describe, it, expect } from "vitest";
import { isOfflineQueueableRequest } from "./offlineQueue";

const API_ORIGINS = ["https://api.devitrak.net", "https://api-backup.devitrak.net"];

// ─── isOfflineQueueableRequest ─────────────────────────────────────────────

describe("isOfflineQueueableRequest", () => {
  it("es true para POST a un origen de API conocido estando offline", () => {
    expect(
      isOfflineQueueableRequest({
        method: "post",
        url: "https://api.devitrak.net/admin/push/broadcast",
        isOnline: false,
        apiOrigins: API_ORIGINS,
      }),
    ).toBe(true);
  });

  it("es true para PUT al origen de respaldo estando offline", () => {
    expect(
      isOfflineQueueableRequest({
        method: "PUT",
        url: "https://api-backup.devitrak.net/db_inventory/update-large-data",
        isOnline: false,
        apiOrigins: API_ORIGINS,
      }),
    ).toBe(true);
  });

  it("es false si el dispositivo sigue online, sin importar el método", () => {
    expect(
      isOfflineQueueableRequest({
        method: "post",
        url: "https://api.devitrak.net/admin/push/broadcast",
        isOnline: true,
        apiOrigins: API_ORIGINS,
      }),
    ).toBe(false);
  });

  it("es false para GET aunque el dispositivo esté offline", () => {
    expect(
      isOfflineQueueableRequest({
        method: "get",
        url: "https://api.devitrak.net/inventory",
        isOnline: false,
        apiOrigins: API_ORIGINS,
      }),
    ).toBe(false);
  });

  it("es false para DELETE aunque el dispositivo esté offline", () => {
    expect(
      isOfflineQueueableRequest({
        method: "delete",
        url: "https://api.devitrak.net/inventory/123",
        isOnline: false,
        apiOrigins: API_ORIGINS,
      }),
    ).toBe(false);
  });

  it("es false si la URL no pertenece a ninguno de los orígenes configurados (ej. AWS)", () => {
    expect(
      isOfflineQueueableRequest({
        method: "post",
        url: "https://aws.devitrak.net/upload",
        isOnline: false,
        apiOrigins: API_ORIGINS,
      }),
    ).toBe(false);
  });

  it("es false si falta la url", () => {
    expect(
      isOfflineQueueableRequest({
        method: "post",
        url: undefined,
        isOnline: false,
        apiOrigins: API_ORIGINS,
      }),
    ).toBe(false);
  });

  it("es false si no hay orígenes configurados", () => {
    expect(
      isOfflineQueueableRequest({
        method: "post",
        url: "https://api.devitrak.net/admin/push/broadcast",
        isOnline: false,
        apiOrigins: [],
      }),
    ).toBe(false);
  });
});
