import { createSlice } from '@reduxjs/toolkit';


const devicesHandleSlice = createSlice({
  name: "devicesHandle",
  initialState: {
    receiversLimit: undefined,
    deviceSelection: 0,
    deviceInfoSelected: undefined,
    openModalToAssignDevice: false,
    deviceSelectionPaidTransaction: undefined,
  },
  reducers: {
    onCheckDevicesLimitAssignation: (state, { payload }) => {
      state.receiversLimit = payload;
    },
    onAddDevicesSelection: (state, { payload }) => {
      state.deviceSelection = payload;
    },
    onAddDeviceToDisplayInQuickGlance: (state, { payload }) => {
      state.deviceInfoSelected = payload;
    },
    onResetDeviceInQuickGlance: (state) => {
      state.deviceInfoSelected = undefined;
    },
    onOpenDeviceAssignmentModalFromSearchPage: (state, { payload }) => {
      state.openModalToAssignDevice = payload;
    },
    onAddDevicesSelectionPaidTransactions: (state, { payload }) => {
      state.deviceSelectionPaidTransaction = payload;
    },
    onResetDevicesHandle: (state) => {
      state.receiversLimit = undefined;
      state.deviceSelection = 0;
      state.deviceInfoSelected = undefined;
      state.openModalToAssignDevice = false;
      state.deviceSelectionPaidTransaction = undefined;
    },
  },
});

// action creators are generated for each case reducer function

export const {
  onCheckDevicesLimitAssignation,
  onAddDevicesSelection,
  onAddDeviceToDisplayInQuickGlance,
  onResetDeviceInQuickGlance,
  onOpenDeviceAssignmentModalFromSearchPage,
  onAddDevicesSelectionPaidTransactions,
  onResetDevicesHandle
} = devicesHandleSlice.actions;

export default devicesHandleSlice.reducer;
