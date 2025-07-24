import {
  Chip,
  FormLabel,
  Grid,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { Divider, Modal, Space, Switch, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import LightBlueButtonComponent from "../../../../../../components/UX/buttons/LigthBlueButton";
import { onAddEventData } from "../../../../../../store/slices/eventSlice";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../../../../../styles/global/LightBlueButton";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../styles/global/Subtitle";

const EditingServiceInEvent = ({
  editingServicesInEvent,
  setEditingServicesInEvent,
}) => {
  const { register, handleSubmit } = useForm();
  const { event } = useSelector((state) => state.event);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [eventServiceCopy, setEventServiceCopy] = useState(event.extraServices);
  const [needService, setNeedService] = useState(event.extraServicesNeeded);
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (msg) => {
    api.open({
      message: msg,
      duration: 5,
    });
  };

  const closeModal = () => {
    return setEditingServicesInEvent(false);
  };

  const handleDeleteService = async (index) => {
    setLoadingStatus(true);
    const newServices = eventServiceCopy.filter((_, i) => i !== index);
    let updatingEvent = event;
    updatingEvent.extraServices = newServices;
    const response = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
      extraServices: newServices,
    });
    if (response.data) {
      loadingStatus(false);
      setEventServiceCopy(newServices);
      return openNotification("Service remove from event successfully");
    }
    return setLoadingStatus(false);
  };

  const handleAddService = async (data) => {
    setLoadingStatus(true);
    let newServices = [...eventServiceCopy, data];
    let updatingEvent = {
      ...event
    };
    updatingEvent.extraServices = newServices;
    const response = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
      extraServices: newServices,
    });
    if (response.data) {
      setEventServiceCopy(newServices);
      setLoadingStatus(false);
      dispatch(
        onAddEventData({
          ...event,
          extraServices: newServices,
        })
      );

      return openNotification("Service added to event successfully");
    }
    return setLoadingStatus(false);
  };

  const handleUpdateServiceNeededInEvent = async (e) => {
    setLoadingStatus(true);
    const response = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
      extraServicesNeeded: e,
    });
    if (response.data) {
      dispatch(
        onAddEventData({
          ...event,
          extraServicesNeeded: e,
        })
      );
      setNeedService(e);
      setLoadingStatus(false);
      return openNotification(e ? "Enabling service in this event." : "Disabling service in this event.");
    }
  };
  return (
    <Modal
      open={editingServicesInEvent}
      onCancel={() => closeModal()}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 30,
        margin: "15rem auto 0px",
      }}
      footer={[]}
    >
      {contextHolder}
      <Grid width={"70vw"} container>
        <Grid padding={"0 25px 0 0"} item xs={10} sm={10} md={12} lg={12}>
          <FormLabel
            style={{
              marginBottom: "0.2rem",
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <p style={{ ...Subtitle, fontWeight: 500 }}>
              Do you need to offer some service in this event?
            </p>
            &nbsp;
            <Switch
              key={"need-service"}
              defaultChecked={needService}
              checkedChildren="Yes"
              unCheckedChildren="No"
              onChange={(e) => handleUpdateServiceNeededInEvent(e)}
            />
          </FormLabel>
          <Grid
            style={{
              display: needService ? "flex" : "none",
              borderRadius: "8px",
              border: "1px solid var(--gray300, #D0D5DD)",
              background: "var(--gray100, #F2F4F7)",
              padding: "24px",
              width: "100%",
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <form
              onSubmit={handleSubmit(handleAddService)}
              style={{
                width: "100%",
              }}
            >
              <Grid
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                marginY={2}
                gap={2}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <Grid item xs={6} sm={6} md={6} lg={6}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p
                      style={{
                        ...Subtitle,
                        fontWeight: 500,
                        textTransform: "none",
                        textAlign: "left",
                      }}
                    >
                      Service
                    </p>
                  </InputLabel>
                  <OutlinedInput
                    {...register("service")}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    placeholder="Enter service name."
                    fullWidth
                  />
                </Grid>
                <Grid
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                  item
                  xs={3}
                  sm={3}
                  md={3}
                  lg={3}
                >
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p
                      style={{
                        ...Subtitle,
                        fontWeight: 500,
                        textTransform: "none",
                        textAlign: "left",
                      }}
                    >
                      Amount to charge
                    </p>
                  </InputLabel>
                  <OutlinedInput
                    {...register("deposit")}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                      textAlign: "left",
                    }}
                    placeholder="e.g. 100"
                  />
                </Grid>
                <Grid
                  style={{ alignSelf: "end", height: "2.5rem" }}
                  item
                  xs={3}
                  sm={3}
                  md={3}
                  lg={3}
                >
                  <LightBlueButtonComponent
                    title={"Update event."}
                    loadingState={loadingStatus}
                    disabled={loadingStatus}
                    styles={{
                      ...LightBlueButton,
                      ...CenteringGrid,
                      width: "100%",
                      height: "100%",
                    }}
                    titleStyles={{ ...CenteringGrid, textTransform: "none" }}
                    buttonType="submit"
                  />
                </Grid>
              </Grid>
            </form>
          </Grid>
          <Divider />
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <Space style={{ width: "100%" }} size={[8, 16]} wrap>
              {event.extraServicesNeeded &&
                eventServiceCopy.map((item, index) => {
                  return (
                    <Chip
                      label={`${item.service} - $${item.deposit}`}
                      key={`${item.service}-${item.deposit}-index-${index}`}
                      onDelete={() => handleDeleteService(index)}
                    />
                  );
                })}
            </Space>
          </Grid>
        </Grid>
      </Grid>
    </Modal>
  );
};

export default EditingServiceInEvent;
