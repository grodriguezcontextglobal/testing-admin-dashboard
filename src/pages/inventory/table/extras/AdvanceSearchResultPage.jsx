import { Grid } from "@mui/material";
import { Button, Divider } from "antd";
import { groupBy } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BluePlusIcon } from "../../../../components/icons/BluePlusIcon";
import { WhiteCirclePlusIcon } from "../../../../components/icons/WhiteCirclePlusIcon";
import { onAddAdvanceSearch } from "../../../../store/slices/searchBarResultSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import Pie from "../../charts/Pie";

const AdvanceSearchResultPage = () => {
  const { advanceSearch } = useSelector((state) => state.searchResult);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleReturnNavigation = () => {
    dispatch(onAddAdvanceSearch(null));
    return navigate("/inventory");
  };
  const renderingBasedOnCategoryQuantity = () => {
    const categoryQuantity = groupBy(advanceSearch, "item_group");
    const data = Object.keys(categoryQuantity).map((key) => [
      categoryQuantity[key].length,
      key,
    ]);
    return data;
  };

  const renderingBasedOnOwnershipQuantity = () => {
    const categoryQuantity = groupBy(advanceSearch, "ownership");
    const data = Object.keys(categoryQuantity).map((key) => [
      categoryQuantity[key].length,
      key,
    ]);
    return data;
  };
  const renderingBasedOnStatusQuantity = () => {
    const categoryQuantity = groupBy(advanceSearch, "status");
    const data = Object.keys(categoryQuantity).map((key) => [
      categoryQuantity[key].length,
      key,
    ]);
    return data;
  };
  const renderingBasedOnLocationQuantity = () => {
    const categoryQuantity = groupBy(advanceSearch, "location");
    const data = Object.keys(categoryQuantity).map((key) => [
      categoryQuantity[key].length,
      key,
    ]);
    return data;
  };

  return (
    <Grid
      style={{
        padding: "5px 0",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
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
              <p style={{ ...LightBlueButtonText, textTransform: "none" }}>
                Update a group of device
              </p>
            </button>
          </Link>
          <Link to="/inventory/new-bulk-items">
            <button style={{ ...BlueButton, width: "fit-content" }}>
              <WhiteCirclePlusIcon style={{ height: "21px", margin: "auto" }} />
              &nbsp;
              <p style={{ ...BlueButtonText, textTransform: "none" }}>
                Add a group of devices
              </p>
            </button>
          </Link>
          <Link to="/inventory/new-item">
            <button style={{ ...LightBlueButton, width: "fit-content" }}>
              <BluePlusIcon />
              &nbsp;
              <p style={{ ...LightBlueButtonText, textTransform: "none" }}>
                Add one device
              </p>
            </button>
          </Link>
        </Grid>
      </Grid>
      <Grid
        textAlign={"right"}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        sx={{
          display: { xs: "flex", sm: "flex", md: "none", lg: "none" },
          marginTop: "10px",
        }}
        item
        xs={12}
        sm={12}
      >
        <Link to="/inventory/edit-group">
          <button style={{ ...LightBlueButton, width: "fit-content" }}>
            <p style={{ ...LightBlueButtonText, textTransform: "none" }}>
              Update a group of device
            </p>
          </button>
        </Link>
        <Link to="/inventory/new-bulk-items">
          <button style={{ ...BlueButton, width: "fit-content" }}>
            <WhiteCirclePlusIcon style={{ height: "21px", margin: "auto" }} />
            &nbsp;
            <p style={{ ...BlueButtonText, textTransform: "none" }}>
              Add a group of devices
            </p>
          </button>
        </Link>
        <Link to="/inventory/new-item">
          <button style={{ ...LightBlueButton, width: "fit-content" }}>
            <BluePlusIcon />
            &nbsp;
            <p style={{ ...LightBlueButtonText, textTransform: "none" }}>
              Add one device
            </p>
          </button>
        </Link>
      </Grid>
      <Divider />
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Button onClick={() => handleReturnNavigation()} style={BlueButton}>
          <p style={BlueButtonText}>Return</p>
        </Button>{" "}
      </Grid>
      <Divider />
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        gap={2}
        container
      >
        <Pie
          key={"_STATUS"}
          dataToRender={renderingBasedOnCategoryQuantity()}
          title="Groups"
        />
        <Pie
          key={"_STATUS"}
          dataToRender={renderingBasedOnLocationQuantity()}
          title="Location"
        />
        <Pie
          key={"_STATUS"}
          dataToRender={renderingBasedOnOwnershipQuantity()}
          title="Ownership"
        />
        <Pie
          key={"_STATUS"}
          dataToRender={renderingBasedOnStatusQuantity()}
          title="Status"
        />
      </Grid>
    </Grid>
  );
};

export default AdvanceSearchResultPage;
