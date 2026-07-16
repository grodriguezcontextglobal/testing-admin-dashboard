import { Grid } from "@mui/material";
import PropTypes from "prop-types";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { Subtitle } from "../../../styles/global/Subtitle";

const ConsumerHeader = ({ setCreateUserButton }) => {
  return (
    <Grid
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingBottom: "20px",
        borderBottom: "1px solid var(--gray-200, #EAECF0)",
        marginBottom: "8px",
      }}
      container
    >
      <Grid item xs={12} sm={12} md={6} lg={6}>
        <p style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}>
          Consumers
        </p>
        <p style={{ ...Subtitle, textAlign: "left", marginTop: "4px" }}>
          Manage and review your customer base.
        </p>
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
  );
};

ConsumerHeader.propTypes = {
  setCreateUserButton: PropTypes.func.isRequired,
};

export default ConsumerHeader;
