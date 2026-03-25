import { Avatar } from 'antd';
import PropTypes from 'prop-types';
import './HeaderConsumerComponent.css';

const HeaderConsumerComponent = ({ consumer, actions }) => {
  const getInitials = () => {
    const firstName = consumer.name || '';
    const lastName = consumer.lastName || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return `${firstName.charAt(0)}`.toUpperCase();
    }
    return '';
  };

  return (
    <div className="consumer-header-container">
      <div className="consumer-header-content">
        <div className="consumer-header-left">
          <Avatar src={consumer?.data?.profile_picture} size={120}>
            {!consumer?.data?.profile_picture && getInitials()}
          </Avatar>
          <div className="consumer-header-center">
            <p className="name">{consumer.name} {consumer.lastName}</p>
            <p className="email">{consumer.email}</p>
            <p className="phone">{consumer.phoneNumber}</p>
          </div>
        </div>
        {/* <div className="consumer-header-center">
          {contact}
        </div> */}
        <div className="consumer-header-right">
          {actions}
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
    profile_picture: PropTypes.string,
  }).isRequired,
  contact: PropTypes.node.isRequired,
  actions: PropTypes.node.isRequired,
};

export default HeaderConsumerComponent;
