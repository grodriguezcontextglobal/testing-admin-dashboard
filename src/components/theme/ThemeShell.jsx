import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ConfigProvider } from "antd";
import PropTypes from "prop-types";
import { useMemo } from "react";
import { antdThemeFor } from "../../config/antdThemes";
import useThemePreference from "../../hooks/useThemePreference";
import { ThemeContext } from "./themeContext";

/**
 * One colour scheme for three styling systems.
 *
 * The app paints through CSS variables, antd and MUI, and none of them can see
 * the others. The variables flip on `data-theme` (styles/untitled-ui/tokens.css),
 * antd needs a theme object handed to it, and **MUI needs a ThemeProvider that
 * this project never had** — without one every MUI component renders MUI's own
 * light palette, which is most of the form controls in the app. This is the one
 * place all three are told the same thing.
 */
const ThemeShell = ({ children, renderEmpty }) => {
  const theme = useThemePreference();
  const { resolved } = theme;

  const antd = useMemo(() => antdThemeFor(resolved), [resolved]);

  /* Only what MUI needs to stop being light. The palette proper lives in the
     CSS variables; this exists so MUI's own components — OutlinedInput, Grid,
     Typography — land on the same ground as everything around them. */
  const mui = useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolved,
          primary: { main: "#155eef" },
          error: { main: resolved === "dark" ? "#dd6a48" : "#d15334" },
          background:
            resolved === "dark"
              ? { default: "#101310", paper: "#1a1e19" }
              : { default: "#f1f1f1", paper: "#ffffff" },
          text:
            resolved === "dark"
              ? { primary: "#f4f6f0", secondary: "#b9beb4" }
              : { primary: "#171d1a", secondary: "#5d615a" },
        },
        typography: {
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        },
      }),
    [resolved]
  );

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeProvider theme={mui}>
        <ConfigProvider theme={antd} renderEmpty={renderEmpty}>
          {children}
        </ConfigProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

ThemeShell.propTypes = {
  children: PropTypes.node,
  /** Forwarded so moving ConfigProvider in here changes nothing else. */
  renderEmpty: PropTypes.func,
};

export default ThemeShell;
