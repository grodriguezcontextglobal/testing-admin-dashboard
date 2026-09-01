import { createSlice } from "@reduxjs/toolkit";

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    status: "checking", //authenticated, not-authenticated
    user: {
      name: undefined,
      lastName: undefined,
      email: undefined,
      password: undefined,
      company: undefined,
      role: undefined,
      roleType: undefined,
      imageProfile: undefined,
      rowImageProfile: undefined,
    },
    errorMessage: undefined,
    companyAccountStripe: undefined,
    companyInfo: undefined,
    mfaEnabled: false,
  },
  reducers: {
    onChecking: (state) => {
      state.status = "checking";
      state.user = [];
      state.errorMessage = undefined;
    },
    onLogin: (state, { payload }) => {
      state.status = "authenticated";
      state.user = payload;
      state.errorMessage = undefined;
      state.mfaEnabled =
        payload.data?.mfaEnabled || payload.mfaEnabled || false;
    },
    onLogout: (state) => {
      state.status = "not-authenticated";
      state.user = {
        name: "",
        lastName: "",
        email: "",
        password: "",
        company: "",
        role: "",
        roleType: "",
        imageProfile: "",
        rowImageProfile: undefined,
      };
      state.companyAccountStripe = undefined;
      state.companyInfo = undefined;
      state.mfaEnabled = false;
    },
    clearErrorMessage: (state) => {
      state.errorMessage = undefined;
    },
    onAddErrorMessage: (state, { payload }) => {
      state.errorMessage = payload;
    },
    onAddCompanyAccountStripe: (state, { payload }) => {
      state.companyAccountStripe = payload;
    },
    onUpdateMfaStatus: (state, { payload }) => {
      state.mfaEnabled = payload;
    },
    /**
     * Folds a saved company record back into the session.
     *
     * Saving Company Info used to dispatch onLogout, because a re-login was the
     * only thing that refreshed companyData. That threw the user out of the app
     * for editing a phone number, and until they came back the receipts kept
     * printing the stale record — with no letterhead, if the logo was what had
     * just been uploaded. Merges rather than replaces: the payload is the
     * update, not the whole company, and `id` is not in it.
     */
    onUpdateCompanyData: (state, { payload }) => {
      if (!payload || typeof payload !== "object") return;
      state.user = {
        ...state.user,
        companyData: { ...(state.user?.companyData ?? {}), ...payload },
      };
    },
    /**
     * Folds saved profile fields back into the session.
     *
     * The sibling of onUpdateCompanyData, for the same reason: saving "My
     * details" used to end with onLogout and a hard reload, because nothing
     * else put the new name, email or photo into the session. Changing your
     * own phone number should not sign you out.
     *
     * Merges rather than replaces, at both levels — the payload is the update,
     * not the whole user, and `data` carries the login response's own copy of
     * these fields, which the rest of the app still reads.
     *
     * Deliberately not onLogin: that one replaces `user` wholesale and
     * recomputes `mfaEnabled` from the payload, so re-using it for an edit can
     * quietly turn MFA off in the session.
     */
    onUpdateProfile: (state, { payload }) => {
      if (!payload || typeof payload !== "object") return;
      const { data: dataPatch, ...rootPatch } = payload;
      state.user = {
        ...state.user,
        ...rootPatch,
        ...(dataPatch && typeof dataPatch === "object"
          ? { data: { ...(state.user?.data ?? {}), ...dataPatch } }
          : {}),
      };
    },
  },
});

// action creators are generated for each case reducer function

export const {
  onChecking,
  onLogin,
  onLogout,
  onAddErrorMessage,
  clearErrorMessage,
  onAddCompanyAccountStripe,
  onUpdateMfaStatus,
  onUpdateCompanyData,
  onUpdateProfile,
} = adminSlice.actions;

export default adminSlice.reducer;
