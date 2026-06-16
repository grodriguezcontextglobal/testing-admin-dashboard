import { Grid } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Divider, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import ModalUX from "../../../components/UX/modal/ModalUX";
import ReusableTextArea from "../../../components/UX/inputs/TextArea";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";

const fieldLabelStyle = {
  display: "block",
  fontFamily: "Inter",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  color: "var(--gray-700, #344054)",
  marginBottom: "6px",
};

const sectionLabelStyle = {
  fontFamily: "Inter",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--gray-500, #667085)",
};

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
  const queryClient = useQueryClient();

  const openNotificationWithIcon = (type, msg) => {
    api.open({ message: type, description: msg });
  };

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
        queryClient.invalidateQueries({ queryKey: ["listOfConsumers"], exact: true });
        queryClient.invalidateQueries({ queryKey: ["consumersList"], exact: true });
        const userFormatData = {
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
      }
    } catch {
      setLoading(false);
    }
  };

  const closeDeviceModal = () => setOpenEditConsumerModal(false);

  const titleRender = () => (
    <p style={{ ...TextFontsize18LineHeight28, textAlign: "left" }}>
      Edit consumer
    </p>
  );

  const bodyModal = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Profile snapshot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "var(--gray-50, #F9FAFB)",
          border: "1px solid var(--gray-200, #EAECF0)",
        }}
      >
        <Avatar
          size={48}
          src={customer?.data?.profile_picture}
          style={{ flexShrink: 0 }}
        >
          {!customer?.data?.profile_picture &&
            `${customer?.name?.charAt(0) ?? ""}${customer?.lastName?.charAt(0) ?? ""}`}
        </Avatar>
        <div>
          <p
            style={{
              fontFamily: "Inter",
              fontSize: "15px",
              fontWeight: 600,
              lineHeight: "22px",
              color: "var(--gray-900, #101828)",
              margin: 0,
              textTransform: "capitalize",
            }}
          >
            {customer?.name} {customer?.lastName}
          </p>
          <p style={{ ...Subtitle, margin: 0 }}>{customer?.email}</p>
        </div>
      </div>

      {/* Form */}
      <form
        style={{ display: "flex", flexDirection: "column", gap: "0" }}
        onSubmit={handleSubmit(handleUpdateConsumerInfo)}
      >
        {/* Section: Personal information */}
        <p style={sectionLabelStyle}>Personal information</p>

        <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <label style={{ display: "block" }}>
              <span style={fieldLabelStyle}>First name</span>
              <Input
                fullWidth
                {...register("firstName", { value: customer?.name ?? "" })}
              />
            </label>
          </Grid>
          <Grid item xs={12} sm={6}>
            <label style={{ display: "block" }}>
              <span style={fieldLabelStyle}>Last name</span>
              <Input
                fullWidth
                {...register("lastName", { value: customer?.lastName ?? "" })}
              />
            </label>
          </Grid>
          <Grid item xs={12} sm={6}>
            <label style={{ display: "block" }}>
              <span style={fieldLabelStyle}>Email</span>
              <Input
                fullWidth
                type="email"
                {...register("email", { value: customer?.email ?? "" })}
              />
            </label>
          </Grid>
          <Grid item xs={12} sm={6}>
            <label style={{ display: "block" }}>
              <span style={fieldLabelStyle}>Phone</span>
              <Input
                fullWidth
                type="tel"
                {...register("phoneNumber", { value: customer?.phoneNumber ?? "" })}
              />
            </label>
          </Grid>
        </Grid>

        {/* Section: Notes */}
        <Divider style={{ margin: "0 0 16px" }} />
        <p style={sectionLabelStyle}>Add a note</p>
        <p style={{ ...Subtitle, marginTop: "4px", marginBottom: "10px" }}>
          Notes are visible only to your company.
        </p>
        <ReusableTextArea
          fullWidth
          textAreaProps={{ rows: 4 }}
          {...register("notes", { value: "" })}
        />

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <GrayButtonComponent
            func={closeDeviceModal}
            buttonType="reset"
            title="Cancel"
            size="lg"
          />
          <BlueButtonComponent
            isLoading={loading}
            buttonType="submit"
            title="Save changes"
            size="lg"
          />
        </div>
      </form>
    </div>
  );

  return (
    <>
      {contextHolder}
      <ModalUX
        closable={false}
        title={titleRender()}
        openDialog={openEditConsumerModal}
        closeModal={closeDeviceModal}
        body={bodyModal()}
        width={600}
      />
    </>
  );
};

export default EditConsumerInfoModal;
