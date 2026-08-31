import { describe, it, expect } from "vitest";
import reducer, {
  onLogin,
  onLogout,
  onUpdateCompanyData,
} from "./adminSlice";

const initialState = reducer(undefined, { type: "@@INIT" });

describe("adminSlice — estado inicial", () => {
  it("status es 'checking'", () => {
    expect(initialState.status).toBe("checking");
  });

  it("user.role es undefined", () => {
    expect(initialState.user.role).toBeUndefined();
  });

  it("user.roleType es undefined", () => {
    expect(initialState.user.roleType).toBeUndefined();
  });
});

describe("adminSlice — onLogin", () => {
  it("persiste role y roleType del payload", () => {
    const payload = {
      name: "Ana",
      email: "ana@test.com",
      role: 2,
      roleType: "inventory_manager",
    };
    const state = reducer(initialState, onLogin(payload));
    expect(state.user.role).toBe(2);
    expect(state.user.roleType).toBe("inventory_manager");
    expect(state.status).toBe("authenticated");
  });

  it("acepta roleType para los 6 tipos de rol", () => {
    const types = [
      "root_admin", "admin", "sale_manager",
      "event_manager", "inventory_manager", "assistant",
    ];
    types.forEach((roleType) => {
      const state = reducer(initialState, onLogin({ roleType }));
      expect(state.user.roleType).toBe(roleType);
    });
  });
});

describe("adminSlice — onLogout", () => {
  it("limpia role y roleType", () => {
    const loggedIn = reducer(initialState, onLogin({ role: 1, roleType: "admin" }));
    const state = reducer(loggedIn, onLogout());
    expect(state.user.role).toBe("");
    expect(state.user.roleType).toBe("");
    expect(state.status).toBe("not-authenticated");
  });
});

/**
 * Guardar Company Info despachaba onLogout: la única forma que había de que el
 * dato nuevo llegara a la sesión era volver a loguearse. Eso echaba al usuario
 * de la app por editar un teléfono, y mientras tanto los recibos seguían
 * imprimiéndose con el companyData viejo — sin logo, si el logo se acababa de
 * subir.
 */
describe("adminSlice — onUpdateCompanyData", () => {
  const logged = reducer(
    initialState,
    onLogin({
      name: "Ana",
      email: "ana@test.com",
      companyData: {
        id: "co-1",
        company_name: "Bridges",
        company_logo: "",
        website: "bridges.org",
      },
    })
  );

  it("mezcla los campos nuevos sin perder los que no vinieron", () => {
    const state = reducer(
      logged,
      onUpdateCompanyData({ company_logo: "https://res.cloudinary.com/x.png" })
    );
    expect(state.user.companyData.company_logo).toBe(
      "https://res.cloudinary.com/x.png"
    );
    expect(state.user.companyData.id).toBe("co-1");
    expect(state.user.companyData.website).toBe("bridges.org");
  });

  it("permite borrar el logo con string vacío", () => {
    const withLogo = reducer(
      logged,
      onUpdateCompanyData({ company_logo: "https://res.cloudinary.com/x.png" })
    );
    const state = reducer(withLogo, onUpdateCompanyData({ company_logo: "" }));
    expect(state.user.companyData.company_logo).toBe("");
  });

  it("no toca la sesión: sigue autenticado y el resto del user queda igual", () => {
    const state = reducer(logged, onUpdateCompanyData({ company_name: "X" }));
    expect(state.status).toBe("authenticated");
    expect(state.user.email).toBe("ana@test.com");
  });

  it("ignora un payload que no es un objeto", () => {
    expect(
      reducer(logged, onUpdateCompanyData(null)).user.companyData.id
    ).toBe("co-1");
    expect(
      reducer(logged, onUpdateCompanyData("nope")).user.companyData.id
    ).toBe("co-1");
  });

  it("crea companyData si la sesión no traía ninguno", () => {
    const bare = reducer(initialState, onLogin({ email: "a@b.c" }));
    const state = reducer(bare, onUpdateCompanyData({ company_logo: "u" }));
    expect(state.user.companyData).toEqual({ company_logo: "u" });
  });
});
