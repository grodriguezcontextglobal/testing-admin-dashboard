import { combineReducers, configureStore } from "@reduxjs/toolkit";
// import pkg from '@reduxjs/toolkit';
// const {combineReducers, configureStore} = pkg;
import storage from "redux-persist/es/storage";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  persistStore,
} from "redux-persist";
// const { combineReducers, configureStore } = require("@reduxjs/toolkit");
// const storage = require("redux-persist/es/storage");
// const { persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, persistStore } = require("redux-persist");
import adminSlice from "./slices/adminSlice";
import articleSlide from "./slices/articleSlide";
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

const persistConfig = {
  key: "root",
  version: 1,
  storage,
};

const reducers = combineReducers({
  admin: adminSlice,
  article: articleSlide,
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

const persistedReducers = persistReducer(persistConfig, reducers);

const store = configureStore({
  reducer: persistedReducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

const persistor = persistStore(store);

export { store, persistor}