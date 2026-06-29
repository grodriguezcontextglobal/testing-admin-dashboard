import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Breadcrumb, Divider, Upload, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
import Loading from "../../../components/animation/Loading";
import BannerNotificationTemplate from "../../../components/notification/alerts/BannerNotificationTemplate";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { isNotAssistant, resolveRoleType } from "../../../config/roles";
import { onAddEventData } from "../../../store/slices/eventSlice";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import AlInventoryEventAssigned from "./components/AlInventoryEventAssigned";
import AllInventoryEventForCustomerOnly from "./components/AllInventoryEventForCustomerOnly";
import FormatEventDetailInfo from "./components/FormatEventDetailInfo";
import FormatToDisplayDetail from "./components/FormatToDisplayDetail";
import GraphicInventoryEventActivity from "./components/GraphicInventoryEventActivity";
import Report from "./components/lostFee/Report";
import ModalsComponentsEventQuickGlance from "./components/modals/ModalsComponentsEventQuickGlance";
import HighlightedPill from "./components/ux/HighlightedPill";
import CustomerInformationSection from "./consumer/CustomerInformationSection";
import DevicesInformationSection from "./inventory/DevicesInformationSection";
import StaffMainPage from "./staff/StaffMainPage";

const sectionHeaderStyle = {
  fontFamily: "Inter",
  fontSize: "20px",
  fontWeight: 600,
  lineHeight: "30px",
  color: "var(--gray-900, #101828)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  margin: 0,
};

const MainPageQuickGlance = () => {
  const today = new Date().getTime();
  const { choice, event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [createUserButton, setCreateUserButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInventoryTypes, setShowInventoryTypes] = useState(true);
  const [showInventoryTypesForCustomersOnly, setShowInventoryTypesForCustomersOnly] = useState(true);
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

  const dispatch = useDispatch();

  const sum = (a, b) => a + b;

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
      devitrakApi.post(`/receiver/receiver-pool-list`, {
        eventSelected: event?.eventInfoDetail?.eventName,
        company: user.companyData.id,
      }),
    enabled: !!user.companyData.id,
  });

  if (
    eventAttendeesQuery.isLoading ||
    receiversPoolQuery.isLoading ||
    eventAttendeesParametersQuery.isLoading
  )
    return (
      <div style={{ ...CenteringGrid, width: "100%" }}>
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
      for (let data of event.deviceSetup) {
        if (!data.consumerUses) result += Number(data.quantity);
      }
      return result;
    };

    const inventoryEventAssignedForCustomersCount = () => {
      let result = 0;
      for (let data of event.deviceSetup) {
        if (data.consumerUses) result += Number(data.quantity);
      }
      return result;
    };

    const foundAllDevicesGivenInEvent = () => parsingData;

    const checkStaffRoleToDisplayCashReportInfo = () =>
      event?.staff?.adminUser?.some((member) => member === user.email);

    const foundAttendeesPerEvent = () =>
      eventAttendeesParametersQuery.data.data.users;

    const displayElementsBasedOnRole = () => {
      if (
        event.staff.adminUser.some((element) => element.email === user.email) ||
        resolveRoleType(user) === "root_admin"
      ) {
        return true;
      }
    };

    const beforeUpload = (file) => {
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) message.error("You can only upload JPG/PNG file!");
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) message.error("Image must smaller than 2MB!");
      return isJpgOrPng && isLt2M;
    };

    const uploadButton = (
      <button
        style={{ border: 0, background: "none", width: "100%", aspectRatio: 1 }}
        type="button"
      >
        {isLoading ? <Loading /> : null}
        <p
          style={{
            ...Subtitle,
            marginTop: 8,
            display: isLoading ? "none" : "inline-block",
          }}
        >
          Upload
        </p>
      </button>
    );

    const handleUploadImage = async (info) => {
      try {
        setIsLoading(true);
        const imageUrl = await convertToBase64(info.file.originFileObj);
        const imageDataFormat = new ImageUploaderFormat(
          imageUrl, user.companyData.id, "", "", "", "", "", event.id, ""
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
        }
      } catch (error) {
        message.error(`Upload failed: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    const breadcrumbItems = [
      {
        title: (
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
        ),
      },
      { title: <p style={TextFontsize18LineHeight28}>{choice}</p> },
    ];

    return (
      <Grid container style={{ padding: "0 5px" }}>

        {/* Notification banner */}
        {notificationStatus && event.active && (
          <Grid item xs={12} style={{ margin: "12px 0 16px" }}>
            <BannerNotificationTemplate
              setNotificationStatus={setNotificationStatus}
              title={"Reminder from Devitrak!"}
              body={`Please note that the event is still active, even if the end date has passed. To return any items used during the event to the company's inventory, please click the 'End Event' button`}
            />
          </Grid>
        )}

        {/* Breadcrumb */}
        <Grid item xs={12} style={{ paddingTop: "16px" }}>
          <Breadcrumb separator=">" items={breadcrumbItems} />
        </Grid>

        {/* Page header: logo + event name + address + actions */}
        <Grid
          item
          xs={12}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            padding: "16px 0 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
              flex: 1,
              minWidth: 0,
            }}
          >
            <Upload
              name="avatar"
              listType="picture-circle"
              className="avatar-uploader"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onChange={handleUploadImage}
            >
              {event?.eventInfoDetail?.logo ? (
                <img
                  src={event?.eventInfoDetail?.logo}
                  alt="event logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              ) : (
                uploadButton
              )}
            </Upload>
            <div style={{ paddingTop: "4px", minWidth: 0 }}>
              <p
                style={{
                  ...TextFontSize30LineHeight38,
                  fontWeight: 700,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {event?.eventInfoDetail?.eventName}
              </p>
              <p
                style={{
                  ...TextFontSize14LineHeight20,
                  color: "var(--gray-600, #475467)",
                  marginTop: "4px",
                }}
              >
                {event?.eventInfoDetail?.address}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            {checkStaffRoleToDisplayCashReportInfo() && (
              <Link to="/create-event-page/event-detail">
                <BlueButtonComponent title="Add new event" />
              </Link>
            )}
            <BlueButtonComponent
              func={() => setCreateUserButton(true)}
              disabled={!event.active}
              title="Add new consumer"
            />
          </div>
        </Grid>

        <Grid item xs={12}>
          <Divider style={{ margin: "16px 0" }} />
        </Grid>

        {/* Event detail columns: contact, dates, actions, QR */}
        <Grid item xs={12} style={{ marginBottom: "16px" }}>
          <FormatEventDetailInfo />
        </Grid>

        {/* Summary metric cards */}
        <Grid item xs={12} style={{ marginBottom: "16px" }}>
          <FormatToDisplayDetail />
        </Grid>

        {/* Activity chart + lost fee report */}
        <Grid item xs={12} style={{ marginBottom: "16px" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={4}>
              <GraphicInventoryEventActivity />
              </Grid>
            <Grid item xs={12} md={8}>
              <Report />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider style={{ margin: "8px 0 16px" }} />
        </Grid>

        {/* Inventory assigned to event */}
        <Grid item xs={12}>
          <AlInventoryEventAssigned
            key="AlInventoryEventAssigned"
            displayElementsBasedOnRole={displayElementsBasedOnRole}
            setShowInventoryTypes={setShowInventoryTypes}
            showInventoryTypes={showInventoryTypes}
            inventoryEventAssignedCount={inventoryEventAssignedCount}
            setEditingInventory={setEditingInventory}
            setEditingServiceInEvent={setEditingServiceInEvent}
            user={user}
            database={receiversPoolQuery?.data?.data}
          />
        </Grid>

        {/* Consumer-only inventory */}
        <Grid item xs={12} style={{ marginTop: "16px" }}>
          <AllInventoryEventForCustomerOnly
            key="AllInventoryEventForCustomerOnly"
            displayElementsBasedOnRole={displayElementsBasedOnRole}
            setShowInventoryTypes={setShowInventoryTypesForCustomersOnly}
            showInventoryTypes={showInventoryTypesForCustomersOnly}
            inventoryEventAssignedCount={inventoryEventAssignedForCustomersCount}
            setEditingInventory={setEditingInventory}
            setEditingServiceInEvent={setEditingServiceInEvent}
            user={user}
            database={receiversPoolQuery?.data?.data}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider style={{ margin: "16px 0" }} />
        </Grid>

        {/* Device-level table */}
        <Grid item xs={12}>
          <DevicesInformationSection
            foundAllDevicesGivenInEvent={foundAllDevicesGivenInEvent}
            dataToRenderInComponent={parsingData}
          />
        </Grid>

        {/* Consumers section */}
        <Grid
          item
          xs={12}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "24px 0 12px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p style={sectionHeaderStyle}>
            Consumers at the event
            <HighlightedPill
              props={`${foundAttendeesPerEvent()?.length} total`}
            />
          </p>
          <BlueButtonComponent
            func={() => setCreateUserButton(true)}
            title="Add new consumer"
          />
        </Grid>
        <Grid item xs={12}>
          <CustomerInformationSection
            foundAttendeesPerEvent={foundAttendeesPerEvent}
            isSmallDevice={isSmallDevice}
            isMediumDevice={isMediumDevice}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider style={{ margin: "16px 0" }} />
        </Grid>

        {/* Staff section */}
        <Grid
          item
          xs={12}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "24px 0 12px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p style={sectionHeaderStyle}>
            Staff at the event
            <HighlightedPill
              props={`${sum(
                event?.staff?.adminUser?.length ?? 0,
                event?.staff?.headsetAttendees?.length ?? 0
              )} total`}
            />
          </p>
          {isNotAssistant(user.roleType) && (
            <BlueButtonComponent
              func={() => setEditingStaff(true)}
              title="Update staff"
            />
          )}
        </Grid>
        <Grid item xs={12}>
          <StaffMainPage />
        </Grid>

        {/* Modals */}
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
