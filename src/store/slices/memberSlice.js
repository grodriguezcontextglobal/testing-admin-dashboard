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
    onRemoveMemberInfo: (state) => {
      state.memberInfo = null;
    },
  },
});

// action creators are generated for each case reducer function

export const {onAddMemberInfo, onRemoveMemberInfo} = memberSlice.actions;

export default memberSlice.reducer;
