import { createSlice } from '@reduxjs/toolkit';


const helperSlice = createSlice({
  name: "helper",
  initialState: {
    triggerModal: false,
    switchingCompanyInfo: false,
    receiverToReplaceObject: {},
    receiverIdToUpdateInPool: undefined,
    dataToWheelsOnHomePage: [],
    keyValueForDataDisplayInWheel: undefined,
  },
  reducers: {
    onTriggerModalToReplaceReceiver: (state, { payload }) => {
      state.triggerModal = payload;
    },
    onReceiverObjectToReplace: (state, { payload }) => {
      state.receiverToReplaceObject = payload;
    },
    onCollectIdToUpdateInPool: (state, { payload }) => {
      state.receiverIdToUpdateInPool = payload;
    },
    onAddDataToWheelsOnHomePage: (state, { payload }) => {
      state.dataToWheelsOnHomePage = payload;
    },
    onAddKeyValueForWheelsDisplayed: (state, { payload }) => {
      state.keyValueForDataDisplayInWheel = payload;
    },
    onResetHelpers: (state) => {
      state.triggerModal = false
      state.receiverToReplaceObject = {}
      state.receiverIdToUpdateInPool = undefined
      state.dataToWheelsOnHomePage = []
      state.keyValueForDataDisplayInWheel = undefined
    },
    onSwitchingCompany:(state, { payload }) => {
      state.switchingCompanyInfo = payload
    }
  },
});

// action creators are generated for each case reducer function

export const {
  onTriggerModalToReplaceReceiver,
  onReceiverObjectToReplace,
  onCollectIdToUpdateInPool,
  onAddDataToWheelsOnHomePage,
  onAddKeyValueForWheelsDisplayed,
  onResetHelpers,
  onSwitchingCompany
} = helperSlice.actions;

export default helperSlice.reducer;
