import PropTypes from "prop-types";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { ProfileErrorState } from "../../../components/UX/profile";

const notDeployed = (error) => error?.response?.status === 404;

/** Error state for one console request; a 404 names the missing endpoint. */
const PlatformRequestError = ({ error, path, onRetry }) => (
  <ProfileErrorState
    title={notDeployed(error) ? "The server does not have this yet" : "Couldn't load this section"}
    description={
      notDeployed(error)
        ? `GET /api/platform${path} answered 404.`
        : "The service didn't respond. Nothing was changed."
    }
    action={notDeployed(error) || !onRetry ? null : <GrayButtonComponent title="Try again" func={onRetry} />}
  />
);

PlatformRequestError.propTypes = {
  error: PropTypes.object,
  path: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};

export default PlatformRequestError;
