import { describe, expect, it } from "vitest";

import { appReducer, rootReducer } from "./rootReducer";
import { onLogin, onLogout } from "./slices/adminSlice";
import { onAddCustomerInfo } from "./slices/customerSlice";
import { onAddMemberInfo } from "./slices/memberSlice";
import { onAddAdvanceSearch } from "./slices/searchBarResultSlice";
import { setPermissions } from "./slices/permissions";

/* Every logout called persistor.purge() and then dispatched a hand-written
   list of slice resets. Each dispatch made redux-persist write the store back
   to localStorage, and the lists left out `member` (the last student opened,
   a minor's record), `searchResult`, `permission` and `staffActivity`; the
   session-expired logout in App.jsx did not purge at all. So a logout left
   that data on disk. onLogout now resets every slice at the root. */
const initial = appReducer(undefined, { type: "@@INIT" });

const signedInWithData = () =>
  [
    onLogin({ name: "Ana", email: "ana@school.org", token: "jwt" }),
    onAddMemberInfo({ member_id: 7, first_name: "Juan", minor: 1, parent_guardian_email: "m@x.org" }),
    onAddCustomerInfo({ email: "consumer@x.org" }),
    onAddAdvanceSearch({ term: "Juan" }),
    setPermissions({ role: "1", roleType: "admin", companyName: "School", locations: ["A"], categories: [] }),
  ].reduce(rootReducer, undefined);

describe("rootReducer", () => {
  it("the fixture really fills the slices the old logouts forgot", () => {
    const state = signedInWithData();
    expect(state.member.memberInfo).not.toBeNull();
    expect(state.customer.customer).toBeDefined();
    expect(state.searchResult.advanceSearch).not.toBeNull();
    expect(state.permission.roleType).toBe("admin");
  });

  it("onLogout leaves every slice as a fresh store would, except the logged-out admin", () => {
    const state = rootReducer(signedInWithData(), onLogout());
    const { admin, ...rest } = state;
    const { admin: initialAdmin, ...initialRest } = initial;

    expect(rest).toEqual(initialRest);
    expect(admin.status).toBe("not-authenticated");
    expect(admin.user.email).toBe("");
    expect(admin.user.token).toBeUndefined();
    expect(initialAdmin.status).toBe("checking");
  });

  it("anything else goes through untouched", () => {
    const before = signedInWithData();
    const after = rootReducer(before, { type: "something/else" });
    expect(after).toBe(before);
  });
});
