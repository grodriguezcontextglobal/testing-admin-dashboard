import PropTypes from "prop-types";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import {
  ProfileErrorState,
  ProfileSection,
} from "../../../../../../components/UX/profile";
import { formatCurrency } from "../../utils/lostFee";
import "../../consumerDetail.css";

/**
 * The frame both lost-fee methods render into: what is being written off, then
 * the one field that differs, then the confirm/cancel pair.
 *
 * Both screens used to lay this out as a single horizontal MUI Grid row —
 * heading, disabled serial input, amount, Cancel, Submit, all on one line at
 * `lg={3}`/`md={4}` — so on any narrow window the amount field and the submit
 * button ended up on different rows from the device they referred to. And
 * neither screen ever named the consumer being charged.
 */
const LostFeeScreen = ({
  title,
  description,
  device,
  amount,
  consumerName,
  eventName,
  onCancel,
  children,
  footer,
  error,
}) => {
  if (error) {
    return (
      <ProfileSection title={title} testId="lost-fee-screen">
        <div style={{ padding: "0 20px 20px" }}>
          <ProfileErrorState
            title={error.title}
            description={error.description}
            action={
              <GrayButtonComponent title="Go back" func={onCancel} />
            }
          />
        </div>
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title={title}
      description={description}
      testId="lost-fee-screen"
    >
      <div className="lost-fee" style={{ padding: "4px 20px 20px" }}>
        {/* What is being written off, and for whom. Named before the amount is
            asked for, because that is the thing being confirmed. */}
        <dl className="lost-fee__device">
          <div className="lost-fee__fact">
            <dt>Serial number</dt>
            <dd className="profile-serial">{device?.serialNumber || "—"}</dd>
          </div>
          <div className="lost-fee__fact">
            <dt>Device type</dt>
            <dd style={{ textTransform: "capitalize" }}>
              {device?.deviceType || "—"}
            </dd>
          </div>
          <div className="lost-fee__fact">
            <dt>Consumer</dt>
            <dd>{consumerName || "—"}</dd>
          </div>
          <div className="lost-fee__fact">
            <dt>Event</dt>
            <dd>{eventName || "—"}</dd>
          </div>
          <div className="lost-fee__fact">
            <dt>Replacement value</dt>
            <dd>{formatCurrency(amount)}</dd>
          </div>
        </dl>

        {children}

        <div className="lost-fee__footer">{footer}</div>
      </div>
    </ProfileSection>
  );
};

LostFeeScreen.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  device: PropTypes.shape({
    serialNumber: PropTypes.string,
    deviceType: PropTypes.string,
  }),
  amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  consumerName: PropTypes.string,
  eventName: PropTypes.string,
  onCancel: PropTypes.func,
  children: PropTypes.node,
  footer: PropTypes.node,
  error: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};

LostFeeScreen.defaultProps = {
  description: null,
  device: null,
  amount: 0,
  consumerName: null,
  eventName: null,
  onCancel: undefined,
  children: null,
  footer: null,
  error: null,
};

export default LostFeeScreen;
