import { createSlice } from "@reduxjs/toolkit";

const permissionsSlice = createSlice({
  name: "permission",
  initialState: {
    role: null,
    roleType: null,
    companyName: "",
    locations: [],
    categories: [],
  },
  reducers: {
    setPermissions: (state, { payload }) => {
      state.role = payload.role;
      state.roleType = payload.roleType;
      state.companyName = payload.companyName;
      state.locations = payload.locations ?? [];
      state.categories = payload.categories ?? [];
    },
    onClearPermissions: (state) => {
      state.role = null;
      state.roleType = null;
      state.companyName = "";
      state.locations = [];
      state.categories = [];
    },
  },
});

export const { setPermissions, onClearPermissions } = permissionsSlice.actions;

export default permissionsSlice.reducer;
