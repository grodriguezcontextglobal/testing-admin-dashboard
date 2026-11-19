import PropTypes from "prop-types";
import { useEffect } from "react";
import DevitrakLoading from "../animation/DevitrakLoading";
import CenteringGrid from "../../styles/global/CenteringGrid";

/**
 * Leaves this origin for another one.
 *
 * Not <Navigate>: react-router moves within the current document, and the
 * Admin Console is on a different host, which is a different origin and a
 * different document. Only the browser can make that move.
 *
 * replace() and not assign(): the page being left is one the user should not
 * land back on with the Back button, because it would redirect them here
 * again. The spinner is what they see for the moment the browser takes.
 */
const ExternalRedirect = ({ to }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <div style={{ ...CenteringGrid, minHeight: "100dvh" }}>
      <DevitrakLoading />
    </div>
  );
};

ExternalRedirect.propTypes = {
  to: PropTypes.string.isRequired,
};

export default ExternalRedirect;
