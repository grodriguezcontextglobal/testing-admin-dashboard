import { Grid, InputLabel, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { lazy, Suspense, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import DevitrakLoading from "../../../../components/animation/DevitrakLoading";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../../../styles/global/TextFontSize20HeightLine30";
import "./blurring.css";
import ModalCreatingEventInProgress from "./components/ModalCreatingEvent";
import Service from "./review/service";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";
import { syncEventStaff } from "./utils/eventStaffSync";
import { EVENT_CONFIGURATION, writeEventConfiguration } from "../../utils/eventLifecycle";
const Device = lazy(() => import("./review/Device"));
const Event = lazy(() => import("./review/Event"));
const Staff = lazy(() => import("./review/Staff"));
const ReviewAndSubmitEvent = () => {
  // const { subscription } = useSelector((state) => state.subscription);
  const {
    staff,
    deviceSetup,
    contactInfo,
    event,
  } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);
  const navigate = useNavigate();
  // const dispatch = useDispatch();
  const { notify, contextHolder, api } = useStatusNotification();

  // By email, once each; staff already on the event (a retry, or a resumed
  // draft) are skipped instead of failing the step — see eventStaffSync.js.
  const createStaffInEvent = (newEventId) =>
    syncEventStaff({ api: devitrakApi, eventId: newEventId, staff });

  const lockedItemsInWarehouseForEventShipping = async()=> {
    for (let data of deviceSetup) {
      const findItemsId = await devitrakApi.post(`/db_company/retrieve-company-inventory`,{
      category_name: data.category_name,
      item_group: data.item_group,
      location: data.location,
      limit:data.quantity,
      company_id: user.sqlInfo.company_id,
      });
      if(findItemsId.data.ok && findItemsId.data.items.length === 0){
        notify("error", `Item ${data.item_group} not found in warehouse`);
        return;
      }
      //update items in inventory to lock them out for inventory manager
      await devitrakApi.post(`/db_event/reserve-items-for-event`,{
        items: JSON.parse(findItemsId.data.mapped_result),//pass in JSON.stringify format
        company_id: user.sqlInfo.company_id
      });
      //lock items in inventory for event shipping
      await devitrakApi.post(`/db_event/lock-items-for-event`,{
        items: JSON.parse(findItemsId.data.mapped_result),
        company_id: user.sqlInfo.company_id,
        event_id: event.idSql,
        //event_id, company_id, items
      });
    }
    return;
  };

  const deviceSetupNoSQL = () => {
    const result = new Map();
    for (let data of deviceSetup) {
      if (!result.has(data.item_group)) {
        result.set(data.item_group, {
          category: data.category_name,
          group: data.item_group,
          value: data.cost,
          description: data.descript_item,
          company: data.company,
          isItSetAsContainerForEvent: data.isItSetAsContainerForEvent ? data.isItSetAsContainerForEvent : false,
          quantity: data.quantity,
          ownership: data.ownership,
          container: false,
          createdBy: user.email,
          key: nanoid(),
          dateCreated: new Date().toString(),
          resume: `${data.category_name} ${data.item_group} ${data.cost} ${data.descript_item
            } ${data.company} ${data.quantity} ${data.ownership} ${user.email
            } ${new Date().toString()} ${true} ${data.startingNumber} ${data.endingNumber
            }`,
          consumerUses: data.consumerUses, //change this to false to force company to set device for consumer and others to set device for staff
          startingNumber: null, //data.startingNumber
          endingNumber: null, //data.endingNumber,
          existing: data.existing,
        });
      } else {
        const temp = result.get(data.item_group);
        temp.quantity += data.quantity;
        temp.resume = `${data.category_name} ${data.item_group} ${data.cost} ${data.descript_item
          } ${data.company} ${temp.quantity} ${data.ownership} ${user.email
          } ${new Date().toString()} ${true} ${data.startingNumber} ${data.endingNumber
          }`;
        result.set(data.item_group, temp);
      }
    }
    return Array.from(result.values());
  };

  const createEventNoSQLDatabase = async () => {
    await devitrakApi.patch(`/event/edit-event/${event.idNoSQl}`, {
      deviceSetup: deviceSetupNoSQL(),
      active: true,
      contactInfo: contactInfo,
      contract_for: "event",
    });
    // "created" (was "completed"), on both records. Written apart and
    // tolerantly: a backend that does not accept the word yet must not undo an
    // event that was just activated — `active: true` already says it is real.
    await writeEventConfiguration({
      api: devitrakApi,
      mongoId: event.idNoSQl,
      sqlId: event.idSql,
      value: EVENT_CONFIGURATION.CREATED,
    });
    return await lockedItemsInWarehouseForEventShipping();
  };

  const processOfCreatingInformationOfNewEvent = async () => {
    try {
      notify(
        "info",
        "Your request is being processed. When it is done, you will be redirected to event page.",
      );
      setLoadingStatus(true);
      setButtonDisable(true);
      // await checkAndCreateNewDevicesInSqlDB(); //creating new devices in sql db => moving to event quick glance
      await createStaffInEvent(event.idSql);
      await createEventNoSQLDatabase();
      setLoadingStatus(false);
      setButtonDisable(false);
      notify("success", "Event information created.");
      return navigate("/events");
    } catch (error) {
      notify("error", `${error.message}`);
      setLoadingStatus(false);
      setButtonDisable(false);
      setTimeout(() => api.destroy(), 4000);
    }
  };

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <DevitrakLoading />
        </div>
      }
    >
      <Grid
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-between"}
        alignItems={"center"}
        gap={2}
        container
      >
        {contextHolder}
        <InputLabel style={{ width: "100%" }}>
          <Typography
            textTransform={"none"}
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 600,
              textAlign: "left",
              color: "var(--gray-600, #475467)",
            }}
            alignSelf={"stretch"}
          >
            Review all the event information below
          </Typography>
        </InputLabel>
        <Event />
        <Staff />
        <Device />
        <Service />
        <BlueButtonComponent
          title={"Create and save"}
          func={processOfCreatingInformationOfNewEvent}
          disabled={buttonDisable}
          loadingState={loadingStatus}
          styles={{
            width: "100%",
            border: `${buttonDisable
                ? "1px solid var(--base-white, #FFF)"
                : "1px solid var(--blue-dark-600, #155EEF)"
              }`,
            background: `${buttonDisable
                ? "var(--base-white, #FFF)"
                : "var(--blue-dark-600, #155EEF)"
              }`,
          }}
        />
        {loadingStatus && <DevitrakLoading fullscreen />}
        {/* </Grid> */}
        {loadingStatus && (
          <ModalCreatingEventInProgress openEndingEventModal={loadingStatus} />
        )}
      </Grid>
    </Suspense>
  );
};

export default ReviewAndSubmitEvent;
