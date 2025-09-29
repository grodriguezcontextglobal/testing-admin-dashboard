import { Grid, InputLabel } from "@mui/material";
import { Table } from "antd";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";

const Event = () => {
  const { eventInfoDetail, contactInfo } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "America/New_York", // Eastern Standard Time (EST)
  };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const address = eventInfoDetail?.address?.split(" ");
  const styleTitle = {
    textTransform: "none",
    textAlign: "left",
    fontFamily: "Inter",
    fontSize: "20px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "30px",
    color: "var(--gray-600, #475467)",
    alignSelf: "stretch",
  };

  const inputValueStyle = {
    textTransform: "none",
    textAlign: "left",
    fontFamily: "Inter",
    fontSize: "16px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "24px",
    color: "var(--gray-600, #475467)",
  };

  const downloadDocument = async (id) => {
    try {
      const { data } = await devitrakApi.get(
        `/document/download/${id}/${user.uid}`
      );
      window.open(data.downloadUrl, "_blank");
      if (!data?.ok || !data?.downloadUrl) {
        throw new Error("Invalid or missing download URL");
      }
      return null;
    } catch (error) {
      throw new Error(error);
    }
  };

  const columns = [
    {
      dataIndex: "title",
      key: "title",
      title: "Document name",
    },
    {
      dataIndex: "action",
      key: "action",
      title: "Action",
      render: (_, record) => (
        // console.log(record),
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <BlueButtonComponent
          title={`Document`}
          func={() => downloadDocument(record.id)}
          loadingState={false}
          />{" "}
        </div>
      ),
    },
  ];
  let data = eventInfoDetail.legal_documents_list;

  return (
    <Grid
      display={"flex"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      container
    >
      <Grid
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"center"}
        alignItems={"center"}
        gap={2}
        item
        xs={12}
      >
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h1 style={styleTitle}>Event name</h1>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h4 style={inputValueStyle}>{eventInfoDetail.eventName}</h4>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h1 style={styleTitle}>Main point of contact</h1>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "0.2rem", width: "100%" }}
        >
          <h4 style={inputValueStyle}>
            {contactInfo.name}
            <br />
            {contactInfo.email}
            <br />
            {contactInfo.phone.map((phone) => {
              return (
                <span key={phone}>
                  {phone}
                  <br />
                </span>
              );
            })}
          </h4>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h1 style={styleTitle}>Date of the event</h1>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h4 style={inputValueStyle}>
            {" "}
            Start: {`${formatter.format(new Date(eventInfoDetail.dateBegin))}`}
            <br />
            End: {`${formatter.format(new Date(eventInfoDetail.dateEnd))}`}
          </h4>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h1 style={styleTitle}>Location of the event</h1>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h4 style={inputValueStyle}>
            {eventInfoDetail.floor}
            <br />
            {address.slice(0, -3).toString().replaceAll(",", " ")}
            <br />
            {address.at(-3)} {address.at(-2)} {address.at(-1)}
          </h4>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h1 style={styleTitle}>Will this event need a merchant service?</h1>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h4 style={inputValueStyle}>
            {eventInfoDetail.merchant ? "Yes" : "No"}
          </h4>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <h1 style={styleTitle}>Documents</h1>
        </InputLabel>

        <Table
          style={{
            width: "100%",
            border: "none",
            backgroundColor: "transparent",
          }}
          columns={columns}
          pagination={false}
          bordered={false}
          showHeader={false}
          dataSource={data}
        />
      </Grid>
    </Grid>
  );
};

export default Event;
