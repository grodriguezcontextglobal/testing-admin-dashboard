import { createSlice } from '@reduxjs/toolkit';
// import pkg from '@reduxjs/toolkit';
// const {createSlice} = pkg;
const searchBarResultSlice = createSlice({
    name: 'searchBarResult',
    initialState: {
        searchResult: [],
        searchValue: undefined
    },
    reducers: {
        onAddNewResult: (state, { payload }) => {
            state.searchResult = payload
        },
        onResetResult: (state) => {
            state.searchResult = []
        },
        onAddSearchValue: (state, { payload }) => {
            state.searchValue = payload
        },
        onResetSearchValue: (state) => {
            state.searchValue = undefined
        },
    },
});

// action creators are generated for each case reducer function

export const { onAddNewResult, onResetResult, onAddSearchValue, onResetSearchValue } = searchBarResultSlice.actions;

export default searchBarResultSlice.reducer;