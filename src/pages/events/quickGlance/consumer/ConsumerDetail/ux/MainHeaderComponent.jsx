import PropTypes from 'prop-types';
import { Avatar } from 'antd';
import { useMediaQuery } from '@mui/material';
import { Mail, Phone } from 'lucide-react';
import './MainHeaderComponent.css';

const MainHeaderComponent = ({ consumer, actions }) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');

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
                    <Avatar
                        src={consumer?.profile_picture}
                        size={isDesktop ? 80 : 56}
                        style={{ backgroundColor: 'var(--blue-dark-600, #155eef)', color: '#fff', fontWeight: 600 }}
                    >
                        {!consumer?.profile_picture && getInitials()}
                    </Avatar>
                    <div className="consumer-header-info">
                        <p className="name">{consumer.name} {consumer.lastName}</p>
                        <p className="email">
                            <Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {consumer.email}
                        </p>
                        <p className="phone">
                            <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {consumer.phoneNumber}
                        </p>
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
