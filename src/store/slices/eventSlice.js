import { createSlice } from "@reduxjs/toolkit";


/**
 * An event's staff, always with both lists.
 *
 * Five places in the creation wizard read `staff.adminUser.length` with no
 * guard, and the object arrives from outside by three routes: a draft being
 * resumed, the event the server returns after editing staff, and whatever
 * redux-persist rehydrates from an earlier session. A draft abandoned at step
 * one never reached the staff step, so its document carries `staff: {}` —
 * which is how step one started crashing with "Cannot read properties of
 * undefined (reading 'length')" (reported 2026-10-06).
 *
 * The shape is settled here rather than with a `?.` at each read: with
 * `?.length === 0`, a missing list would read as "there is staff".
 */
export const normalizeEventStaff = (staff) => {
  const source = staff && typeof staff === "object" && !Array.isArray(staff) ? staff : {};
  return {
    ...source,
    adminUser: Array.isArray(source.adminUser) ? source.adminUser : [],
    headsetAttendees: Array.isArray(source.headsetAttendees) ? source.headsetAttendees : [],
  };
};

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
        legal_documents_list: [],
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
      legal_documents_list: [],
    },
    staff: {
      adminUser: [],
      headsetAttendees: [],
    },
    deviceSetup: [],
    extraServiceNeeded: false,
    extraServiceListSetup: [],
    contactInfo: undefined,
    qrCodeLink: undefined,
    eventsPerAdmin: {
      adminUser: [],
      headsetAttendees: [],
    },
    existingDevicesInDBToBeUpdatedAfterSelectedInEvent: [],
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
      state.staff = normalizeEventStaff(payload);
    },
    onAddDeviceSetup: (state, { payload }) => {
      state.deviceSetup = payload;
    },
    onAddExtraServiceNeeded: (state, { payload }) => {
      state.extraServiceNeeded = payload;
    },

    onAddExtraServiceListSetup: (state, { payload }) => {
      state.extraServiceListSetup = payload;
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
      state.extraServiceNeeded = false;
      state.extraServiceListSetup = [];
      state.contactInfo = undefined;
      state.qrCodeLink = undefined;
      state.eventsPerAdmin = [];
    },
    onAddExistingDevicesInDBToBeUpdatedInDBAfterBeingSelectedInEvent: (
      state,
      { payload }
    ) => {
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
  onAddExistingDevicesInDBToBeUpdatedInDBAfterBeingSelectedInEvent,
  onAddExtraServiceNeeded,
  onAddExtraServiceListSetup,
} = eventSlice.actions;

export default eventSlice.reducer;
