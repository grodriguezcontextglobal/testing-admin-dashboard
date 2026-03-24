import { useState } from "react";
import PropTypes from "prop-types";
import { Icon } from "@iconify/react";
import "./BannerReusableComponentUntitleUI.css";

const BannerReusableComponentUntitleUI = ({ title, description, linkText, linkHref, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) {
            onDismiss();
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="banner-slim-default">
            <div className="banner-content">
                <p className="banner-title">{title}</p>
                <p className="banner-description">
                    {description}{" "}
                    <a href={linkHref} className="banner-link">
                        {linkText}
                    </a>
                    .
                </p>
            </div>

            <div className="banner-close-button-container">
                <button onClick={handleDismiss} className="close-button" aria-label="Dismiss">
                    <Icon icon="mdi:close" width="24" height="24" />
                </button>
            </div>
        </div>
    );
};

BannerReusableComponentUntitleUI.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    linkText: PropTypes.string.isRequired,
    linkHref: PropTypes.string.isRequired,
    onDismiss: PropTypes.func,
};

export default BannerReusableComponentUntitleUI;
