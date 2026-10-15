import { combineReducers } from "@reduxjs/toolkit";
import adminSlice, { onLogout } from "./slices/adminSlice";
import articleSlide from "./slices/articleSlide";
import backgroundJobsSlice from "./slices/backgroundJobsSlice";
import customerSlice from "./slices/customerSlice";
import devicesHandleSlice from "./slices/devicesHandleSlice";
import eventSlice from "./slices/eventSlice";
import helperSlice from "./slices/helperSlice";
import memberSlice from "./slices/memberSlice";
import permissionsSlice from "./slices/permissions";
import searchBarResultSlice from "./slices/searchBarResultSlice";
import staffActivitySlice from "./slices/staffActivitySlice";
import staffDetailSlide from "./slices/staffDetailSlide";
import stripeSlice from "./slices/stripeSlice";
import subscriptionSlice from "./slices/subscriptionSlice";

export const appReducer = combineReducers({
  admin: adminSlice,
  article: articleSlide,
  backgroundJobs: backgroundJobsSlice,
  customer: customerSlice,
  devicesHandle: devicesHandleSlice,
  event: eventSlice,
  helper: helperSlice,
  member: memberSlice,
  permission: permissionsSlice, // permission slice
  searchResult: searchBarResultSlice,
  staffActivity: staffActivitySlice,
  staffDetail: staffDetailSlide,
  stripe: stripeSlice,
  subscription: subscriptionSlice,
});

/**
 * onLogout resets every slice, not only `admin`.
 *
 * Each logout used to call persistor.purge() and then dispatch its own list of
 * slice resets. Every dispatch made redux-persist write the store back to
 * localStorage, and the lists missed `member` (the last student opened, often
 * a minor), `searchResult`, `permission` and `staffActivity`; the expired-
 * session logout in App.jsx did not purge at all. Resetting here covers every
 * logout path and every slice added later. Every dispatcher of onLogout is a
 * real teardown (logout, expired session, inactivity, failed or abandoned
 * sign-in), so nothing needs to survive it.
 */
export const rootReducer = (state, action) =>
  appReducer(action.type === onLogout.type ? undefined : state, action);
