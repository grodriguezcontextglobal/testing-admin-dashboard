import { createSlice } from '@reduxjs/toolkit';


const eventSlice = createSlice({
  name: "event",
  initialState: {
    choice: "checking", //authenticated, not-authenticated
    company: "checking",
    event: [],
    eventSettingUpProcess: {
      eventInfoDetail: {
        eventName: undefined,
        eventLocation: undefined,
        address: undefined,
        building: undefined,
        floor: undefined,
        phoneNumber: [],
        merchant: false,
        dateBegin: new Date().toUTCString(),
        dateEnd: new Date().toUTCString(),
      },
      staff: {
        adminUser: [],
        headsetAttendees: [],
      },
    },
    eventInfoDetail: {
      eventName: undefined,
      eventLocation: undefined,
      address: undefined,
      building: undefined,
      floor: undefined,
      phoneNumber: [],
      merchant: false,
      dateBegin: new Date().toUTCString(),
      dateEnd: new Date().toUTCString(),
  },
    staff: {
      adminUser: [],
      headsetAttendees: [],
    },
    deviceSetup: [],
    contactInfo: undefined,
    qrCodeLink: undefined,
    eventsPerAdmin: [],
    existingDevicesInDBToBeUpdatedAfterSelectedInEvent: []
  },
  reducers: {
    onSelectEvent: (state, { payload }) => {
      state.choice = payload;
    },
    onSelectCompany: (state, { payload }) => {
      state.company = payload;
    },
    onAddEventData: (state, { payload }) => {
      state.event = payload;
    },
    onAddEventInfoDetail: (state, { payload }) => {
      state.eventInfoDetail = payload;
    },
    onAddEventStaff: (state, { payload }) => {
      state.staff = payload;
    },
    onAddDeviceSetup: (state, { payload }) => {
      state.deviceSetup = payload;
    },
    onAddContactInfo: (state, { payload }) => {
      state.contactInfo = payload;
    },
    onAddQRCodeLink: (state, { payload }) => {
      state.qrCodeLink = payload;
    },
    onAddListEventPermitPerAdmin: (state, { payload }) => {
      state.eventsPerAdmin = payload;
    },
    onResetEventInfo: (state) => {
      state.choice = "checking";
      state.company = "checking";
      state.event = [];
      state.eventInfoDetail = {
        eventName: undefined,
        eventLocation: undefined,
        address: undefined,
        building: undefined,
        floor: undefined,
        phoneNumber: [],
        merchant: false,
        dateBegin: new Date().toDateString(),
        dateEnd: new Date().toDateString(),
      };
      state.staff = {
        adminUser: [],
        headsetAttendees: [],
      };
      state.deviceSetup = [];
      state.contactInfo = undefined;
      state.qrCodeLink = undefined;
      state.eventsPerAdmin = [];
    },
    onAddExistingDevicesInDBToBeUpdatedInDBAfterBeingSelectedInEvent: (state, { payload }) => {
      state.existingDevicesInDBToBeUpdatedAfterSelectedInEvent = payload;
    },

  },
});

// action creators are generated for each case reducer function

export const {
  onSelectEvent,
  onSelectCompany,
  onAddEventData,
  onAddEventInfoDetail,
  onAddEventStaff,
  onAddDeviceSetup,
  onAddContactInfo,
  onAddQRCodeLink,
  onAddListEventPermitPerAdmin,
  onResetEventInfo,
  onAddExistingDevicesInDBToBeUpdatedInDBAfterBeingSelectedInEvent
} = eventSlice.actions;

export default eventSlice.reducer;
