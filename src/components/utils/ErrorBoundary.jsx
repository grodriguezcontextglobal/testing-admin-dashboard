import { Component } from "react";
import GrayButtonComponent from "../UX/buttons/GrayButton";

const PANEL = {
  border: "1px solid var(--error-300, #FDA29B)",
  background: "var(--error-25, #FFFBFA)",
  borderRadius: "12px",
  fontFamily: "Inter, system-ui, sans-serif",
  color: "var(--error-700, #B42318)",
};

// page-level: the original look, kept so existing usages don't shift
const PAGE_PANEL = { ...PANEL, padding: "24px", margin: "24px" };

// section-level: sits inline inside a results section, so no outer margin and
// full width of the section it replaces
const SECTION_PANEL = { ...PANEL, padding: "16px 20px", width: "100%" };

const PANEL = {
  border: "1px solid var(--error-300, #FDA29B)",
  background: "var(--error-25, #FFFBFA)",
  borderRadius: "12px",
  fontFamily: "Inter, system-ui, sans-serif",
  color: "var(--error-700, #B42318)",
};

// page-level: the original look, kept so existing usages don't shift
const PAGE_PANEL = { ...PANEL, padding: "24px", margin: "24px" };

// section-level: sits inline inside a results section, so no outer margin and
// full width of the section it replaces
const SECTION_PANEL = { ...PANEL, padding: "16px 20px", width: "100%" };

/**
 * Catches render-time errors in its children so a single component throwing
 * shows a readable fallback instead of blanking the whole page.
 * In dev it prints the error + component stack to aid debugging.
 *
 * Pass `title` + `compact` to scope the fallback to one part of a page — e.g.
 * one search-results section failing while the rest of the page still renders.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error(
      `ErrorBoundary caught${this.props.title ? ` (${this.props.title})` : ""}:`,
      error,
      info?.componentStack
    );
  }

  /**
   * A caught error would otherwise stick until "Try again" is pressed. Pass a
   * `resetKey` that changes when the inputs change (e.g. the search keyword) and
   * the boundary clears itself, so one bad result set doesn't poison the next.
   */
  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, info: null });
    }
  }

  render() {
    if (this.state.error) {
      const { title, compact } = this.props;
      return (
        <div
          role="alert"
          style={compact ? SECTION_PANEL : PAGE_PANEL}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: compact ? "16px" : undefined }}>
            {title
              ? `${title} couldn’t be displayed.`
              : "Something went wrong on this page."}
          </h3>
          <p style={{ margin: "0 0 12px", color: "var(--error-800, #7A271A)" }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          {import.meta.env.DEV && this.state.info?.componentStack && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "12px",
                color: "#667085",
                background: "#fff",
                padding: "12px",
                borderRadius: "8px",
                overflowX: "auto",
                maxHeight: "260px",
              }}
            >
              {this.state.info.componentStack}
            </pre>
          )}
          <GrayButtonComponent
            onClick={() => this.setState({ error: null, info: null })}
            styles={{ marginTop: "12px" }}
          >
            Try again
          </GrayButtonComponent>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
