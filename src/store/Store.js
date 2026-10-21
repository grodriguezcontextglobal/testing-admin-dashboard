import { configureStore } from "@reduxjs/toolkit";
// import pkg from '@reduxjs/toolkit';
// const {combineReducers, configureStore} = pkg;
import { createSplitStorage } from "./splitStorage";
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
import { stripPasswordsTransform } from "./persistTransforms";
import { rootReducer } from "./rootReducer";

/* A storage that throws (blocked site data, some private windows) degrades to
   no persistence instead of taking the app down. */
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const webStorage = (name) => {
  try {
    const candidate = window[name];
    const probe = "__devitrak_storage_probe__";
    candidate.setItem(probe, probe);
    candidate.removeItem(probe);
    return candidate;
  } catch {
    return noopStorage;
  }
};

const persistConfig = {
  key: "root",
  version: 1,
  // The session in localStorage; people's records in sessionStorage, gone
  // when the tab closes (splitStorage.js, FedRAMP F1.4).
  storage: createSplitStorage({
    persistent: webStorage("localStorage"),
    session: webStorage("sessionStorage"),
  }),
  // Passwords never reach either (persistTransforms.js).
  transforms: [stripPasswordsTransform],
};

const persistedReducers = persistReducer(persistConfig, rootReducer);

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