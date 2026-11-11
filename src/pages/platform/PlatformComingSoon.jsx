import PropTypes from "prop-types";
import EmptyState from "../../components/UX/emptyState/EmptyState";
import PageHeader from "../../components/UX/pageHeader/PageHeader";

/** A console section whose server endpoint is not built yet. */
const PlatformComingSoon = ({ title, endpoint }) => (
  <>
    <PageHeader title={title} divider />
    <EmptyState
      icon="tabler:cloud-off"
      title="Not available yet"
      description={`This section is waiting for ${endpoint} on the server.`}
    />
  </>
);

PlatformComingSoon.propTypes = {
  title: PropTypes.string.isRequired,
  endpoint: PropTypes.string.isRequired,
};

export default PlatformComingSoon;
