import { NavLink, Outlet } from "react-router";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Boxes,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Receipt,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import { dashboardUrl } from "../../config/consoleHosts";
import { PLATFORM_CONSOLE_SAMPLE_DATA } from "../../config/featureFlags";
import useLogout from "../../hooks/useLogout";
import { createPlatformMockAdapter } from "./utils/mock/platformMockAdapter";

// Demo mode: answer /api/platform/* from invented sample data. Installed when
// this module loads, which is before any console page renders and asks for
// data. Allowed in a build, so the notice below is not optional.
if (PLATFORM_CONSOLE_SAMPLE_DATA) {
  devitrakApiPlatform.defaults.adapter = createPlatformMockAdapter();
}

// Devitrak Admin Console shell: its own side menu, so nothing from a client
// company's navigation shows here (FRONTEND_admin_console_plan_2026-11-11.md, F6).
const SECTIONS = [
  { to: "overview", label: "Overview", Icon: LayoutDashboard },
  { to: "clients", label: "Clients", Icon: Building2 },
  { to: "inventory", label: "Inventory", Icon: Boxes },
  { to: "transactions", label: "Transactions", Icon: Receipt },
  { to: "events", label: "Events", Icon: CalendarDays },
  { to: "people", label: "Members & consumers", Icon: Users },
];

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minHeight: "44px",
  padding: "0 12px",
  borderRadius: "8px",
  textDecoration: "none",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: isActive ? 600 : 500,
  color: isActive ? "var(--basewhite, #fff)" : "var(--brand-100, #c3d4e4)",
  background: isActive ? "var(--brand-500, #0a2f52)" : "transparent",
});

const exitStyle = {
  marginTop: "12px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "40px",
  padding: "0 12px",
  borderRadius: "8px",
  textDecoration: "none",
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--brand-200, #8fb0cc)",
};

const PlatformLayout = () => {
  const { user } = useSelector((state) => state.admin);
  const logout = useLogout();
  const operatorName = [user?.name, user?.lastName].filter(Boolean).join(" ") || "Devitrak staff";
  const initials =
    [user?.name, user?.lastName]
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "DV";

  return (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "stretch",
      width: "100%",
      minHeight: "100dvh",
      background: "var(--gray-50, #f8f9fb)",
      boxSizing: "border-box",
    }}
  >
    <nav
      aria-label="Admin console"
      style={{
        flex: "1 1 232px",
        maxWidth: "264px",
        background: "var(--brand-600, #021833)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        boxSizing: "border-box",
        // Stays put while a long list scrolls, so the section you are in and
        // the name every read is logged under are always on screen.
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100dvh",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px 20px" }}>
        <div
          aria-hidden="true"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--blue-dark-600, #155eef)",
            color: "var(--basewhite, #fff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "15px",
          }}
        >
          D
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "var(--basewhite, #fff)",
            }}
          >
            Devitrak
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "var(--brand-100, #c3d4e4)",
            }}
          >
            Admin Console
          </span>
        </div>
      </div>
      {SECTIONS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} style={linkStyle}>
          <Icon size={18} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
      <span
        style={{
          margin: "16px 12px 4px",
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--brand-200, #8fb0cc)",
        }}
      >
        Compliance
      </span>
      <NavLink to="audit" style={linkStyle}>
        <ShieldCheck size={18} aria-hidden="true" />
        Audit log
      </NavLink>

      {/* Who is looking. Every read on these screens is written to the audit
          log under this name, so the name belongs on the screen. */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: "32px",
            height: "32px",
            flexShrink: 0,
            borderRadius: "9999px",
            background: "var(--brand-500, #0a2f52)",
            color: "var(--basewhite, #fff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--basewhite, #fff)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {operatorName}
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "var(--brand-200, #8fb0cc)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.email ?? ""}
          </span>
        </div>
      </div>
      {/* The way back: this is a separate page, so the client dashboard is a
          link out of it, not a tab inside it. The dashboard host is named in
          full on purpose — a bare "/" here is a request for the console host's
          own root, which IIS sends straight back to /platform, so the way out
          led back in (public/web.config, "Console host root"). */}
      <a href={dashboardUrl("/")} style={exitStyle}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to the dashboard
      </a>
      {/* And the way out of the session itself. The console draws no dashboard
          navigation bar, so without this the only way to sign out of this host
          was clearing the browser's storage by hand — which leaves the session
          open on the server and makes the next sign-in fail with "Active
          session already exists". useLogout is the shared one that posts
          /admin/logout as well as tearing down the client. */}
      <button
        type="button"
        onClick={logout}
        style={{
          ...exitStyle,
          marginTop: "4px",
          width: "100%",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <LogOut size={16} aria-hidden="true" />
        Sign out
      </button>
    </nav>
    <main
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {PLATFORM_CONSOLE_SAMPLE_DATA && (
        <div
          role="note"
          data-testid="platform-sample-data"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--warning-300, #fec84b)",
            background: "var(--warning-50, #fffaeb)",
            color: "var(--warning-800, #93370d)",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
          }}
        >
          <strong>Sample data.</strong>
          <span>Prototype for review: every client, person and number here is invented.</span>
        </div>
      )}
      <Outlet />
    </main>
  </div>
  );
};

export default PlatformLayout;
