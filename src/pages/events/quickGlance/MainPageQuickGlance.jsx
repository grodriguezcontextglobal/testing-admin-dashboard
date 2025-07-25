// import { Icon } from "@iconify/react";
import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Breadcrumb, Divider, Upload, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { PlusIcon } from "../../../components/icons/PlusIcon";
import { WhitePlusIcon } from "../../../components/icons/WhitePlusIcon";
import BannerNotificationTemplate from "../../../components/notification/alerts/BannerNotificationTemplate";
import { checkArray } from "../../../components/utils/checkArray";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { onAddEventData } from "../../../store/slices/eventSlice";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
// import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import AlInventoryEventAssigned from "./components/AlInventoryEventAssigned";
import AllInventoryEventForCustomerOnly from "./components/AllInventoryEventForCustomerOnly";
import FormatEventDetailInfo from "./components/FormatEventDetailInfo";
import FormatToDisplayDetail from "./components/FormatToDisplayDetail";
import GraphicInventoryEventActivity from "./components/GraphicInventoryEventActivity";
import InventoryEventValue from "./components/InventoryEventValue";
import Report from "./components/lostFee/Report";
import ModalsComponentsEventQuickGlance from "./components/modals/ModalsComponentsEventQuickGlance";
import CustomerInformationSection from "./consumer/CustomerInformationSection";
import DevicesInformationSection from "./inventory/DevicesInformationSection";
import StaffMainPage from "./staff/StaffMainPage";
import HighlightedPill from "./components/ux/HighlightedPill";
const MainPageQuickGlance = () => {
  const today = new Date().getTime();
  const { choice, event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [createUserButton, setCreateUserButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInventoryTypes, setShowInventoryTypes] = useState(false);
  const [
    showInventoryTypesForCustomersOnly,
    setShowInventoryTypesForCustomersOnly,
  ] = useState(true);
  const [editingStaff, setEditingStaff] = useState(false);
  const [editingInventory, setEditingInventory] = useState(false);
  const [editingServiceInEvent, setEditingServiceInEvent] = useState(false);
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

  const dispatch = useDispatch();

  const sum = (a, b) => {
    return a + b;
  };
  const eventAttendeesQuery = useQuery({
    queryKey: ["listOfAttendees"],
    queryFn: () => devitrakApi.get("/auth/users"),
    refetchOnMount: false,
    enabled: !!user.companyData.id,
    staleTime: 10 * 60 * 60,
  });

  const eventAttendeesParametersQuery = useQuery({
    queryKey: ["listOfAttendeesPerSelectedEvent"],
    queryFn: () =>
      devitrakApi.get(
        `/auth/user-query?event_providers=${event.id}&company_providers=${user.companyData.id}`
      ),
    refetchOnMount: false,
    enabled: !!user.companyData.id,
    staleTime: 10 * 60 * 60,
  });

  const receiversPoolQuery = useQuery({
    queryKey: ["listOfreceiverInPool"],
    queryFn: () =>
      devitrakApi.get(
        `/receiver/receiver-pool-list?eventSelected=${event?.eventInfoDetail?.eventName}&company=${user.companyData.id}`
      ),
    refetchOnMount: false,
    enabled: !!user.companyData.id,
    staleTime: 10 * 60 * 60,
  });

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
    const parsingData =
      receiversPoolQuery?.data?.data?.receiversInventory ??
      receiversPoolQuery?.data?.data?.items;
    const inventoryEventAssignedCount = () => {
      let result = 0;
      const { deviceSetup } = event;
      for (let data of deviceSetup) {
        if (!data.consumerUses) {
          result += Number(data.quantity);
        }
      }
      return result;
    };

    const inventoryEventAssignedForCustomersCount = () => {
      let result = 0;
      const { deviceSetup } = event;
      for (let data of deviceSetup) {
        if (data.consumerUses) {
          result += Number(data.quantity);
        }
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

    const beforeUpload = (file) => {
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) {
        message.error("You can only upload JPG/PNG file!");
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Image must smaller than 2MB!");
      }
      return isJpgOrPng && isLt2M;
    };

    const uploadButton = (
      <button
        style={{
          border: 0,
          background: "none",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
        type="button"
      >
        {isLoading ? <Loading /> : null}
        <div
          style={{
            marginTop: 8,
          }}
        >
          <p
            style={{
              ...Subtitle,
              display: `${isLoading ? "none" : "inline-block"}`,
            }}
          >
            Upload
          </p>
        </div>
      </button>
    );

    const handleUploadImage = async (info) => {
      try {
        setIsLoading(true);
        const imageUrl = await convertToBase64(info.file.originFileObj);
        const imageDataFormat = new ImageUploaderFormat(
          imageUrl,
          user.companyData.id,
          "",
          "",
          "",
          "",
          "",
          event.id,
          ""
        );

        const responseCloudinary = await devitrakApi.post(
          "/cloudinary/upload-image",
          imageDataFormat.event_uploader()
        );
        if (responseCloudinary.data) {
          await devitrakApi.patch(`/event/edit-event/${event.id}`, {
            eventInfoDetail: {
              ...event.eventInfoDetail,
              logo: responseCloudinary.data.imageUploaded.secure_url,
            },
          });
          dispatch(
            onAddEventData({
              ...event,
              eventInfoDetail: {
                ...event.eventInfoDetail,
                logo: responseCloudinary.data.imageUploaded.secure_url,
              },
            })
          );
          message.success("Image uploaded successfully");
          return setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        return message.error(`Upload failed: ${error.message}`);
      }
    };

    const style = {
      titleNavigation: {
        textTransform: "none",
        textAlign: "left",
        fontWeight: 600,
        fontSize: "18px",
        fontFamily: "Inter",
        lineHeight: "28px",
        color: "var(--blue-dark-600, #155EEF)",
      },
    };

    const breadcrumbItems = [
      {
        title: (
          <Link to="/events">
            <p style={style.titleNavigation}>All events</p>
          </Link>
        ),
      },
      { title: <p style={TextFontsize18LineHeight28}>{choice}</p> },
    ];

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
              <BlueButtonComponent
                icon={<WhitePlusIcon />}
                title={"Add new event"}
                func={null}
                styles={{ width: "100%", margin: "0rem auto 1rem" }}
              />
            </Link>
          )}
          <BlueButtonComponent
            func={() => setCreateUserButton(true)}
            disabled={!event.active}
            styles={{
              border: "1px solid var(--gray-300, #D0D5DD)",
              width: "100%",
            }}
            title={"Add new consumer"}
            icon={<PlusIcon />}
          />
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
                <BlueButtonComponent
                  icon={<WhitePlusIcon />}
                  title={"Add new event"}
                  func={null}
                  styles={{ alignSelf: "stretch" }}
                />
              </Link>
            )}
            <BlueButtonComponent
              func={() => setCreateUserButton(true)}
              title={"Add new consumer"}
              icon={<WhiteCirclePlusIcon />}
            />
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
          <Grid marginY={0} item xs={12} sm={12} md={12} lg={12}>
            <Grid
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <Breadcrumb separator=">" items={breadcrumbItems} />
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
            <div
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
              <div
                style={{
                  alignSelf: "stretch",
                  // width: "35%",
                  margin: "0 1rem 0 0",
                  height: "auto",
                  overflow: "hidden",
                  borderRadius: "50%",
                  border: "1px solid var(--gray500)",
                }}
              >
                <Upload
                  name="avatar"
                  listType="picture-circle"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleUploadImage}
                  style={{
                    backgroundColor: "var(--gray500)",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  {event?.eventInfoDetail?.logo ? (
                    <img
                      src={event?.eventInfoDetail?.logo}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        zIndex: "-1",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
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
            </div>
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <FormatEventDetailInfo />
          </Grid>
          <AlInventoryEventAssigned
            key={"AlInventoryEventAssigned"}
            displayElementsBasedOnRole={displayElementsBasedOnRole}
            setShowInventoryTypes={setShowInventoryTypes}
            showInventoryTypes={showInventoryTypes}
            inventoryEventAssignedCount={inventoryEventAssignedCount}
            setEditingInventory={setEditingInventory}
            setEditingServiceInEvent={setEditingServiceInEvent}
            user={user}
            AlInventoryEventAssigned
            database={receiversPoolQuery?.data?.data}
          />
          <AllInventoryEventForCustomerOnly
            key={"AllInventoryEventForCustomerOnly"}
            displayElementsBasedOnRole={displayElementsBasedOnRole}
            setShowInventoryTypes={setShowInventoryTypesForCustomersOnly}
            showInventoryTypes={showInventoryTypesForCustomersOnly}
            inventoryEventAssignedCount={
              inventoryEventAssignedForCustomersCount
            }
            setEditingInventory={setEditingInventory}
            setEditingServiceInEvent={setEditingServiceInEvent}
            user={user}
            AlInventoryEventAssigned
            database={receiversPoolQuery?.data?.data}
          />

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
            <HighlightedPill
              props={`${foundAttendeesPerEvent()?.length} total`}
            />
          </p>
          <BlueButtonComponent
            func={() => setCreateUserButton(true)}
            styles={{
              width: "fit-content",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            title={"Add new consumer"}
          />
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
            <HighlightedPill
              props={`${sum(
                event?.staff?.adminUser?.length ?? 0,
                event?.staff?.headsetAttendees?.length ?? 0
              )} total`}
            />
          </p>
          <BlueButtonComponent
            func={() => setEditingStaff(true)}
            styles={{
              width: "fit-content",
              display: user.role === "4" ? "none" : "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            title={"Update staff"}
          />
        </Grid>
        <StaffMainPage />
        {(editingInventory ||
          editingServiceInEvent ||
          editingStaff ||
          createUserButton) && (
          <ModalsComponentsEventQuickGlance
            editingInventory={editingInventory}
            setEditingInventory={setEditingInventory}
            editingServiceInEvent={editingServiceInEvent}
            setEditingServiceInEvent={setEditingServiceInEvent}
            editingStaff={editingStaff}
            setEditingStaff={setEditingStaff}
            createUserButton={createUserButton}
            setCreateUserButton={setCreateUserButton}
          />
        )}
      </Grid>
    );
  }
};

export default MainPageQuickGlance;
