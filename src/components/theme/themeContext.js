import { createContext, useContext } from "react";

/**
 * The colour scheme, shared with whatever wants to read or change it.
 *
 * In its own file so `ThemeShell` exports only a component: a module that
 * exports both a component and a hook breaks React Fast Refresh, which is the
 * whole development loop here.
 */
export const ThemeContext = createContext(null);

/** The current mode, what it resolves to, and how to change it. */
export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside <ThemeShell>");
  }
  return value;
};
