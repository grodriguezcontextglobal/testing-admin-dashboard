import { createSlice } from '@reduxjs/toolkit';


const stripeSlice = createSlice({
  name: "stripe",
  initialState: {
    customer: undefined,
    paymentIntent: [],
    paymentIntentSelected: undefined,
    paymentIntentDetailSelected: [],
    paymentIntentReceiversAssigned: undefined,
    updatePaymentMethodInSubscription: null
  },
  reducers: {
    onAddNewPaymentIntent: (state, { payload }) => {
      state.paymentIntent.splice(0, 1, payload);
    },
    onAddPaymentIntentSelected: (state, { payload }) => {
      state.paymentIntentSelected = payload;
    },
    onAddPaymentIntentDetailSelected: (state, { payload }) => {
      state.paymentIntentDetailSelected = payload;
    },
    onAddDevicesAssignedInPaymentIntent: (state, { payload }) => {
      state.paymentIntentReceiversAssigned = payload;
    },
    onAddCustomer: (state, { payload }) => {
      state.customer = payload;
    },
    onResetStripesInfo: (state) => {
      state.customer = undefined
      state.paymentIntent = []
      state.paymentIntentDetailSelected = []
      state.paymentIntentReceiversAssigned = undefined
      state.paymentIntentReceiversAssigned = undefined
    },
    onAddNewPaymentMethodInSubscription: (state, { payload }) => {
      state.updatePaymentMethodInSubscription = payload
    },
  },
});

export default stripeSlice.reducer;

// Action creators are generated for each case reducer function
export const {
  onAddNewPaymentIntent,
  onAddPaymentIntentSelected,
  onAddPaymentIntentDetailSelected,
  onAddDevicesAssignedInPaymentIntent,
  onAddCustomer,
  onResetStripesInfo,
  onAddNewPaymentMethodInSubscription
} = stripeSlice.actions;
