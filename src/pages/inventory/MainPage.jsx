import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { Divider } from "antd";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  BluePlusIcon,
  MagnifyIcon,
  WhiteCirclePlusIcon,
} from "../../components/icons/Icons";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { LightBlueButton } from "../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../styles/global/LightBlueButtonText";
import "../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Title } from "../../styles/global/Title";
import "../../styles/global/ant-select.css";
import ItemTable from "./table/ItemTable";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../api/devitrakApi";
import { useEffect } from "react";
import BannerMsg from "../../components/utils/BannerMsg";
const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const { register, watch } = useForm();
  const inventoryQuery = useQuery({
    queryKey: ["itemsList"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company: user.company,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    inventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <Grid
      style={{
        padding: "5px",
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
        container
      >
        <Grid marginY={0} item xs={6}>
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--gray-900, #101828)",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={600}
            fontFamily={"Inter"}
            fontSize={"30px"}
          >
            Inventory of {user.company}
          </Typography>
        </Grid>
        <Grid
          textAlign={"right"}
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          gap={1}
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
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
      {inventoryQuery?.data?.data?.items.length > 0 ? (
        <>
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
            <p
              style={{
                ...Title,
                fontSize: "28px",
                padding: 0,
                width: "fit-content",
              }}
            >
              Search inventory:&nbsp;
            </p>
            <Grid item xs sm md lg>
              <OutlinedInput
                {...register("searchItem")}
                style={OutlinedInputStyle}
                fullWidth
                placeholder="Search device here"
                startAdornment={
                  <InputAdornment position="start">
                    <MagnifyIcon />
                  </InputAdornment>
                }
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
              item
              xs={12}
            >
              <ItemTable searchItem={watch("searchItem")} />
            </Grid>
          </Grid>
        </>
      ) : (
        <Grid
          textAlign={"right"}
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          gap={1}
          item
          xs={12}
          sm={12}
          md={10}
          lg={10}
        >
          <BannerMsg
            props={{
              title: "Add to your inventory",
              message:
                "Creating an event will let you assign and manage devices, as well as staff to an event with a start and end date. You will also be able to assign devices to consumers, collect retain deposits, collect fees for damaged devices, and keep track of your full inventory.",
              link: "/inventory/new-item",
              button: BlueButton,
              paragraphStyle: BlueButtonText,
              paragraphText: "Add to inventory",
            }}
          />
        </Grid>
      )}{" "}
    </Grid>
  );
};

export default MainPage;
