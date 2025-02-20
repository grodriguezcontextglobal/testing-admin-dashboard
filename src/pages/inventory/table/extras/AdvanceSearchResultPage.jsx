import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Title } from "../../../../styles/global/Title";
import { Button, Divider } from "antd";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import { BluePlusIcon } from "../../../../components/icons/BluePlusIcon";
import { Link, useNavigate } from "react-router-dom";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { WhiteCirclePlusIcon } from "../../../../components/icons/WhiteCirclePlusIcon";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { onAddAdvanceSearch } from "../../../../store/slices/searchBarResultSlice";

const AdvanceSearchResultPage = () => {
  const { advanceSearch } = useSelector((state) => state.searchResult);
  const { user } = useSelector((state) => state.admin);
  console.log(advanceSearch);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleReturnNavigation = () => {
    dispatch(onAddAdvanceSearch(null));
    return navigate("/inventory");
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
      <Grid
        style={{
          paddingTop: "0px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
        marginTop={4}
      >
        <Grid textAlign={"right"} item xs={4}></Grid>
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
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          style={CenteringGrid}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          {/* {renderingOption[currentTab]} */}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AdvanceSearchResultPage;
