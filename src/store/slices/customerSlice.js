import { createSlice } from '@reduxjs/toolkit';
// import toolkit from '@reduxjs/toolkit';
// const { createSlice } = toolkit;

const customerSlice = createSlice({
  name: "customer",
  initialState: {
    customer: undefined,
    consumersOfEvent: [],
  },
  reducers: {
    onAddCustomerInfo: (state, { payload }) => {
      state.customer = payload;
    },
    onAddUsersOfEventList: (state, { payload }) => {
      state.consumersOfEvent = payload;
    },
    onResetCustomer: (state) => {
      state.customer = undefined;
      state.consumersOfEvent = [];
    },
  },
});

// action creators are generated for each case reducer function

export const { onAddCustomerInfo, onAddUsersOfEventList, onResetCustomer } =
  customerSlice.actions;

export default customerSlice.reducer;
