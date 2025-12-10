import { createSlice } from "@reduxjs/toolkit";

const memberSlice = createSlice({
  name: "member",
  initialState: {
    memberInfo: null,
  },
  reducers: {
    onAddMemberInfo: (state, { payload }) => {
      state.memberInfo = payload;
    },
  },
});

// action creators are generated for each case reducer function

export const {onAddMemberInfo} = memberSlice.actions;

export default memberSlice.reducer;
