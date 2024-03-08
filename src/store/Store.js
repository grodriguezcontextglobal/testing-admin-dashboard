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
import eventSlice from "./slices/eventSlice";
import stripeSlice from "./slices/stripeSlice";
import subscriptionSlice from "./slices/subscriptionSlice";
import helperSlice from "./slices/helperSlice";
import devicesHandleSlice from "./slices/devicesHandleSlice";
import customerSlice from "./slices/customerSlice";
import articleSlide from "./slices/articleSlide";
import searchBarResultSlice from "./slices/searchBarResultSlice";
import staffDetailSlide from "./slices/staffDetailSlide";
import staffActivitySlice from "./slices/staffActivitySlice";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
};

const reducers = combineReducers({
  admin: adminSlice,
  stripe: stripeSlice,
  event: eventSlice,
  subscription: subscriptionSlice,
  helper: helperSlice,
  devicesHandle: devicesHandleSlice,
  customer: customerSlice,
  article: articleSlide,
  searchResult: searchBarResultSlice,
  staffDetail: staffDetailSlide,
  staffActivity: staffActivitySlice
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