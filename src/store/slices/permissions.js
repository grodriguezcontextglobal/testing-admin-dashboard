import { createSlice } from "@reduxjs/toolkit";

const permissionsSlice = createSlice({
  name: "permission",
  initialState: {
    role: null,
    roleType: null,
    companyName: "",
    locations: [],
  },
  reducers: {
    setPermissions: (state, { payload }) => {
      state.role = payload.role;
      state.roleType = payload.roleType;
      state.companyName = payload.companyName;
      state.locations = payload.locations;
    },
    onClearPermissions: (state) => {
      state.role = null;
      state.roleType = null;
      state.companyName = "";
      state.locations = [];
    },
  },
});

export const { setPermissions, onClearPermissions } = permissionsSlice.actions;

export default permissionsSlice.reducer;
