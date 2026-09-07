import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_STORAGE_KEYS } from "../api/sessionHeaders";
import {
  DEFAULT_THEME_MODE,
  THEME_MODES,
  THEME_STORAGE_KEY,
  nextThemeMode,
  persistThemeMode,
  readThemeMode,
  resolveTheme,
  themeAttribute,
} from "./theme";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("THEME_MODES", () => {
  it("offers exactly the three the product asked for", () => {
    expect(THEME_MODES).toEqual(["light", "dark", "system"]);
  });

  it("starts on light, which is what the app has always been", () => {
    expect(DEFAULT_THEME_MODE).toBe("light");
  });
});

describe("resolveTheme", () => {
  it("takes an explicit choice at its word", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("asks the operating system only for `system`", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("falls back to light for anything it does not recognise", () => {
    // A stored value from a future version, or a hand-edited one.
    expect(resolveTheme("solarized", true)).toBe("light");
    expect(resolveTheme(undefined, true)).toBe("light");
  });
});

describe("themeAttribute", () => {
  it("stamps the root element for an explicit choice", () => {
    expect(themeAttribute("light")).toBe("light");
    expect(themeAttribute("dark")).toBe("dark");
  });

  it("stamps NOTHING for `system`", () => {
    // The whole mechanism: with no attribute, the CSS media query decides, and
    // the OS can change under a running tab without the app noticing. Writing
    // `data-theme="system"` would make every selector need a third case.
    expect(themeAttribute("system")).toBeNull();
    expect(themeAttribute("nonsense")).toBeNull();
  });
});

describe("nextThemeMode", () => {
  it("cycles in the order the one button walks through", () => {
    expect(nextThemeMode("light")).toBe("dark");
    expect(nextThemeMode("dark")).toBe("system");
    expect(nextThemeMode("system")).toBe("light");
  });

  it("recovers from a value it does not know", () => {
    expect(nextThemeMode("whatever")).toBe("light");
  });
});

describe("readThemeMode / persistThemeMode", () => {
  it("remembers a choice", () => {
    persistThemeMode("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(readThemeMode()).toBe("dark");
  });

  it("is light before anyone has chosen", () => {
    expect(readThemeMode()).toBe(DEFAULT_THEME_MODE);
  });

  it("ignores a stored value that is not a mode", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "midnight");
    expect(readThemeMode()).toBe(DEFAULT_THEME_MODE);
  });

  it("refuses to persist a value that is not a mode", () => {
    persistThemeMode("midnight");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("survives storage being unavailable", () => {
    // A private window, or a browser set to block site data: reading and
    // writing both throw. A theme preference is not worth a crashed app.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readThemeMode()).toBe(DEFAULT_THEME_MODE);
    expect(() => persistThemeMode("dark")).not.toThrow();
  });
});

describe("the theme key is not session state", () => {
  it("is left out of SESSION_STORAGE_KEYS on purpose", () => {
    // That list is cleared at every logout. A theme is a per-device
    // preference, not part of a session: putting it there would make the user
    // choose their theme again every single time they signed in.
    expect(SESSION_STORAGE_KEYS).not.toContain(THEME_STORAGE_KEY);
  });
});
