import { createContext } from "react";

// Provided by the inventory MainPage and read by the table, the filters and
// the search bar. In their own file so those children no longer import
// MainPage, which lazily imports them back.
export const SearchItemContext = createContext();
export const FilterOptionsContext = createContext();
