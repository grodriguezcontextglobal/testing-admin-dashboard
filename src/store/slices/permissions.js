import { createSlice } from "@reduxjs/toolkit";

const permissionsSlice = createSlice({
  name: "permission",
  initialState: {
    role: null,
    companyName: "",
    locations: [],
  },
  reducers: {
    setPermissions: (state, { payload }) => {
      state.role = payload.role;
      state.companyName = payload.companyName;
      state.locations = payload.locations;
    },
    onClearPermissions: (state) => {
      state.role = null;
      state.companyName = "";
      state.locations = [];
    },
  },
});

// action creators are generated for each case reducer function
export const { setPermissions, onClearPermissions } = permissionsSlice.actions;

export default permissionsSlice.reducer;
