import { Grid } from "@mui/material";
import { Button } from "antd";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate()
  const titleStyle = {
    color: "var(--gray-900)", //#101828
    fontFamily: "Inter",
    fontSize: "30px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "38px" /* 126.667% */,
  };
  return (
    <Grid container>
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <h1 style={titleStyle}>Posts</h1>
        <Button onClick={() => navigate("/posts/new-post")} style={BlueButton}>
          <p style={BlueButtonText}><WhiteCirclePlusIcon />&nbsp;Add new post</p>
        </Button>
      </Grid>
    </Grid>
  );
};

export default Header;
