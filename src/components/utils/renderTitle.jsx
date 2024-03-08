import { Typography } from "@mui/material";
import PropTypes from "prop-types";
export const renderTitle = ({ title }) => {
  return (
    <Typography
      textAlign={"left"}
      fontFamily={"Inter"}
      fontSize={"18px"}
      fontStyle={"normal"}
      fontWeight={600}
      lineHeight={"28px"}
      color={"var(--gray-900, #101828)"}
    >
      {title}
    </Typography>
  );
};


renderTitle.propTypes = {
  title: PropTypes.string.isRequired,
};
