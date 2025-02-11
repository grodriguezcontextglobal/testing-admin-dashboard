/* eslint-disable no-unused-vars */
import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Calendar, Divider, Dropdown, theme } from "antd";
import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import { BluePlusIcon } from "../../components/icons/BluePlusIcon";
import { MagnifyIcon } from "../../components/icons/MagnifyIcon";
import { WhiteCirclePlusIcon } from "../../components/icons/WhiteCirclePlusIcon";
import "../../styles/global/ant-select.css";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import "../../styles/global/OutlineInput.css";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import { Title } from "../../styles/global/Title";
import CalendarIcon from "../../components/icons/CalendarIcon";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { set } from "lodash";
const BannerMsg = lazy(() => import("../../components/utils/BannerMsg"));
const ItemTable = lazy(() => import("./table/ItemTable"));

const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const { register, watch } = useForm();
  const companyHasInventoryQuery = useQuery({
    queryKey: ["companyHasInventoryQuery"],
    queryFn: () =>
      devitrakApi.get(
        `/db_item/check-company-has-inventory?company_id=${user.sqlInfo.company_id}`
      ),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    companyHasInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const [begin, setBegin] = useState(null);
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
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
            item
            xs={12}
            sm={12}
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
                <WhiteCirclePlusIcon
                  style={{ height: "21px", margin: "auto" }}
                />
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
        {companyHasInventoryQuery?.data?.data?.total > 0 ? (
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
              <Grid style={{ ...CenteringGrid, gap: "5px" }} item xs sm md lg>
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
                <Button
                  style={{ ...OutlinedInputStyle, ...CenteringGrid, gap: 0 }}
                >
                  <CalendarIcon />
                  <DatePicker
                    id="calender-event"
                    autoComplete="checking"
                    minDate={new Date()}
                    selected={begin}
                    onChange={(date) => setBegin(date.toString())}
                    placeholderText="Choose a date"
                    startDate={new Date()}
                    style={{
                      ...OutlinedInputStyle,
                      margin: "0.1rem 0 1.5rem",
                      width: "100%",
                    }}
                  />
                  <Button
                    style={{
                      ...OutlinedInputStyle,
                      gap: 0,
                      border: "none",
                      height: "95%",
                      boxShadow: "none",
                    }}
                    onClick={() => setBegin(null)}
                  >
                    X
                  </Button>
                </Button>
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
                <ItemTable searchItem={watch("searchItem")} date={begin} />
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
    </Suspense>
  );
};

export default MainPage;
