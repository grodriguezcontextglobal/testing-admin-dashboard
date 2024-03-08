import { createSlice } from '@reduxjs/toolkit';


const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    subscription: [],
    upgrade: [],
    subscriptionJSON: undefined,
  },
  reducers: {
    onAddSubscription: (state, { payload }) => {
      state.subscription = payload;
    },
    onUpgradeSubscription: (state, { payload }) => {
      state.upgrade = payload;
    },
    onRemoveSubscription: (state, { payload }) => {
      state.subscription = payload;
    },

    onAddNewSubscription: (state, { payload }) => {
      state.subscriptionJSON = payload;
    },
    onResetSubscriptionInfo: (state) => {
      state.subscription = []
      state.upgrade = []
      state.subscriptionJSON = undefined
    }
  },
});

// action creators are generated for each case reducer function

export const {
  onAddSubscription,
  onUpgradeSubscription,
  onRemoveSubscription,
  onAddNewSubscription,
  onResetSubscriptionInfo
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
