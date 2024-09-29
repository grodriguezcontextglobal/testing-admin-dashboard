import { Icon } from "@iconify/react";
import {
  Chip,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Divider, Modal, notification, Space, Button, Tooltip } from "antd";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { QuestionIcon } from "../../../../../components/icons/QuestionIcon";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import "../../../../../styles/global/reactInput.css";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import "../../../../events/newEventProcess/style/NewEventInfoSetup.css";

const ReturningLeasedEquipModal = ({
  dataFound,
  openReturningModal,
  setOpenReturningModal,
}) => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [begin, setBegin] = useState(new Date());
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(false);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const { handleSubmit } = useForm();
  const { user } = useSelector((state) => state.admin);
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (msg) => {
    api.open({
      message: msg,
    });
  };
  const closeModal = () => {
    return setOpenReturningModal(false);
  };

  const emailNotificationAdmins = async () => {
    const response = await devitrakApi.post(
      "/nodemailer/leased-equip-staff-notification",
      {
        subject: "Leased device returned in company records.",
        message: `The device with serial number ${
          dataFound[0].serial_number
        } was returned for staff member ${user.name} ${
          user.lastName
        } at Date ${new Date().toString()} to original renter company.`,
        company: user.companyData.company_name,
        staff: [
          ...user.companyData.employees
            .filter((element) => Number(element.role) < 2)
            .map((ele) => ele.user),
        ],
        contactInfo: {
          staff: `${user.name} ${user.lastName}`,
          email: user.email,
        },
      }
    );
    if (response.data) {
      return openNotification("Item is returned to the company.");
    }
  };

  const handleReturningLeasedEquip = async (data) => {
    setLoadingStatus(true);
    try {
      console.log(data);
      const response = await devitrakApi.post(
        "/db_company/returning-leased-equipment",
        {
          item_id: dataFound[0].item_id,
          return_date: begin.toString(),
          enableAssignFeature: 0,
          returnedRentedInfo: JSON.stringify(moreInfo),
        }
      );
      setLoadingStatus(false);
      if (response.data.ok) {
        await emailNotificationAdmins();
        setLoadingStatus(false);
        openNotification("Item is returned to the company.");
        return closeModal();
      }
    } catch (error) {
      setLoadingStatus(false);
      throw Error(error);
    }
  };

  const handleAddingMoreInfo = () => {
    setMoreInfo([...moreInfo, { keyObject, valueObject }]);
    setKeyObject("");
    setValueObject("");
    return;
  };
  const renderMoreInfoProps = (props) => {
    return <p style={{ ...LightBlueButtonText, ...CenteringGrid }}>{props}</p>;
  };
  const renderTitle = () => {
    return (
      <>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            style={TextFontSize30LineHeight38}
            color={"var(--gray-600, #475467)"}
          >
            Return leased equipment
          </Typography>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            textTransform={"none"}
            style={TextFontSize20LineHeight30}
            color={"var(--gray-600, #475467)"}
          >
            You can enter all the details related to returning the leased
            equipment.
          </Typography>
        </InputLabel>
      </>
    );
  };

  const handleRemovingMoreInfo = (index) => {
    const filter = moreInfo.filter((element, i) => i !== index);
    return setMoreInfo(filter);
  };
  return (
    <Modal
      key={dataFound[0].item_id}
      open={openReturningModal}
      onCancel={() => closeModal()}
      style={{ top: "20dv" }}
      width={1000}
      centered
      footer={[]}
    >
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        container
      >
        {contextHolder}
        {renderTitle()}
        <form
          key={dataFound[0].item_id}
          id="handleReturningLeasedEquip"
          style={{
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            display: "flex",
            padding: "24px",
            flexDirection: "column",
            gap: "24px",
            alignSelf: "stretch",
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--gray-100, #F2F4F7)",
          }}
          className="form"
          onSubmit={handleSubmit(handleReturningLeasedEquip)}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "6px", width: "100%" }}>
                <Tooltip title="Date when the item was returned.">
                  <Typography
                    textTransform={"none"}
                    style={{ ...Subtitle, fontWeight: 500 }}
                    color={"var(--gray-700, #344054)"}
                  >
                    Return date&nbsp;
                    <QuestionIcon />
                  </Typography>
                </Tooltip>
              </InputLabel>
              <DatePicker
                id="calender-event"
                autoComplete="checking"
                showTimeSelect
                dateFormat="Pp"
                selected={begin}
                onChange={(date) => setBegin(date)}
                placeholderText="Event start date"
                startDate={new Date()}
                style={{
                  ...OutlinedInputStyle,
                  margin: "0.1rem 0 1.5rem",
                  width: "100%",
                }}
              />
            </div>
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <Tooltip title="Add useful information such as courier company or tracking number or more.">
                <InputLabel
                  style={{
                    marginBottom: "6px",
                    width: "100%",
                    background: "transparent",
                    color: "transparent",
                  }}
                >
                  <Typography
                    textTransform={"none"}
                    style={{ ...Subtitle, fontWeight: 500 }}
                    color={"var(--gray-700, #344054)"}
                  >
                    Add more information&nbsp;
                    <QuestionIcon />
                  </Typography>
                </InputLabel>
              </Tooltip>
              <button
                style={{ ...BlueButton, width: "100%" }}
                type="button"
                onClick={() => setMoreInfoDisplay(true)}
              >
                <WhiteCirclePlusIcon />
                <Typography style={BlueButtonText}>
                  &nbsp;Add more information
                </Typography>
              </button>
            </div>
          </div>
          {moreInfoDisplay && (
            <>
              <Divider />
              <div
                style={{
                  width: "100%",
                  ...CenteringGrid,
                  justifyContent: "space-between",
                  gap: "5px",
                }}
              >
                <OutlinedInput
                  style={{ ...OutlinedInputStyle, width: "100%" }}
                  placeholder="e.g Courier company or tracking number"
                  name="key"
                  value={keyObject}
                  onChange={(e) => setKeyObject(e.target.value)}
                />
                <OutlinedInput
                  style={{ ...OutlinedInputStyle, width: "100%" }}
                  placeholder="e.g Fedex or UPS"
                  name="key"
                  value={valueObject}
                  onChange={(e) => setValueObject(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleAddingMoreInfo()}
                  style={{ ...BlueButton, ...CenteringGrid }}
                >
                  <Icon
                    icon="ic:baseline-plus"
                    color="var(--base-white, #FFF)"
                    width={20}
                    height={20}
                  />{" "}
                </button>
              </div>
            </>
          )}
          <Divider style={{ margin: "0.5rem 0" }} />
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              margin: "-5px 0 0",
            }}
          >
            <Space size={[8, 16]} wrap>
              {moreInfo.length > 0 &&
                moreInfo.map((item, index) => (
                  <Chip
                    key={`${item.keyObject}-${item.valueObject}`}
                    label={renderMoreInfoProps(
                      `${item.keyObject}:${item.valueObject}`
                    )}
                    style={{ ...LightBlueButton, ...CenteringGrid }}
                    variant="outlined"
                    onDelete={() => handleRemovingMoreInfo(index)}
                  />
                ))}
            </Space>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <Button
                onClick={() => closeModal()}
                disabled={loadingStatus}
                style={{
                  ...GrayButton,
                  ...CenteringGrid,
                  width: "100%",
                }}
              >
                <Icon
                  icon="ri:arrow-go-back-line"
                  color="#344054"
                  width={20}
                  height={20}
                />
                &nbsp;
                <Typography
                  textTransform={"none"}
                  style={{
                    ...GrayButtonText,
                  }}
                >
                  Go back
                </Typography>
              </Button>
            </div>
            <div
              style={{
                textAlign: "right",
                width: "50%",
              }}
            >
              <Button
                disabled={loadingStatus}
                htmlType="submit"
                style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
                // style={{
                //   width: "100%",
                //   border: `1px solid ${
                //     loadingStatus
                //       ? "var(--disabled-blue-button)"
                //       : "var(--blue-dark-600)"
                //   }`,
                //   borderRadius: "8px",
                //   background: `${
                //     loadingStatus
                //       ? "var(--disabled-blue-button)"
                //       : "var(--blue-dark-600)"
                //   }`,
                //   boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                // }}
              >
                <Typography textTransform={"none"} style={BlueButtonText}>
                  Return item
                </Typography>
              </Button>
            </div>
          </div>
        </form>
      </Grid>
    </Modal>
  );
};

export default ReturningLeasedEquipModal;
