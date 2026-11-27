import PropTypes from "prop-types";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { ProfileErrorState } from "../../../components/UX/profile";
import { isNotDeployed, notServedFrom, notServedText } from "../utils/platformQuery";

/**
 * Error state for one console request. Three different things can go wrong
 * and only one of them is a fault:
 *
 *   501  the server holds the route but not the data ("not mine to give")
 *   404  the route is not deployed yet
 *   else the request failed
 *
 * The 501 is the one worth being careful about. Rendered as a generic error it
 * reads as an outage, and then nobody can tell a deliberate gap apart from a
 * broken server — which is exactly the thing the backend sent a structured
 * refusal to prevent. It also gets no Try again button: offering a retry for a
 * refusal is the same lie as a filter that cannot match.
 *
 * `error.errorRef` is attached by devitrakApi's response interceptor
 * (api/errorReference.js) when the server sent one. Since 2026-11-26 a 500's
 * message is generic, so for those failures the reference is the only thing
 * that connects this screen to the server's log.
 */
const describe = (error, path, onRetry) => {
  const notServed = notServedFrom(error);
  if (notServed) {
    return { title: "Not available yet", description: notServedText(notServed), action: null };
  }
  if (isNotDeployed(error)) {
    return {
      title: "The server does not have this yet",
      description: `GET /api/platform${path} answered 404.`,
      action: null,
    };
  }
  return {
    title: "Couldn't load this section",
    description: "The service didn't respond. Nothing was changed.",
    action: onRetry ? <GrayButtonComponent title="Try again" func={onRetry} /> : null,
  };
};

const PlatformRequestError = ({ error, path, onRetry }) => (
  <ProfileErrorState {...describe(error, path, onRetry)} reference={error?.errorRef ?? null} />
);

PlatformRequestError.propTypes = {
  error: PropTypes.object,
  path: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};

export default PlatformRequestError;
