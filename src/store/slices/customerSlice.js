import { createSlice } from '@reduxjs/toolkit';
// import toolkit from '@reduxjs/toolkit';
// const { createSlice } = toolkit;

const customerSlice = createSlice({
  name: "customer",
  initialState: {
    customer: undefined,
    consumersOfEvent: [],
    transaction: null
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
    onAddTransactionInfo: (state, { payload }) => {
      state.transaction = payload;
    },
  },
});

// action creators are generated for each case reducer function

export const { onAddCustomerInfo, onAddUsersOfEventList, onResetCustomer, onAddTransactionInfo } =
  customerSlice.actions;

export default customerSlice.reducer;
