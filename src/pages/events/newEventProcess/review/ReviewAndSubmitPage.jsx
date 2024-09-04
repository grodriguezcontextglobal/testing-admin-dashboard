import { Grid, InputLabel, Typography } from "@mui/material";
import { Button, notification } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import {
  onAddEventData,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../../store/slices/subscriptionSlice";
import Device from "./review/Device";
import Event from "./review/Event";
import Staff from "./review/Staff";
import { nanoid } from "@reduxjs/toolkit";
// import { formatDate } from "../../../inventory/utils/dateFormat";
import "./blurring.css";
import { formatDate } from "../../../inventory/utils/dateFormat";
import { checkArray } from "../../../../components/utils/checkArray";
import { groupBy } from "lodash";
const ReviewAndSubmitEvent = () => {
  const { subscription } = useSelector((state) => state.subscription);
  const { eventInfoDetail, staff, deviceSetup, contactInfo } = useSelector(
    (state) => state.event
  );
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (msg) => {
    api.open({
      description: msg,
      duration: 0,
    });
  };

  let dataRef = [...staff.adminUser, ...staff.headsetAttendees];
  const checkAndAddRootAdministratorAsAdminStaff = () => {
    if (!dataRef.some((element) => element.email === user.email)) {
      dataRef = [
        ...dataRef,
        {
          firstName: user.name,
          lastName: user.lastName,
          email: user.email,
          role: "Administrator",
        },
      ];
      return groupBy(dataRef, "role");
    }
    return groupBy(dataRef, "role");
  };
  const createStaffInEvent = async (newEventId) => {
    if (staff.adminUser.length > 0) {
      const adminStaff = [
        ...checkAndAddRootAdministratorAsAdminStaff()["Administrator"],
      ];
      for (let data of adminStaff) {
        const respo = await devitrakApi.post("/db_staff/consulting-member", {
          email: data.email,
        });
        if (respo.data.member.length > 0) {
          await devitrakApi.post("/db_event/event_staff", {
            event_id: newEventId,
            staff_id: respo.data.member.at(-1).staff_id,
            role: data.role,
          });
        } else {
          const newMember = await devitrakApi.post("/db_staff/new_member", {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone_number: "0000000000",
          });
          await devitrakApi.post("/db_event/event_staff", {
            event_id: newEventId,
            staff_id: newMember.data.member.insertId,
            role: data.role,
          });
        }
      }
    }
    if (staff.headsetAttendees.length > 0) {
      const assistance = [
        ...checkAndAddRootAdministratorAsAdminStaff()["HeadsetAttendees"],
      ];
      for (let data of assistance) {
        const respo = await devitrakApi.post("/db_staff/consulting-member", {
          email: data.email,
        });
        if (respo.data.member.length > 0) {
          await devitrakApi.post("/db_event/event_staff", {
            event_id: newEventId,
            staff_id: respo.data.member.at(-1).staff_id,
            role: data.role,
          });
        } else {
          const newMember = await devitrakApi.post("/db_staff/new_member", {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone_number: "0000000000",
          });
          await devitrakApi.post("/db_event/event_staff", {
            event_id: newEventId,
            staff_id: newMember.data.member.insertId,
            role: data.role,
          });
        }
      }
    }
  };

  const deviceSetupNoSQL = () => {
    const result = new Set();
    for (let data of deviceSetup) {
      result.add({
        category: data.category_name,
        group: data.item_group,
        value: data.cost,
        description: data.descript_item,
        company: data.company,
        quantity: data.quantity,
        ownership: data.ownership,
        createdBy: user.email,
        key: nanoid(),
        dateCreated: new Date().toString(),
        resume: `${data.category_name} ${data.item_group} ${data.cost} ${
          data.descript_item
        } ${data.company} ${data.quantity} ${data.ownership} ${
          user.email
        } ${new Date().toString()} ${true} ${data.startingNumber} ${
          data.endingNumber
        }`,
        consumerUses: false,//change this to false to force company to set device for consumer and others to set device for staff
        startingNumber: "000000", //data.startingNumber
        endingNumber: "000000", //data.endingNumber,
        existing: data.existing,
      });
    }
    return Array.from(result);
  };
  const staffDetail = () => {
    const profileStaffList = {
      adminUser: checkAndAddRootAdministratorAsAdminStaff()["Administrator"],
      headsetAttendees:
        checkAndAddRootAdministratorAsAdminStaff()["HeadsetAttendees"],
    };
    return profileStaffList;
  };
  const createEventNoSQLDatabase = async () => {
    const eventLink = eventInfoDetail.eventName.replace(/ /g, "%20");
    const newEventInfo = await devitrakApi.post("/event/create-event", {
      user: user.email,
      company: user.company,
      subscription: [],
      eventInfoDetail: {...eventInfoDetail, dateBeginTime: new Date(eventInfoDetail.dateBeginTime).getTime()},
      staff: staffDetail(),
      deviceSetup: deviceSetupNoSQL(),
      active: true,
      contactInfo: contactInfo,
      qrCodeLink: `https://app.devitrak.net/?event=${eventLink}&company=${user.companyData.id}`,
    });
    if (newEventInfo.data.ok) {
      const eventId = checkArray(newEventInfo.data.event);
      await devitrakApi.patch(`/event/edit-event/${eventId.id}`, {
        qrCodeLink: `https://app.devitrak.net/?event=${eventId.id}&company=${user.companyData.id}`,
      });
    }
  };

  const createEvent = async () => {
    const address = eventInfoDetail.address.split(" ");
    const respo = await devitrakApi.post("/db_event/new_event", {
      event_name: eventInfoDetail.eventName,
      venue_name: eventInfoDetail.eventName,
      street_address: address.slice(0, -3).toString().replaceAll(",", " "),
      city_address: address.at(-3),
      state_address: address.at(-2).replace(",", ""),
      zip_address: address.at(-1),
      email_company: contactInfo.email,
      phone_number: contactInfo.phone[0],
      company_assigned_event_id: user.sqlInfo.company_id,
      contact_name: contactInfo.name,
    });
    await createEventNoSQLDatabase();
    if (respo.data) {
      const newEventId = respo.data.consumer.insertId;
      const newEventInfo = await devitrakApi.post(
        "/db_event/consulting-event",
        { event_id: respo.data.consumer.insertId }
      );
      dispatch(onSelectEvent(eventInfoDetail.eventName));
      dispatch(onSelectCompany(user.company));
      dispatch(
        onAddEventData({
          ...eventInfoDetail,
          sql: newEventInfo.data.event.at(-1),
        })
      );
      dispatch(onAddSubscription(subscription));
      dispatch(
        onAddQRCodeLink(
          `https://app.devitrak.net/?event=${encodeURI(
            eventInfoDetail.eventName
          )}&company=${encodeURI(user.company)}`
        )
      );
      await createStaffInEvent(newEventId);
      // await createDeviceInEvent(newEventId)//function to be trigger in event quick glance
    }
    return;
  };

  const checkAndCreateNewDevicesInSqlDB = async () => {
    if (deviceSetup.some((element) => element.existing === false)) {
      const check = await "there is devices to be created in db";
      for (let data of deviceSetup) {
        if (!data.existing) {
          for (
            let i = Number(data.startingNumber);
            i <= Number(data.endingNumber);
            i++
          ) {
            await devitrakApi.post("/db_item/new_item", {
              category_name: data.category_name,
              item_group: data.item_group,
              cost: data.cost,
              brand: data.brand,
              descript_item: data.descript_item,
              ownership: data.ownership,
              serial_number: String(i).padStart(
                data.startingNumber.length,
                `${data.startingNumber[0]}`
              ),
              warehouse: true,
              main_warehouse: data.main_warehouse,
              location: data.location,
              current_location: data.location,
              created_at: formatDate(new Date()),
              updated_at: formatDate(new Date()),
              company: data.company,
              extra_serial_number: data.extra_serial_number,
              company_id: data.company_id,
              return_date: data.return_date,
            });
          }
        }
      }
      return check;
    } else {
      return;
    }
  };
  const processOfCreatingInformationOfNewEvent = async () => {
    try {
      openNotificationWithIcon(
        "Your request is being processed. When it is done, you will be redirected to event page."
      );
      setLoadingStatus(true);
      setButtonDisable(true);
      await checkAndCreateNewDevicesInSqlDB(); //creating new devices in sql db => moving to event quick glance
      await createEvent();
      setLoadingStatus(false);
      setButtonDisable(false);
      openNotificationWithIcon("Event information created.");
      return navigate("/events");
    } catch (error) {
      openNotificationWithIcon(`${error.message}`);
      setLoadingStatus(false);
      setButtonDisable(false);
      setTimeout(() => api.destroy(), 4000);
    }
  };
  return (
    <Grid
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"space-between"}
      alignItems={"center"}
      gap={2}
      container
    >
      {contextHolder}
      <Grid
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"flex-start"}
        alignItems={"stretch"}
        className={`${loadingStatus ? "blur-container" : ""}`}
        gap={2}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <InputLabel style={{ width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"20px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"30px"}
            color={"var(--gray-600, #475467)"}
            alignSelf={"stretch"}
          >
            Review all the information below
          </Typography>
        </InputLabel>
        <Event />
        <Staff />
        <Device />
        <Button
          type="primary"
          icon={() => Loading}
          disabled={buttonDisable}
          loading={loadingStatus}
          onClick={() => processOfCreatingInformationOfNewEvent()}
          style={{
            display: "flex",
            padding: "12px 20px",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            alignSelf: "stretch",
            borderRadius: "8px",
            border: `${
              buttonDisable
                ? "1px solid var(--base-white, #FFF)"
                : "1px solid var(--blue-dark-600, #155EEF)"
            }`,
            background: `${
              buttonDisable
                ? "var(--base-white, #FFF)"
                : "var(--blue-dark-600, #155EEF)"
            }`,
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
          }}
        >
          <Typography
            textTransform={"none"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"24px"}
            color={`${
              buttonDisable
                ? "var(--blue-dark-600, #155EEF)"
                : "var(--base-white, #FFF)"
            }`}
          >
            Create and save
          </Typography>
        </Button>
      </Grid>
    </Grid>
  );
};

export default ReviewAndSubmitEvent;
