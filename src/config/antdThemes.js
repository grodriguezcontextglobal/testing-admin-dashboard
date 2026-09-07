import { theme as antdTheme } from "antd";

/**
 * The antd theme, per colour scheme.
 *
 * Every value here is a literal on purpose: antd computes its palette in
 * JavaScript and cannot resolve a CSS variable. The same is true of the chart
 * configs (echarts/MUI X) — a `var()` in either place renders as nothing.
 *
 * `algorithm: darkAlgorithm` alone is not enough here, and it is worth knowing
 * why: this theme sets more than twenty explicit token values, and an explicit
 * token beats the algorithm. Switching only the algorithm would compute a dark
 * palette and then stamp the light greys straight back over it. So each mode
 * carries its own values, and the algorithm handles everything neither mode
 * names.
 *
 * The values mirror `styles/untitled-ui/tokens.css` — antd cannot read CSS
 * variables, so this is the one place the palette is written twice. When the
 * dark palette is finalised (see FRONTEND_theme_light_dark_system_plan.md),
 * both have to move together.
 */

const shared = {
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  borderRadius: 8,
  borderRadiusLG: 12,
  borderRadiusSM: 6,
  controlOutlineWidth: 4,
  controlHeight: 40,
  /* The action blue and Ember red read on both grounds, so they do not move:
     changing them would alter what the product looks like rather than which
     scheme it is in. */
  colorPrimary: "#155eef",
  colorLink: "#155eef",
};

const light = {
  ...shared,
  colorError: "#d15334",
  colorTextBase: "#171d1a",
  // Untitled UI neutrals (khaki-warmed gray ramp from tokens.css)
  colorBorder: "#c6c7bb",
  colorBorderSecondary: "#ddded6",
  colorSplit: "#ddded6",
  colorTextSecondary: "#5d615a",
  colorTextTertiary: "#777b73",
  colorTextPlaceholder: "#777b73",
  // Untitled UI focus ring: 4px soft ring in the action-blue family
  controlOutline: "#d1e0ff",
  colorBgMask: "rgba(23, 29, 26, 0.6)",
  boxShadow:
    "0 12px 16px -4px rgba(23, 29, 26, 0.08), 0 4px 6px -2px rgba(23, 29, 26, 0.03)",
  boxShadowSecondary:
    "0 12px 16px -4px rgba(23, 29, 26, 0.08), 0 4px 6px -2px rgba(23, 29, 26, 0.03)",
};

const dark = {
  ...shared,
  /* Ember lifted off the dark ground; the light shade is unreadable on it. */
  colorError: "#dd6a48",
  colorTextBase: "#f4f6f0",
  colorBgBase: "#101310",
  colorBorder: "#414740",
  colorBorderSecondary: "#2f352e",
  colorSplit: "#2f352e",
  colorTextSecondary: "#b9beb4",
  colorTextTertiary: "#9aa096",
  colorTextPlaceholder: "#9aa096",
  controlOutline: "rgba(21, 94, 239, 0.35)",
  colorBgMask: "rgba(0, 0, 0, 0.7)",
  boxShadow:
    "0 12px 16px -4px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
  boxShadowSecondary:
    "0 12px 16px -4px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
};

const components = {
  light: {
    Tooltip: { colorBgSpotlight: "#171d1a" },
    Table: {
      headerBg: "#f7f7f4",
      headerColor: "#5d615a",
      headerSplitColor: "transparent",
    },
    Select: { optionSelectedBg: "#f7f7f4", optionActiveBg: "#f7f7f4" },
    Modal: { titleFontSize: 18 },
  },
  dark: {
    Tooltip: { colorBgSpotlight: "#2f352e" },
    Table: {
      headerBg: "#1a1e19",
      headerColor: "#b9beb4",
      headerSplitColor: "transparent",
    },
    Select: { optionSelectedBg: "#232823", optionActiveBg: "#1a1e19" },
    Modal: { titleFontSize: 18 },
  },
};

/**
 * @param {"light"|"dark"} resolved - the scheme actually being painted
 */
export const antdThemeFor = (resolved) =>
  resolved === "dark"
    ? {
        algorithm: antdTheme.darkAlgorithm,
        token: dark,
        components: components.dark,
      }
    : { token: light, components: components.light };
