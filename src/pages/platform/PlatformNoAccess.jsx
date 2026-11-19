import { useSelector } from "react-redux";
import { LogOut, ShieldAlert } from "lucide-react";
import { dashboardUrl } from "../../config/consoleHosts";
import useLogout from "../../hooks/useLogout";

/**
 * What the console host shows an account the server did not grant it.
 *
 * It replaces a redirect. The refusal used to be a window.location.replace to
 * the dashboard host, which is a different origin with its own session: a
 * person who had just signed in here landed on a login screen there, with
 * nothing on screen to say why. Measured on 2026-11-19 with an account that
 * correctly has no console access, and reported as "the console does not
 * open" — the gate was right, the explanation was missing.
 *
 * So this page stays where it is. It cannot loop, because it navigates
 * nowhere: neither the IIS rule for "/" nor shouldLandOnConsole can fire on a
 * page that makes no request and changes no path.
 *
 * It offers both ways out, because this host has no dashboard navigation bar:
 * the dashboard by its full address, and a real sign-out. Without the second,
 * someone refused here holds a session on this origin that they cannot end —
 * signing out elsewhere never reaches it, and clearing storage by hand leaves
 * it open on the server (hooks/useLogout.js).
 */
const PlatformNoAccess = () => {
  const { user } = useSelector((state) => state.admin);
  const logout = useLogout();
  const email = user?.email ?? user?.data?.email ?? "";

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        background: "var(--gray-50, #f8f9fb)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "12px",
          padding: "28px",
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #eaecf0)",
          background: "var(--basewhite, #fff)",
        }}
      >
        <ShieldAlert size={28} aria-hidden="true" color="var(--gray600, #475467)" />
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--gray900, #101828)" }}>
          This account does not have console access
        </h1>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "var(--gray600, #475467)" }}>
          {email ? (
            <>
              You are signed in as <strong>{email}</strong>. The Devitrak Admin Console is limited to
              staff the server has granted access to, and this address is not one of them.
            </>
          ) : (
            <>
              The Devitrak Admin Console is limited to staff the server has granted access to.
            </>
          )}
        </p>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "var(--gray600, #475467)" }}>
          Nothing is wrong with the account itself — it works on the dashboard as usual. This is a
          separate address for a separate tool.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "8px" }}>
          <a
            href={dashboardUrl("/")}
            style={{
              display: "flex",
              alignItems: "center",
              minHeight: "40px",
              padding: "0 16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--basewhite, #fff)",
              background: "var(--blue-dark-600, #155eef)",
            }}
          >
            Go to the dashboard
          </a>
          <button
            type="button"
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minHeight: "40px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "1px solid var(--gray-300, #d0d5dd)",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--gray700, #344054)",
            }}
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
};

export default PlatformNoAccess;
