import { Grid, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, notification, Table } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
const UpdateListOfNotesPerConsumer = ({
  openDeleteNoteModal,
  setOpenDeleteNoteModal,
  renderingNotesPerCustomer,
}) => {
  const { handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [listOfNotes, setListOfNotes] = useState([]);
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

  const closeDeviceModal = () => {
    return setOpenDeleteNoteModal(false);
  };
  const titleRender = () => {
    return (
      <p style={{ ...TextFontsize18LineHeight28, textAlign: "center" }}>
        Deleting notes
      </p>
    );
  };
  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setListOfNotes(selectedRows);
    },
  };
  const formattingData = () => {
    return renderingNotesPerCustomer().map((item) => {
      return {
        key: item.date,
        date: item.date,
        note: item.notes,
      };
    });
  };
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      align: "left",
      sorter: {
        compare: (a, b) => ("" + a.date).localeCompare(b.date),
      },
      width: "20%",
      render: (date) => {
        const dateFormatting = new Date(date).toString().split(" ");
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <p style={Subtitle}>
              {dateFormatting.slice(1, 5).toString().replaceAll(",", " ")}
            </p>
          </div>
        );
      },
    },
    {
      title: "Note",
      dataIndex: "note",
      align: "left",
      sorter: {
        compare: (a, b) => ("" + a.note).localeCompare(b.note),
      },
    },
  ];

  const handleDeleteNote = async () => {
    setLoading(true);
    try {
      let notesCopy = [...customer.data.notes];
      for (let data of listOfNotes) {
        const index = notesCopy.findIndex(
          (item) =>
            item.company === user.companyData.id && item.notes === data.note
        );
        notesCopy.splice(index, 1);
      }
      const response = await devitrakApi.patch(`/auth/${customer.data.id}`, {
        notes: notesCopy,
      });
      if (response.data) {
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
          name: response.data.name,
          lastName: response.data.lastName,
          email: response.data.email,
          phoneNumber: response.data.userUpdated.phoneNumber,
          data: response.data.userUpdated,
        };
        dispatch(onAddCustomerInfo(userFormatData));
        dispatch(onAddCustomer(userFormatData));

        openNotificationWithIcon(
          "success",
          "Selected consumer notes deleted successfully."
        );
        setLoading(false);
        closeDeviceModal();
        setLoading(false);
      }
    } catch (error) {
      openNotificationWithIcon(
        "error",
        "Something went wrong, please try later."
      );
      return setLoading(false);
    }
  };

  const bodyModal = () => {
    return (
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        gap={2}
        container
      >
        <Table
          style={{ width: "100%", cursor: "pointer" }}
          dataSource={formattingData()}
          columns={columns}
          rowClassName="editable-row"
          className="table-ant-customized"
          rowSelection={{
            ...rowSelection,
          }}
        />

        <form
          style={{
            ...CenteringGrid,
            margin: 0,
            flexDirection: "column",
            width: "100%",
          }}
          onSubmit={handleSubmit(handleDeleteNote)}
        >
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
    );
  };
  return (
    <>
      {contextHolder}
      <ModalUX title={titleRender()} openDialog={openDeleteNoteModal} closeModal={closeDeviceModal} body={bodyModal()} width={1000} />
      {/* <Modal
        title={titleRender()}
        centered
        width={1000}
        open={openDeleteNoteModal}
        onOk={() => closeDeviceModal()}
        onCancel={() => closeDeviceModal()}
        footer={[]}
        maskClosable={false}
        style={{
          zIndex: 30,
          margin: "12dvh 0 0",
        }}
      ></Modal> */}
    </>
  );
};

export default UpdateListOfNotesPerConsumer;
