import { useMemo } from "react";
import ModalUX from "../UX/modal/ModalUX";
import BlueButtonComponent from "../UX/buttons/BlueButton";
import GrayButtonComponent from "../UX/buttons/GrayButton";
import useLogout from "../../hooks/useLogout";
import useIdleSession from "../../hooks/useIdleSession";
import { formatCountdown, sessionStartFromToken } from "../../hooks/idleSession";

/**
 * Signs a staff member out after 15 minutes without activity, warning two
 * minutes before (FedRAMP B1 · AC-11). Mounted once, beside AuthRoutes.
 *
 * Signing out goes through useLogout, so the server session ends too.
 * `onSignedOut` runs afterwards: this component unmounts with the session, so
 * the notice that explains it has to come from App.
 */
const IdleSessionGuard = ({ token, onSignedOut }) => {
  const logout = useLogout();
  const sessionStartedAt = useMemo(() => sessionStartFromToken(token), [token]);

  const signOut = async () => {
    await logout();
    onSignedOut?.();
  };

  const { phase, remainingMs, staySignedIn } = useIdleSession({ onTimeout: signOut, sessionStartedAt });

  return (
    <ModalUX
      openDialog={phase === "warning"}
      closeModal={staySignedIn}
      closable={false}
      width={440}
      title="Are you still there?"
      body={
        <p style={{ margin: 0, color: "var(--gray-600, #475467)" }}>
          For security, you will be signed out in{" "}
          <strong aria-live="polite">{formatCountdown(remainingMs)}</strong> because there has
          been no activity.
        </p>
      }
      footer={[
        <GrayButtonComponent key="out" title="Sign out" func={logout} />,
        <BlueButtonComponent key="stay" title="Stay signed in" func={staySignedIn} />,
      ]}
    />
  );
};

export default IdleSessionGuard;
