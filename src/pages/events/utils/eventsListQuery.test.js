import { describe, expect, it } from "vitest";
import {
  eventsListCacheKey,
  eventsListPath,
  fetchEventsList,
} from "./eventsListQuery";

/**
 * Borrar un borrador funcionaba, pero la lista seguía enseñándolo hasta
 * recargar la página (reportado 2026-10-06). React Query sí refrescaba: lo que
 * devolvía el servidor era su propia copia en caché, que nadie había
 * invalidado.
 *
 * `GET /api/event/event-list-per-company` lee la cadena de consulta cruda y
 * cachea la respuesta bajo ella, así que la clave a limpiar **es** esa cadena,
 * carácter por carácter. Estaba escrita a mano en dos ficheros distintos, que
 * es lo que permitió que se separaran.
 */
describe("eventsListCacheKey", () => {
  it("es exactamente la cadena de consulta, que es como el servidor cachea", () => {
    expect(eventsListCacheKey("Acme Rentals")).toBe("company=Acme Rentals&type=event");
  });

  it("el orden de los parámetros no cambia, porque el servidor parte por &", () => {
    expect(eventsListCacheKey("X").split("&")).toEqual(["company=X", "type=event"]);
  });
});

describe("eventsListPath", () => {
  /* La URL y la clave salen de la misma función: si se separan, el borrado
     limpia una caché que nadie usa. */
  it("pide la lista bajo la misma clave que luego se limpia", () => {
    const company = "Acme Rentals";
    expect(eventsListPath(company)).toBe(
      `/event/event-list-per-company?${eventsListCacheKey(company)}`
    );
  });
});

describe("fetchEventsList", () => {
  const fakeApi = () => {
    const calls = [];
    return {
      calls,
      post: async (path, body) => {
        calls.push(["post", path, body]);
        return { data: { ok: true } };
      },
      get: async (path) => {
        calls.push(["get", path]);
        return { data: { list: [{ id: "e1" }] } };
      },
    };
  };

  /* Crear un evento no limpia la caché del servidor, así que el evento nuevo
     solo aparecía al recargar la página. La lista se pide siempre fresca. */
  it("limpia la caché del servidor antes de pedir la lista", async () => {
    const api = fakeApi();
    const response = await fetchEventsList(api, "Acme Rentals");
    expect(api.calls).toEqual([
      ["post", "/cache_update/remove-cache", { key: "company=Acme Rentals&type=event" }],
      ["get", "/event/event-list-per-company?company=Acme Rentals&type=event"],
    ]);
    expect(response.data.list).toEqual([{ id: "e1" }]);
  });

  it("pide la lista aunque limpiar la caché falle", async () => {
    const api = fakeApi();
    api.post = async () => {
      throw new Error("cache down");
    };
    const response = await fetchEventsList(api, "X");
    expect(response.data.list).toHaveLength(1);
  });
});
