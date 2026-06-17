import { useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ReusableTextArea from "../../../components/UX/inputs/TextArea";
import ModalUX from "../../../components/UX/modal/ModalUX";
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

const AddNoteModal = ({ openAddNoteModal, setOpenAddNoteModal }) => {
  const [loading, setLoading] = useState(false);
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

  const openNotificationWithIcon = (type, msg) => {
    api.open({ message: type, description: msg });
  };

  const [notes, setNotes] = useState(null);
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!notes?.trim()) return;
    setLoading(true);
    try {
      const response = await devitrakApi.patch(`/auth/${customer.uid}`, {
        notes: [
          ...customer.data.notes,
          {
            company: user.companyData.id,
            notes: notes,
            date: new Date().getTime(),
          },
        ],
      });
      if (response.data) {
        queryClient.invalidateQueries({ queryKey: ["listOfConsumers"], exact: true });
        queryClient.invalidateQueries({ queryKey: ["consumersList"], exact: true });
        const userFormatData = {
          uid: customer.data.id,
          name: response.data.name,
          lastName: response.data.lastName,
          email: response.data.email,
          phoneNumber: response.data.userUpdated.phoneNumber,
          data: response.data.userUpdated,
        };
        dispatch(onAddCustomerInfo(userFormatData));
        dispatch(onAddCustomer(userFormatData));
        openNotificationWithIcon("Success", "Note added successfully.");
        setLoading(false);
        setNotes(null);
        closeModal();
      }
    } catch {
      openNotificationWithIcon("Error", "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const closeModal = () => setOpenAddNoteModal(false);

  const titleRender = () => (
    <p style={{ ...TextFontsize18LineHeight28, textAlign: "left" }}>
      Add note
    </p>
  );

  const bodyModal = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ ...Subtitle, margin: 0 }}>
        Notes are visible only to your company.
      </p>
      <form
        style={{ display: "flex", flexDirection: "column", gap: "0" }}
        onSubmit={handleAddNote}
      >
        <label style={{ display: "block" }}>
          <span style={fieldLabelStyle}>Note</span>
          <ReusableTextArea
            fullWidth
            placeholder="Write your note here…"
            textAreaProps={{ rows: 5 }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <GrayButtonComponent
            func={closeModal}
            buttonType="reset"
            title="Cancel"
            size="lg"
          />
          <BlueButtonComponent
            isLoading={loading}
            buttonType="submit"
            title="Add note"
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
        title={titleRender()}
        openDialog={openAddNoteModal}
        closeModal={closeModal}
        body={bodyModal()}
        width={480}
      />
    </>
  );
};

export default AddNoteModal;
