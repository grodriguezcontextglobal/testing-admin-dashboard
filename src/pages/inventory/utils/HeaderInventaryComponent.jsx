import { Grid } from "@mui/material";
import { Link } from "react-router-dom";
import { EditIcon } from "../../../components/icons/EditIcon";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { RectangleBluePlusIcon } from "../../../components/icons/RectangleBluePlusIcon";
import LightBlueButtonComponent from "../../../components/UX/buttons/LigthBlueButton";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";

const HeaderInventaryComponent = ({
  user,
  TextFontSize30LineHeight38,
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
          <LightBlueButtonComponent
            title={"Update a group of items"}
            styles={{ with: "100%" }}
            icon={
              <EditIcon
                stroke={"var(--blue-dark--800)"}
                width={"20"}
                height={"18"}
              />
            }
            buttonType="button"
            titleStyles={{
              textTransform: "none",
              with: "100%",
              gap: "2px",
            }}
            func={() => null}
          />
        </Link>
        <Link to="/inventory/new-bulk-items">
          <BlueButtonComponent
            title={"Add a group of items"}
            styles={{ with: "100%" }}
            icon={
              <WhiteCirclePlusIcon style={{ height: "21px", margin: "auto" }} />
            }
            buttonType="button"
            titleStyles={{
              textTransform: "none",
              with: "100%",
              gap: "2px",
            }}
            func={() => null}
          />
        </Link>
        <Link to="/inventory/new-item">
        <LightBlueButtonComponent
          title={"Add one item"}
          styles={{ with: "100%" }}
          icon={
            <RectangleBluePlusIcon />
          }
          buttonType="button"
          titleStyles={{
            textTransform: "none",
            with: "100%",
            gap: "2px",
          }}
          func={() => null}
          />
        </Link>
      </Grid>
    </Grid>
  );
};

export default HeaderInventaryComponent;
