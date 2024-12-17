import { Grid, OutlinedInput, TextField, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
const EditConsumerInfoModal = ({
  openEditConsumerModal,
  setOpenEditConsumerModal,
}) => {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: type,
      description: msg,
    });
  };
  const queryClient = useQueryClient();

  const handleUpdateConsumerInfo = async (data) => {
    setLoading(true);
    try {
      const updatingUserInfoQuery = await devitrakApi.patch(
        `/auth/${customer.data.id}`,
        {
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          notes: [
            ...customer.data.notes,
            {
              company: user.companyData.id,
              notes: data.notes,
              date: new Date().getTime(),
            },
          ],
        }
      );
      if (updatingUserInfoQuery.data) {
        queryClient.invalidateQueries({
          queryKey: ["listOfConsumers"],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["consumersList"],
          exact: true,
        });
        let userFormatData = {
          uid: customer.data.id,
          name: updatingUserInfoQuery.data.name,
          lastName: updatingUserInfoQuery.data.lastName,
          email: updatingUserInfoQuery.data.email,
          phoneNumber: updatingUserInfoQuery.data.userUpdated.phoneNumber,
          data: updatingUserInfoQuery.data.userUpdated,
        };
        dispatch(onAddCustomerInfo(userFormatData));
        dispatch(onAddCustomer(userFormatData));

        openNotificationWithIcon("Success", "Consumer information updated.");
        setLoading(false);
        closeDeviceModal();
        setLoading(false);
      }
    } catch (error) {
      return setLoading(false);
    }
  };

  const closeDeviceModal = () => {
    return setOpenEditConsumerModal(false);
  };
  const titleRender = () => {
    return (
      <p style={{ ...TextFontsize18LineHeight28, textAlign: "center" }}>
        Editing consumer information.
      </p>
    );
  };

  const structuringFieldsNeeded = [
    {
      title: "First name",
      feature: "firstName",
      type: "text",
      textArea: false,
      value: customer.name ?? "",
    },
    {
      title: "Last name",
      feature: "lastName",
      type: "text",
      textArea: false,
      value: customer.lastName ?? "",
    },
    {
      title: "Email",
      feature: "email",
      type: "text",
      textArea: false,
      value: customer.email ?? "",
    },
    {
      title: "Phone",
      feature: "phone",
      type: "text",
      textArea: false,
      value: customer.phoneNumber ?? "",
    },
    {
      title: "Add new Note",
      feature: "notes",
      type: "text",
      textArea: true,
      value: customer.notes ?? "",
    },
  ];
  return (
    <>
      {contextHolder}
      <Modal
        title={titleRender()}
        centered
        open={openEditConsumerModal}
        onOk={() => closeDeviceModal()}
        onCancel={() => closeDeviceModal()}
        footer={[]}
        width={800}
        maskClosable={false}
        style={{ zIndex: 30 }}
      >
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          gap={2}
          container
        >
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <p style={{ ...Subtitle, width: "100%", textAlign: "center" }}>
              Consumer information
            </p>
          </Grid>
          <form
            style={{
              ...CenteringGrid,
              margin: 0,
              flexDirection: "column",
              width: "100%",
            }}
            onSubmit={handleSubmit(handleUpdateConsumerInfo)}
          >
            {structuringFieldsNeeded.map((item) => {
              if (item.textArea) {
                return (
                  <Grid
                    style={{
                      ...CenteringGrid,
                      margin: "0.5dvh 0",
                      width: "100%",
                    }}
                    key={item.feature}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                  >
                    {" "}
                    <label style={{ width: "100%" }}>
                      <p style={Subtitle}>{item.title}</p>
                      <TextField
                        multiline
                        rows={6}
                        fullWidth
                        style={{
                          ...OutlinedInputStyle,
                          height: "auto",
                          padding: 0,
                        }}
                        {...register(`${item.feature}`, { value: item.value })}
                      />
                    </label>
                  </Grid>
                );
              } else {
                return (
                  <Grid
                    style={{
                      ...CenteringGrid,
                      margin: "0.5dvh 0",
                      width: "100%",
                    }}
                    key={item.feature}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                  >
                    <label style={{ width: "100%" }}>
                      <p style={Subtitle}>{item.title}</p>
                      <OutlinedInput
                        style={OutlinedInputStyle}
                        fullWidth
                        {...register(`${item.feature}`, { value: item.value })}
                      />
                    </label>
                  </Grid>
                );
              }
            })}
            <Button
              loading={loading}
              htmlType="submit"
              style={{
                ...BlueButton,
                ...CenteringGrid,
                width: "100%",
                margin: "1.5rem 0 0",
              }}
            >
              <Typography textTransform={"none"} style={BlueButtonText}>
                Update consumer information
              </Typography>
            </Button>
            <Button
              onClick={() => closeDeviceModal()}
              htmlType="reset"
              style={{
                ...GrayButton,
                ...CenteringGrid,
                width: "100%",
                margin: "0.5rem 0 0",
              }}
            >
              <Typography textTransform={"none"} style={GrayButtonText}>
                Cancel{" "}
              </Typography>
            </Button>
          </form>
        </Grid>
      </Modal>
    </>
  );
};

export default EditConsumerInfoModal;
