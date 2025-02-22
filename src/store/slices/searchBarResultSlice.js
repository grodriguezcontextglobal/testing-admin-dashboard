import { createSlice } from "@reduxjs/toolkit";
// import pkg from '@reduxjs/toolkit';
// const {createSlice} = pkg;
const searchBarResultSlice = createSlice({
  name: "searchBarResult",
  initialState: {
    searchResult: [],
    searchValue: undefined,
    advanceSearch: null,
  },
  reducers: {
    onAddNewResult: (state, { payload }) => {
      state.searchResult = payload;
    },
    onResetResult: (state) => {
      state.searchResult = [];
    },
    onAddSearchValue: (state, { payload }) => {
      state.searchValue = payload;
    },
    onResetSearchValue: (state) => {
      state.searchValue = undefined;
    },
    onAddAdvanceSearch: (state, { payload }) => {
      state.advanceSearch = payload;
    },
  },
});

// action creators are generated for each case reducer function

export const {
  onAddNewResult,
  onResetResult,
  onAddSearchValue,
  onResetSearchValue,
  onAddAdvanceSearch,
} = searchBarResultSlice.actions;

export default searchBarResultSlice.reducer;
