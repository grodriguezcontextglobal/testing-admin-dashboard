import { createContext, useContext } from "react";
import { useInstallPrompt } from "./useInstallPrompt";

/**
 * Shares a single useInstallPrompt() instance across every consumer
 * (top banner, footer link, ...). The captured `beforeinstallprompt` event
 * can only be prompted once — two independent hook instances would each
 * hold their own copy, and the second consumer's `.prompt()` call would
 * throw once the first consumer had already used it.
 */
const InstallPromptContext = createContext(null);

export const InstallPromptProvider = ({ children }) => {
  const value = useInstallPrompt();
  return (
    <InstallPromptContext.Provider value={value}>
      {children}
    </InstallPromptContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- context + its accessor hook are meant to live together
export const useInstallPromptContext = () => {
  const context = useContext(InstallPromptContext);
  if (!context) {
    throw new Error(
      "useInstallPromptContext must be used within an InstallPromptProvider",
    );
  }
  return context;
};
