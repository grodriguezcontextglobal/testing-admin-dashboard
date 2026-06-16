import { Grid, Typography } from "@mui/material";
import { Divider } from "antd";
import PropTypes from "prop-types";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";

const ConsumerHeader = ({ setCreateUserButton }) => {
  return (
    <>
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
      >
        <Grid item xs={12} sm={12} md={6} lg={6}>
          <Typography
            textTransform={"none"}
            style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}
          >
            Consumers
          </Typography>
        </Grid>
        <Grid
          display={"flex"}
          alignItems={"center"}
          gap={1}
          sx={{
            margin: { xs: "0.5rem 0", sm: "0.5rem 0" },
            justifyContent: {
              xs: "flex-start",
              sm: "flex-start",
              md: "flex-end",
              lg: "flex-end",
            },
          }}
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
        >
          <BlueButtonComponent
            func={() => setCreateUserButton(true)}
            title={"Add new consumer"}
          />
        </Grid>
      </Grid>
      <Divider />
    </>
  );
};

ConsumerHeader.propTypes = {
  setCreateUserButton: PropTypes.func.isRequired,
};

export default ConsumerHeader;
