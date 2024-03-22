import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, Divider } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { PlusIcon, WhitePlusIcon } from "../../../components/icons/Icons";
import BannerNotificationTemplate from "../../../components/notification/alerts/BannerNotificationTemplate";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
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
import StaffMainPage from "./staff/StaffMainPage";
import EditingStaff from "./staff/components/EditingStaff";
const MainPageQuickGlance = () => {
  const today = new Date().getTime()
  const { choice, event, company } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [createUserButton, setCreateUserButton] = useState(false);
  const [editingStaff, setEditingStaff] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState(today > new Date(event.eventInfoDetail.dateEnd).getTime())
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

  const eventAttendeesQuery = useQuery({
    queryKey: ["listOfAttendees"],
    queryFn: () => devitrakApi.get("/auth/users"),
    enabled: false,
    refetchOnMount: false,
    notifyOnChangeProps: ['data', 'dataUpdatedAt']
  });
  const receiversPoolQuery = useQuery({
    queryKey: ["listOfreceiverInPool"],
    queryFn: () => devitrakApi.post("/receiver/receiver-pool-list", { eventSelected: event?.eventInfoDetail?.eventName, provider: event.company }),
    enabled: false,
    refetchOnMount: false,
    notifyOnChangeProps: ['data', 'dataUpdatedAt']
  });
  useEffect(() => {
    const controller = new AbortController()
    eventAttendeesQuery.refetch()
    receiversPoolQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [])

  if (eventAttendeesQuery.isLoading) return <div style={{ ...CenteringGrid, width: "100%" }} > <Loading /></ div>
  if (eventAttendeesQuery.data || eventAttendeesQuery.isFetched) {
    const foundAllDevicesGivenInEvent = () => {
      const check = receiversPoolQuery?.data?.data?.receiversInventory?.filter(
        (item) => item.eventSelected === choice && item.provider === company
      );
      return check;
    };
    const checkStaffRoleToDisplayCashReportInfo = () => {
      return event?.staff?.adminUser?.some((member) => member === user.email);
    };

    const foundAttendeesPerEvent = () => {
      const check = eventAttendeesQuery.data.data.users?.filter((item) =>
        item?.eventSelected?.find((item) => item === choice)
      );
      return check;
    };


    const isNumeric = (str) => {
      return !isNaN(str) && !isNaN(parseFloat(str));
    }
    const subtitleInitials = (props) => {
      const splitting = String(props).split(' ')
      let result = new Set()
      for (let data of splitting) {
        if (isNumeric(data)) {
          result.add(data)
        } else {
          result.add(data[0])
        }
      }
      return Array.from(result).toLocaleString().toUpperCase().replaceAll(',', '')
    }
    return (
      <Grid style={{ ...CenteringGrid, padding: "5px", margin: 0 }} container >
        {notificationStatus && event.active && <Grid margin={'0.5rem 0 1rem'} item xs={12} sm={12} md={12} lg={12}>
          <BannerNotificationTemplate
            setNotificationStatus={setNotificationStatus} title={'Reminder from Devitrak!'}
            body={`Please note that the event is still active, even if the end date has passed. To return any items used during the event to the company's inventory, please click the 'End Event' button`} />
        </Grid>}
        {/* {notificationStatus && event.active && <Grid margin={'0.5rem 0 1rem'} item xs={12} sm={12} md={12} lg={12}>
          <EndEventButton />
        </Grid>} */}
        <Grid
          display={`${(isLargeDevice || isExtraLargeDevice) && "none"}`}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={3}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          {checkStaffRoleToDisplayCashReportInfo() && (
            <Link to="/event/new_subscription">
              <Button style={{ ...BlueButton, width: "100%", margin: "0rem auto 1rem" }}>
                <WhitePlusIcon /><Typography style={BlueButtonText}>
                  Add new event
                </Typography>
              </Button>
            </Link>
          )}
          <Button
            disable={!event.active}
            onClick={() => setCreateUserButton(true)}
            style={{ ...GrayButton, border: "1px solid var(--gray-300, #D0D5DD)", width: "100%" }}
          >
            <PlusIcon />
            &nbsp;
            <Typography
              textTransform={"none"}
              style={GrayButtonText}
            >
              Add new consumer
            </Typography>
          </Button>
        </Grid>
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid marginY={0} item xs={12} md={6}>
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--gray-900, #101828)",
                lineHeight: "38px",
                padding: `${(isSmallDevice || isMediumDevice) && "5px"}`,
              }}
              textAlign={"left"}
              fontWeight={600}
              fontFamily={"Inter"}
              fontSize={"30px"}
            >
              Events
            </Typography>
          </Grid>
          <Grid
            textAlign={"right"}
            display={`${isSmallDevice || isMediumDevice ? "none" : "flex"}`}
            justifyContent={"flex-end"}
            alignItems={"center"}
            gap={1}
            item
            md={6}
          >
            {checkStaffRoleToDisplayCashReportInfo() && (
              <Link to="/event/new_subscription">
                <Button style={BlueButton}>
                  <WhitePlusIcon />&nbsp;<Typography style={BlueButtonText}>
                    Add new event
                  </Typography>
                </Button>
              </Link>
            )}
            <Button
              onClick={() => setCreateUserButton(true)}
              style={GrayButton}
            >
              <PlusIcon />
              &nbsp;
              <Typography
                textTransform={"none"}
                style={GrayButtonText}
              >
                Add new consumer
              </Typography>
            </Button>
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
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Link to="/events">
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontWeight={600}
                  fontSize={"18px"}
                  fontFamily={"Inter"}
                  lineHeight={"28px"}
                  color={"var(--blue-dark-600, #155EEF)"}
                >
                  All events
                </Typography>
              </Link>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={600}
                fontSize={"18px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--gray-900, #101828)"}
              >
                <Icon icon="mingcute:right-line" />
                {choice}
              </Typography>
            </Grid>
            <Grid
              paddingTop={1}
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={400}
                fontSize={"14px"}
                fontFamily={"Inter"}
                lineHeight={"20px"}
                color={"var(--gray-600, #475467)"}
              >
                {event?.eventInfoDetail?.address}{" "}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Divider />
        <Grid container>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
            padding={"18px 0"}
          >
            <Typography
              textTransform={"none"}
              style={{ ...TextFontSize30LineHeight38, textAlign: 'left', display: 'flex', justifyContent: "space-between", alignItems: "center", width: "100%", textWrap: "pretty" }}
            >
              <div style={{ alignSelf: "stretch", width: "15%" }}>
                <Avatar src={event?.eventInfoDetail?.logo ?? event?.eventInfoDetail?.eventName} size={70}></Avatar>
              </div>
              <div style={{ width: "85%" }}>
                {event?.eventInfoDetail?.eventName}
                <br />
                <div style={{ ...Subtitle, fontWeight: 500, textTransform: "none", margin: "0.3rem 0 0 0" }}>
                  {subtitleInitials(event?.eventInfoDetail?.eventName)}
                </div>
              </div>

            </Typography>
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <FormatEventDetailInfo />
          </Grid>
          <Grid display={'flex'} justifyContent={'flex-start'} alignItems={'center'} margin={'2rem auto 0.2rem'} xs={12} sm={12} md={12} lg={12}>
            <Typography style={{ ...Title, fontSize: "25px", padding: 0, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>Inventory assigned to event:&nbsp;<div
              style={{
                borderRadius: "16px",
                background: "var(--blue-dark-50, #EFF4FF)",
                mixBlendMode: "multiply",
                width: "fit-content",
                height: "fit-content",
              }}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={500}
                fontSize={"12px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--blue-dark-700, #004EEB)"}
                padding={"0px 8px"}
              >
                {foundAllDevicesGivenInEvent()?.length} total
              </Typography>
            </div></Typography>
          </Grid>
          <DisplayAllItemsSetInventoryEvent />
          <DevicesInformationSection
            foundAllDevicesGivenInEvent={foundAllDevicesGivenInEvent}
          />
          <Grid item xs={12}>
            <FormatToDisplayDetail />
          </Grid>
          <Grid
            padding={"8px 8px 8px 0px"}
            item
            xs={12}
            sm={12}
            md={6}
            lg={4}
          >
            <GraphicInventoryEventActivity />
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
            md={6}
            lg={2}
          >
            <InventoryEventValue />
          </Grid>
          <Grid
            padding={`${(isExtraLargeDevice) && "0px 0px 0px 8px"
              }`}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            <Report />
          </Grid>
        </Grid>
        <Divider />{" "}
        <Grid display={'flex'} justifyContent={'flex-start'} alignItems={'center'} margin={'2rem auto 1rem'} xs={12} sm={12} md={12} lg={12}>
          <Typography style={{ ...TextFontSize20LineHeight30, fontWeight: 500, color: '#000', display: "flex", justifyContent: "flex-start", alignItems: "center" }}>Consumers at the event:&nbsp;<div
            style={{
              borderRadius: "16px",
              background: "var(--blue-dark-50, #EFF4FF)",
              mixBlendMode: "multiply",
              width: "fit-content",
              height: "fit-content",
            }}
          >
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontWeight={500}
              fontSize={"12px"}
              fontFamily={"Inter"}
              lineHeight={"28px"}
              color={"var(--blue-dark-700, #004EEB)"}
              padding={"0px 8px"}
            >
              {foundAttendeesPerEvent()?.length} total
            </Typography>
          </div></Typography>
        </Grid>
        <CustomerInformationSection
          foundAttendeesPerEvent={foundAttendeesPerEvent}
          isSmallDevice={isSmallDevice}
          isMediumDevice={isMediumDevice}
        />
        <Divider />
        <Grid display={'flex'} justifyContent={'space-between'} alignItems={'center'} margin={'2rem auto 1rem'} xs={12} sm={12} md={12} lg={12}>
          <Typography style={{ ...TextFontSize20LineHeight30, fontWeight: 500, color: '#000', display: "flex", justifyContent: "flex-start", alignItems: "center" }}>Staff at the event:&nbsp;<div
            style={{
              borderRadius: "16px",
              background: "var(--blue-dark-50, #EFF4FF)",
              mixBlendMode: "multiply",
              width: "fit-content",
              height: "fit-content",
            }}
          >
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontWeight={500}
              fontSize={"12px"}
              fontFamily={"Inter"}
              lineHeight={"28px"}
              color={"var(--blue-dark-700, #004EEB)"}
              padding={"0px 8px"}
            >
              {event.staff.adminUser.length + event.staff.headsetAttendees.length} total
            </Typography>
          </div></Typography>
          <Button onClick={() => setEditingStaff(true)} style={{ ...BlueButton, width: "fit-content", display:"flex", justifyContent:"space-between", alignItems:"center" }}><WhitePlusIcon />&nbsp;<Typography style={BlueButtonText}>Add staff</Typography></Button>
        </Grid>
        <StaffMainPage />
        {editingStaff && <EditingStaff editingStaff={editingStaff} setEditingStaff={setEditingStaff} />}
        {
          createUserButton && (
            <CreateNewConsumer
              createUserButton={createUserButton}
              setCreateUserButton={setCreateUserButton}
            />
          )
        }
      </Grid >
    );
  }
};

export default MainPageQuickGlance;
