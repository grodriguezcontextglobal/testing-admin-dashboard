import { NavLink, Outlet } from "react-router";
import {
  Boxes,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";

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

const PlatformLayout = () => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "24px",
      width: "100%",
      padding: "24px 16px",
      boxSizing: "border-box",
      alignItems: "flex-start",
    }}
  >
    <nav
      aria-label="Admin console"
      style={{
        flex: "1 1 220px",
        maxWidth: "260px",
        background: "var(--brand-600, #021833)",
        borderRadius: "12px",
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        boxSizing: "border-box",
      }}
    >
      <p
        style={{
          margin: "0 12px 12px",
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--basewhite, #fff)",
        }}
      >
        Devitrak Admin Console
      </p>
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
    </nav>
    <main
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <Outlet />
    </main>
  </div>
);

export default PlatformLayout;
