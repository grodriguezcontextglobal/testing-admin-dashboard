import { createSlice } from '@reduxjs/toolkit';


const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    subscription: [],
    subscriptionRecord: [],
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
      state.subscriptionRecord = []
    }, 
    onAddSubscriptionRecord: (state, { payload }) => {
      state.subscriptionRecord = payload
    },
  },
});

// action creators are generated for each case reducer function

export const {
  onAddSubscription,
  onUpgradeSubscription,
  onRemoveSubscription,
  onAddNewSubscription,
  onResetSubscriptionInfo,
  onAddSubscriptionRecord
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
