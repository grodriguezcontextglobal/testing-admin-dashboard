import { Icon } from "@iconify/react";
import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, Divider } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import {
  DownNarrow,
  PlusIcon,
  UpNarrowIcon,
  WhitePlusIcon,
} from "../../../components/icons/Icons";
import BannerNotificationTemplate from "../../../components/notification/alerts/BannerNotificationTemplate";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { Title } from "../../../styles/global/Title";
import { CreateNewConsumer } from "../../consumers/utils/CreateNewUser";
import DisplayAllItemsSetInventoryEvent from "./components/DisplayAllItemsSetInventoryEvent";
import FormatEventDetailInfo from "./components/FormatEventDetailInfo";
import FormatToDisplayDetail from "./components/FormatToDisplayDetail";
import GraphicInventoryEventActivity from "./components/GraphicInventoryEventActivity";
import InventoryEventValue from "./components/InventoryEventValue";
import Report from "./components/lostFee/Report";
import CustomerInformationSection from "./consumer/CustomerInformationSection";
import DevicesInformationSection from "./inventory/DevicesInformationSection";
import EditingInventory from "./inventory/action/EditingForEventInventory";
import StaffMainPage from "./staff/StaffMainPage";
import EditingStaff from "./staff/components/EditingStaff";
import { checkArray } from "../../../components/utils/checkArray";
const MainPageQuickGlance = () => {
  const today = new Date().getTime();
  const { choice, event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [createUserButton, setCreateUserButton] = useState(false);
  const [showInventoryTypes, setShowInventoryTypes] = useState(false);
  const [editingStaff, setEditingStaff] = useState(false);
  const [editingInventory, setEditingInventory] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(
    today > new Date(event?.eventInfoDetail?.dateEnd).getTime()
  );
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen and (min-width : 1201px)"
  );
  const sum = (a, b) => {
    if (!a || !b) {
      return 0;
    }
    return a + b;
  };
  const eventAttendeesQuery = useQuery({
    queryKey: ["listOfAttendees"],
    queryFn: () => devitrakApi.get("/auth/users"),
    refetchOnMount: false,
  });
  const eventAttendeesParametersQuery = useQuery({
    queryKey: ["listOfAttendeesPerSelectedEvent"],
    queryFn: () =>
      devitrakApi.post("/auth/user-query", {
        company: user.companyData.id,
        eventSelected: choice,
      }),
    refetchOnMount: false,
  });
  const receiversPoolQuery = useQuery({
    queryKey: ["listOfreceiverInPool"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event?.eventInfoDetail?.eventName,
        company: user.companyData.id,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    eventAttendeesQuery.refetch();
    receiversPoolQuery.refetch();
    eventAttendeesParametersQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  if (
    eventAttendeesQuery.isLoading ||
    receiversPoolQuery.isLoading ||
    eventAttendeesParametersQuery.isLoading
  )
    return (
      <div style={{ ...CenteringGrid, width: "100%" }}>
        {" "}
        <Loading />
      </div>
    );
  if (
    eventAttendeesQuery.data &&
    receiversPoolQuery.data &&
    eventAttendeesParametersQuery.data
  ) {
    const parsingData = receiversPoolQuery?.data?.data?.receiversInventory;

    const inventoryEventAssignedCount = () => {
      let result = 0;
      const { deviceSetup } = event;
      for (let data of deviceSetup) {
        result += Number(data.quantity);
      }
      return result;
    };

    const foundAllDevicesGivenInEvent = () => {
      const check = parsingData;
      return check;
    };

    const checkStaffRoleToDisplayCashReportInfo = () => {
      return event?.staff?.adminUser?.some((member) => member === user.email);
    };

    const foundAttendeesPerEvent = () => {
      const check = eventAttendeesParametersQuery.data.data.users;
      return check;
    };

    const isNumeric = (str) => {
      return !isNaN(str) && !isNaN(parseFloat(str));
    };
    const subtitleInitials = (props) => {
      const splitting = String(props).split(" ");
      let result = new Set();
      for (let data of splitting) {
        if (isNumeric(data)) {
          result.add(data);
        } else {
          result.add(data[0]);
        }
      }
      return Array.from(result)
        .toLocaleString()
        .toUpperCase()
        .replaceAll(",", "");
    };
    const displayElementsBasedOnRole = () => {
      if (
        event.staff.adminUser.some((element) => element.email === user.email) ||
        checkArray(
          user.companyData.employees.filter((ele) => ele.user === user.email)
        ).role < 1
      ) {
        return true;
      }
    };
    return (
      <Grid style={{ ...CenteringGrid, padding: "5px", margin: 0 }} container>
        {notificationStatus && event.active && (
          <Grid margin={"0.5rem 0 1rem"} item xs={12} sm={12} md={12} lg={12}>
            <BannerNotificationTemplate
              setNotificationStatus={setNotificationStatus}
              title={"Reminder from Devitrak!"}
              body={`Please note that the event is still active, even if the end date has passed. To return any items used during the event to the company's inventory, please click the 'End Event' button`}
            />
          </Grid>
        )}
        <Grid
          style={{
            display: `${(isLargeDevice || isExtraLargeDevice) && "none"}`,
            justifyContent: "space-between",
            alignItems: "center",
            gap: "3rem",
          }}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          {checkStaffRoleToDisplayCashReportInfo() && (
            // /event/new_subscription
            <Link to="/create-event-page/event-detail">
              <button
                style={{
                  ...BlueButton,
                  width: "100%",
                  margin: "0rem auto 1rem",
                }}
              >
                <WhitePlusIcon />
                <p style={BlueButtonText}>Add new event</p>
              </button>
            </Link>
          )}
          <button
            disabled={!event.active}
            onClick={() => setCreateUserButton(true)}
            style={{
              ...BlueButton,
              border: "1px solid var(--gray-300, #D0D5DD)",
              width: "100%",
            }}
          >
            <PlusIcon />
            &nbsp;
            <p style={{ ...BlueButtonText, textTransform: "none" }}>
              Add new consumer
            </p>
          </button>
        </Grid>
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            marginY={0}
            item
            xs={12}
            md={6}
          >
            <p
              style={{
                ...TextFontSize30LineHeight38,
                fontWeight: 600,
                padding: `${(isSmallDevice || isMediumDevice) && "5px"}`,
                textAlign: "left",
              }}
            >
              Events
            </p>
          </Grid>
          <Grid
            style={{
              textAlign: "right",
              display: `${isSmallDevice || isMediumDevice ? "none" : "flex"}`,
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "1rem",
            }}
            item
            md={6}
          >
            {checkStaffRoleToDisplayCashReportInfo() && (
              // /event/new_subscription
              <Link to="/create-event-page/event-detail">
                <button style={BlueButton}>
                  <span style={{ ...CenteringGrid, alignSelf: "stretch" }}>
                    <WhitePlusIcon />
                  </span>
                  {/* &nbsp; */}
                  <p style={BlueButtonText}>Add new event</p>
                </button>
              </Link>
            )}
            <button
              onClick={() => setCreateUserButton(true)}
              style={{
                ...BlueButton,
              }}
            >
              <p style={{ ...BlueButtonText, textTransform: "none" }}>
                Add new consumer
              </p>
            </button>
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
          <Grid marginY={0} item xs={12} sm={12} md={8}>
            <Grid
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
              item
              xs={12}
            >
              <Link to="/events">
                <p
                  style={{
                    textTransform: "none",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: "18px",
                    fontFamily: "Inter",
                    lineHeight: "28px",
                    color: "var(--blue-dark-600, #155EEF)",
                  }}
                >
                  All events
                </p>
              </Link>
              <p style={TextFontsize18LineHeight28}>
                <Icon icon="mingcute:right-line" />
                {choice}
              </p>
            </Grid>
            <Grid
              style={{
                paddingTop: "1rem",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
              item
              xs={12}
            >
              <p style={TextFontSize14LineHeight20}>
                {event?.eventInfoDetail?.address}{" "}
              </p>
            </Grid>
          </Grid>
        </Grid>
        <Divider />
        <Grid container>
          <Grid
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              padding: "18px 0",
            }}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            <p
              style={{
                ...TextFontSize30LineHeight38,
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                textWrap: "pretty",
                textTransform: "none",
              }}
            >
              <div style={{ alignSelf: "stretch", width: "15%" }}>
                <Avatar
                  src={
                    event?.eventInfoDetail?.logo ??
                    event?.eventInfoDetail?.eventName
                  }
                  size={70}
                ></Avatar>
              </div>
              <div style={{ width: "85%" }}>
                {event?.eventInfoDetail?.eventName}
                <br />
                <div
                  style={{
                    ...Subtitle,
                    fontWeight: 500,
                    textTransform: "none",
                    margin: "0.3rem 0 0 0",
                  }}
                >
                  {subtitleInitials(event?.eventInfoDetail?.eventName)}
                </div>
              </div>
            </p>
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <FormatEventDetailInfo />
          </Grid>
          <Grid
            style={{
              display: `${displayElementsBasedOnRole() ? "flex" : "none"}`,
              justifyContent: "space-between",
              alignItems: "center",
              margin: "2rem auto 0.2rem",
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <button
              style={{
                background: "transparent",
                outline: "none",
                border: "transparent",
                margin: 0,
                padding: 0,
              }}
              onClick={() => setShowInventoryTypes(!showInventoryTypes)}
            >
              <p
                style={{
                  ...Title,
                  fontSize: "25px",
                  padding: 0,
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  cursor: "pointer",
                  margin: showInventoryTypes ? "0px" : "0 0 5dvh 0",
                }}
              >
                {showInventoryTypes ? <UpNarrowIcon /> : <DownNarrow />}
                Inventory assigned to event:&nbsp;
                <div
                  style={{
                    borderRadius: "16px",
                    background: "var(--blue-dark-50, #EFF4FF)",
                    mixBlendMode: "multiply",
                    width: "fit-content",
                    height: "fit-content",
                  }}
                >
                  <p
                    style={{
                      textTransform: "none",
                      textAlign: "left",
                      fontWeight: 500,
                      fontSize: "12px",
                      fontFamily: "Inter",
                      lineHeight: "28px",
                      color: "var(--blue-dark-700, #004EEB)",
                      padding: "0px 8px",
                    }}
                  >
                    {inventoryEventAssignedCount()} total
                  </p>
                </div>
              </p>
            </button>

            <button
              onClick={() => setEditingInventory(true)}
              style={{
                ...BlueButton,
                width: "fit-content",
                justifyContent: "space-between",
                alignItems: "center",
                display: user.role === "4" ? "none" : "flex",
                margin: showInventoryTypes ? "0px" : "0 0 5dvh 0",
              }}
            >
              <p style={{ ...BlueButtonText }}>Update inventory</p>
            </button>
          </Grid>
          <div style={{ display: showInventoryTypes ? "flex" : "none" }}>
            <DisplayAllItemsSetInventoryEvent />
          </div>
          <Grid item xs={12}>
            <FormatToDisplayDetail />
          </Grid>
          <Grid
            style={{ padding: "8px 8px 8px 0px" }}
            item
            xs={12}
            sm={12}
            md={6}
            lg={4}
          >
            <GraphicInventoryEventActivity />
          </Grid>
          <Grid item xs={12} sm={12} md={6} lg={2}>
            <InventoryEventValue />
          </Grid>
          <Grid
            style={{ padding: `${isExtraLargeDevice && "0px 0px 0px 8px"}` }}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            <Report />
          </Grid>
          <Divider />
          <DevicesInformationSection
            foundAllDevicesGivenInEvent={foundAllDevicesGivenInEvent}
            dataToRenderInComponent={parsingData}
          />
        </Grid>
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "2rem auto 1rem",
          }}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 500,
              color: "#000",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            Consumers at the event:&nbsp;
            <div
              style={{
                borderRadius: "16px",
                background: "var(--blue-dark-50, #EFF4FF)",
                mixBlendMode: "multiply",
                width: "fit-content",
                height: "fit-content",
              }}
            >
              <p
                style={{
                  textTransform: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: "12px",
                  fontFamily: "Inter",
                  lineHeight: "28px",
                  color: "var(--blue-dark-700, #004EEB)",
                  padding: "0px 8px",
                }}
              >
                {foundAttendeesPerEvent()?.length} total
              </p>
            </div>
          </p>
          <button
            onClick={() => setCreateUserButton(true)}
            style={{
              ...BlueButton,
              width: "fit-content",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={BlueButtonText}>Add new customer</p>
          </button>
        </Grid>
        <CustomerInformationSection
          foundAttendeesPerEvent={foundAttendeesPerEvent}
          isSmallDevice={isSmallDevice}
          isMediumDevice={isMediumDevice}
        />
        <Divider />
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "2rem auto 1rem",
          }}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 500,
              color: "#000",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            Staff at the event:&nbsp;
            <div
              style={{
                borderRadius: "16px",
                background: "var(--blue-dark-50, #EFF4FF)",
                mixBlendMode: "multiply",
                width: "fit-content",
                height: "fit-content",
              }}
            >
              <p
                style={{
                  textTransform: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: "12px",
                  fontFamily: "Inter",
                  lineHeight: "28px",
                  color: "var(--blue-dark-700, #004EEB)",
                  padding: "0px 8px",
                }}
              >
                {sum(
                  event?.staff?.adminUser?.length - 1 ?? 0,
                  event?.staff?.headsetAttendees?.length ?? 0
                )}{" "}
                total
              </p>
            </div>
          </p>
          <button
            onClick={() => setEditingStaff(true)}
            style={{
              ...BlueButton,
              width: "fit-content",
              display: user.role === "4" ? "none" : "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={BlueButtonText}>Update staff</p>
          </button>
        </Grid>
        <StaffMainPage />
        {editingInventory && (
          <EditingInventory
            editingInventory={editingInventory}
            setEditingInventory={setEditingInventory}
          />
        )}
        {editingStaff && (
          <EditingStaff
            editingStaff={editingStaff}
            setEditingStaff={setEditingStaff}
          />
        )}
        {createUserButton && (
          <CreateNewConsumer
            createUserButton={createUserButton}
            setCreateUserButton={setCreateUserButton}
          />
        )}
      </Grid>
      // </Grid >
    );
  }
};

export default MainPageQuickGlance;
