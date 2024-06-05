import { Grid } from "@mui/material";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { PropTypes } from "prop-types";
import { Title } from "../../styles/global/Title";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";

const BannerMsg = ({ props }) => {
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      marginTop={5}
      container
    >
      <Grid
        margin={"auto"}
        display={"flex"}
        flexDirection={"column"}
        alignSelf={"stretch"}
        gap={"40px"}
        alignItems={"center"}
        item
        xs={10}
      >
        <p style={Title}>{props.title}</p>
        <p
          style={{
            ...TextFontSize20LineHeight30, //*global attribute
            alignSelf: "stretch",
            textAlign: "center",
            padding: "0 5px",
            textWrap: "balance",
          }}
        >
          {props.message}{" "}
        </p>
        <Link to={`${props.link}`}>
          {" "}
          <Button style={props.button}>
            <p style={props.paragraphStyle}>{props.paragraphText}</p>
          </Button>
        </Link>
      </Grid>
    </Grid>
  );
};

BannerMsg.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  button: PropTypes.string.isRequired,
  paragraphStyle: PropTypes.string.isRequired,
  paragraphText: PropTypes.string.isRequired,
};
export default BannerMsg;
