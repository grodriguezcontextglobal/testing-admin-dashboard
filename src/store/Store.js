import { configureStore } from "@reduxjs/toolkit";
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
import { stripPasswordsTransform } from "./persistTransforms";
import { rootReducer } from "./rootReducer";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  // Passwords never reach localStorage (persistTransforms.js).
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