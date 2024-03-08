import { createSlice } from '@reduxjs/toolkit';


const staffDetailSlice = createSlice({
  name: "staffDetail",
  initialState: {
    profile: {},
  },
  reducers: {
    onAddStaffProfile: (state, { payload }) => {
      state.profile = payload;
    },
    onResetStaffProfile: (state) => {
      state.profile = {};
    },
  },
});

// action creators are generated for each case reducer function

export const { onAddStaffProfile, onResetStaffProfile } = staffDetailSlice.actions;

export default staffDetailSlice.reducer;
