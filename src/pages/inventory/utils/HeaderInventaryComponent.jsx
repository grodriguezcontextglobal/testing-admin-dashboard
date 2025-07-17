import { Grid } from "@mui/material";
import { Link } from "react-router-dom";
import { EditIcon } from "../../../components/icons/EditIcon";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { RectangleBluePlusIcon } from "../../../components/icons/RectangleBluePlusIcon";

const HeaderInventaryComponent = ({
  user,
  TextFontSize30LineHeight38,
  LightBlueButton,
  LightBlueButtonText,
  BlueButton,
  BlueButtonText,
}) => {
  return (
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
      <Grid marginY={0} item xs={12} sm={12} md={4} lg={4}>
        <p style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}>
          Inventory of {user.company}
        </p>
      </Grid>
      <Grid
        textAlign={"right"}
        display={"flex"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        gap={1}
        sx={{ display: { xs: "none", sm: "none", md: "flex", lg: "flex" } }}
        item
        md={8}
        lg={8}
      >
        <Link to="/inventory/edit-group">
          <button style={{ ...LightBlueButton, width: "fit-content" }}>
            <p
              style={{
                ...LightBlueButtonText,
                textTransform: "none",
                gap: "2px",
              }}
            >
              <EditIcon
                stroke={"var(--blue-dark--800)"}
                width={"20"}
                height={"18"}
              />
              &nbsp;Update a group of items
            </p>
          </button>
        </Link>
        <Link to="/inventory/new-bulk-items">
          <button style={{ ...BlueButton, width: "fit-content" }}>
            <WhiteCirclePlusIcon style={{ height: "21px", margin: "auto" }} />
            &nbsp;
            <p style={{ ...BlueButtonText, textTransform: "none" }}>
              Add a group of items
            </p>
          </button>
        </Link>
        <Link to="/inventory/new-item">
          <button style={{ ...LightBlueButton, width: "fit-content" }}>
            <RectangleBluePlusIcon />
            {/* <BluePlusIcon /> */}
            &nbsp;
            <p style={{ ...LightBlueButtonText, textTransform: "none" }}>
              Add one item
            </p>
          </button>
        </Link>
      </Grid>
    </Grid>
  );
};

export default HeaderInventaryComponent;
