import { Avatar } from 'antd';
import PropTypes from 'prop-types';
import './HeaderConsumerComponent.css';

const HeaderConsumerComponent = ({ consumer }) => {
  const getInitials = () => {
    const first = consumer.name?.charAt(0) ?? '';
    const last = consumer.lastName?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || '?';
  };

  const phone = consumer.phoneNumber || '—';

  return (
    <div className="consumer-header-container" data-testid="consumer-header">
      <div className="consumer-header-content">
        <div className="consumer-header-left">
          <Avatar
            src={consumer?.data?.profile_picture}
            size={80}
            data-testid="consumer-avatar"
          >
            {!consumer?.data?.profile_picture && getInitials()}
          </Avatar>
          <div className="consumer-header-center">
            <p className="name" data-testid="consumer-name">
              {consumer.name} {consumer.lastName}
            </p>
            <p className="email">{consumer.email}</p>
            <p className="phone">{phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

HeaderConsumerComponent.propTypes = {
  consumer: PropTypes.shape({
    name: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phoneNumber: PropTypes.string,
    data: PropTypes.shape({
      profile_picture: PropTypes.string,
    }),
  }).isRequired,
};

export default HeaderConsumerComponent;
