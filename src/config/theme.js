/**
 * Which theme the app is wearing, and where that choice lives.
 *
 * Three modes, and `system` is not a third palette — it is the absence of a
 * choice. An explicit light or dark stamps `data-theme` on the root element;
 * `system` stamps nothing, so `prefers-color-scheme` decides and the OS can
 * change under a running tab without the app doing anything. Writing
 * `data-theme="system"` would force every selector to handle a third case and
 * would break exactly when someone flips their OS at dusk.
 *
 * Pure and storage-only: applying the theme is the shell's job (see
 * `useAppliedTheme`), because it also has to reach antd and MUI, which keep
 * their own palettes.
 */

export const THEME_MODES = ["light", "dark", "system"];

/** What the app has always looked like, and what it stays until asked. */
export const DEFAULT_THEME_MODE = "light";

/**
 * Deliberately NOT in `SESSION_STORAGE_KEYS` (`src/api/sessionHeaders.js`).
 * That list is cleared at every logout, and a theme is a per-device
 * preference: putting it there would make the user pick their theme again on
 * every sign-in. A test pins this.
 */
export const THEME_STORAGE_KEY = "devitrak-theme";

const isMode = (value) => THEME_MODES.includes(value);

/**
 * The palette to actually paint.
 *
 * @param {string} mode - the stored preference
 * @param {boolean} prefersDark - what `prefers-color-scheme: dark` reports
 * @returns {"light"|"dark"}
 */
export const resolveTheme = (mode, prefersDark) => {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  /* `system`, and anything unrecognised, follow the OS. An unknown value can
     reach here from a newer version of the app or a hand-edited key. */
  if (mode === "system") return prefersDark ? "dark" : "light";
  return DEFAULT_THEME_MODE;
};

/**
 * The value for `data-theme` on the root element, or null to stamp nothing.
 *
 * @param {string} mode
 * @returns {"light"|"dark"|null}
 */
export const themeAttribute = (mode) =>
  mode === "light" || mode === "dark" ? mode : null;

/** The order one button walks through: light → dark → system → light. */
export const nextThemeMode = (mode) => {
  const index = THEME_MODES.indexOf(mode);
  if (index === -1) return DEFAULT_THEME_MODE;
  return THEME_MODES[(index + 1) % THEME_MODES.length];
};

/**
 * The stored preference, or the default.
 *
 * Reading storage throws in a private window and in browsers set to block
 * site data. A theme preference is not worth a crashed app, so every access
 * here is guarded.
 */
export const readThemeMode = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isMode(stored) ? stored : DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
};

/** Remembers a choice, and quietly does nothing if it cannot. */
export const persistThemeMode = (mode) => {
  if (!isMode(mode)) return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* Nothing to do and nothing to tell the user: the theme still applied for
       this tab, it just will not be remembered. */
  }
};
