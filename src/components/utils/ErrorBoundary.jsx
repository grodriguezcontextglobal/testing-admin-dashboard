import { Component } from "react";

/**
 * Catches render-time errors in its children so a single component throwing
 * shows a readable fallback instead of blanking the whole page.
 * In dev it prints the error + component stack to aid debugging.
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
    console.error("ErrorBoundary caught:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: "24px",
            margin: "24px",
            border: "1px solid var(--error-300, #FDA29B)",
            background: "var(--error-25, #FFFBFA)",
            borderRadius: "12px",
            fontFamily: "Inter, system-ui, sans-serif",
            color: "var(--error-700, #B42318)",
          }}
        >
          <h3 style={{ margin: "0 0 8px" }}>Something went wrong on this page.</h3>
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
          <button
            onClick={() => this.setState({ error: null, info: null })}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              border: "1px solid #D0D5DD",
              borderRadius: "8px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
