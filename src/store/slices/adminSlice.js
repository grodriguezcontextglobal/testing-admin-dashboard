import { createSlice } from '@reduxjs/toolkit';

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
    },
    errorMessage: undefined,
    companyAccountStripe: undefined,
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
      };
      state.companyAccountStripe = undefined;
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
} = adminSlice.actions;

export default adminSlice.reducer;
