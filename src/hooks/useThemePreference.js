import { useCallback, useEffect, useState } from "react";
import { FEATURE_THEME_SWITCH } from "../config/featureFlags";
import {
  DEFAULT_THEME_MODE,
  nextThemeMode,
  persistThemeMode,
  readThemeMode,
  resolveTheme,
  themeAttribute,
} from "../config/theme";

const QUERY = "(prefers-color-scheme: dark)";

/** What the OS asks for right now, or light where nobody can be asked. */
const osPrefersDark = () => {
  try {
    return window.matchMedia?.(QUERY).matches ?? false;
  } catch {
    return false;
  }
};

/**
 * The chosen theme, the theme actually painted, and how to change it.
 *
 * Two pieces of state rather than one, because they answer different
 * questions: `mode` is what the user picked and is remembered, `resolved` is
 * what is on screen. They differ exactly when the choice is `system` — and
 * that is the case worth handling, because the OS can flip at dusk while the
 * tab sits open. The listener stays attached for that.
 *
 * Applying `data-theme` here rather than in CSS is what lets antd and MUI
 * follow along: neither can read a CSS variable, so both need the resolved
 * value handed to them (see `config/antdThemes.js`).
 */
export const useThemePreference = () => {
  const [mode, setMode] = useState(readThemeMode);
  const [prefersDark, setPrefersDark] = useState(osPrefersDark);

  /* Only meaningful while the choice is `system`, but kept attached always: it
     costs nothing and removes a whole class of "stale after switching back". */
  useEffect(() => {
    let media;
    try {
      media = window.matchMedia?.(QUERY);
    } catch {
      return undefined;
    }
    if (!media?.addEventListener) return undefined;

    const onChange = (event) => setPrefersDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  /* Parked: the palette is not finished, so nothing may paint dark even for
     someone whose stored preference says so. The preference is read and kept,
     just not honoured, so turning the flag on restores it. */
  const resolved = FEATURE_THEME_SWITCH
    ? resolveTheme(mode, prefersDark)
    : DEFAULT_THEME_MODE;

  /* `system` stamps nothing, which is the whole mechanism: with no attribute
     the media query in tokens.css decides.
     Parked, that same absence is a hole rather than a feature — the media
     query would still paint dark for anyone whose OS is dark. So with the flag
     off the attribute is stamped "light" explicitly, which is what
     :root:not([data-theme="light"]) is written to lose against. */
  useEffect(() => {
    const attribute = FEATURE_THEME_SWITCH ? themeAttribute(mode) : "light";
    const root = document.documentElement;
    if (attribute) root.setAttribute("data-theme", attribute);
    else root.removeAttribute("data-theme");
  }, [mode]);

  const choose = useCallback((next) => {
    persistThemeMode(next);
    setMode(next);
  }, []);

  const cycle = useCallback(() => {
    setMode((current) => {
      const next = nextThemeMode(current);
      persistThemeMode(next);
      return next;
    });
  }, []);

  return { mode, resolved, choose, cycle };
};

export default useThemePreference;
