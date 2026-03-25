import PropTypes from 'prop-types';
import { Avatar } from 'antd';
import './MainHeaderComponent.css';

const MainHeaderComponent = ({ consumer, actions }) => {
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
                    <Avatar src={consumer?.profile_picture} size={120}>
                        {!consumer?.profile_picture && getInitials()}
                    </Avatar>
                    <div className="consumer-header-info">
                        <p className="name">{consumer.name} {consumer.lastName}</p>
                        <p className="email">{consumer.email}</p>
                        <p className="phone">{consumer.phoneNumber}</p>
                    </div>
                </div>
                <div className="consumer-header-right">
                    {actions}
                </div>
            </div>
        </div>
    );
};

MainHeaderComponent.propTypes = {
    consumer: PropTypes.shape({
        name: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
        phoneNumber: PropTypes.string,
        data: PropTypes.shape({
            profile_picture: PropTypes.string,
        }),
    }).isRequired,
    actions: PropTypes.node.isRequired,
};

export default MainHeaderComponent;
