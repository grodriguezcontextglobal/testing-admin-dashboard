import { createSlice } from '@reduxjs/toolkit'
// import pkg from '@reduxjs/toolkit';
// const {createSlice} = pkg;

const articleSlice = createSlice({
    name: 'article',
    initialState: {
        articleToEdit: undefined
    },
    reducers: {
        onAddArticleToEdit: (state, { payload }) => {
            state.articleToEdit = payload
        },
        onResetArticleEdited: (state) => {
            state.articleToEdit = undefined
        }
    },
});

// action creators are generated for each case reducer function

export const { onAddArticleToEdit, onResetArticleEdited } = articleSlice.actions;

export default articleSlice.reducer;
