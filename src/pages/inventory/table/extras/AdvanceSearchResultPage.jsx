import { Grid } from "@mui/material";
import { FixedSizeList as List } from "react-window";
import { Alert, Button, Divider } from "antd";
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
import BarAnimation from "../../charts/BarAnimation";
import Bars from "../../charts/Bars";
import { memo, useMemo } from "react";
import InventoryItemCard from "./ux/InventoryItemCard";

const AdvanceSearchResultPage = () => {
  const { advanceSearch } = useSelector((state) => state.searchResult);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleReturnNavigation = () => {
    dispatch(onAddAdvanceSearch(null));
    return navigate("/inventory");
  };

  const resultList = useMemo(
    () => advanceSearch?.advanceSearchResult || [],
    [advanceSearch]
  );
  const Row = memo(({ index, style }) => {
    Row.displayName = "Row";
    const item = resultList[index];
    return (
      <div style={style}>
        <InventoryItemCard item={item} />
      </div>
    );
  });

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
      <Alert
        message="Please note that this projection may not be entirely accurate due to various factors. Use it for reference only."
        type="warning"
        showIcon
        style={{ width: "100%", margin: "15px auto" }}
      />
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        gap={2}
        container
      >
        <BarAnimation
          dataToRender={advanceSearch.advanceSearchResult}
          title="Availability per location"
        />
        <Bars
          dataToRender={advanceSearch.plannedInventoryToUseInEvents}
          title="Availability per type reflects the remaining inventory from events occurring during the consulted time period."
        />
      </Grid>
      <Divider />
      <Grid
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
        style={{  marginY: "20px" }}
      >
        <List
          height={600}
          itemCount={resultList.length}
          itemSize={130} // Adjust height of each row accordingly
          width="100%"
        >
          {Row}
        </List>
      </Grid>
    </Grid>
  );
};

export default AdvanceSearchResultPage;
