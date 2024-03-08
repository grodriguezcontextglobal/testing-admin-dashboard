import { createSlice } from '@reduxjs/toolkit';


const staffActivitySlice = createSlice({
  name: "staffActivity",
  initialState: {
    staffActivity: undefined,
  },
  reducers: {
    onAddStaffActivityData: (state, { payload }) => {
      state.staffActivity = payload;
    },
    onResetStaffActivityData: (state) => {
      state.staffActivity = undefined;
    },
  },
});

// action creators are generated for each case reducer function

export const { onAddStaffActivityData, onResetStaffActivityData } = staffActivitySlice.actions;

export default staffActivitySlice.reducer;
