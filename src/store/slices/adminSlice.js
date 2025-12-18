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
} = adminSlice.actions;

export default adminSlice.reducer;
