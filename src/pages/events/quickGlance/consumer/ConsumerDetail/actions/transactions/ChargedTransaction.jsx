import { Box, Button, Typography } from "@mui/material";
import { Divider, Modal } from "antd";
import { useState } from "react";
import SingleDevice from "./charged_transaction_options/SingleDevice";
import MultipleDevices from "./charged_transaction_options/MultipleDevices";
import { BlueButton } from "../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../styles/global/BlueButtonText";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";

const ChargedTransaction = ({
  createTransactionChargeOption,
  setCreateTransactionChargeOption,
}) => {
  const [optionToRender, setOptionToRender] = useState(0);

  function closeModal() {
    setCreateTransactionChargeOption(false);
  }

  const renderTitle = () => {
    return (
      <Typography
        textTransform={"none"}
        marginY={2}
        style={{
          ...TextFontSize30LineHeight38,
          textWrap: "balance",
        }}
      >
        New paid transaction for devices
      </Typography>
    );
  };
  return (
    <Modal
      title={renderTitle()}
      open={createTransactionChargeOption}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      maskClosable={false}
      centered
      footer={[]}
      width={1000}
      style={{
        top: "5dvh",
        zIndex: 30,
      }}
    >
      <div
        style={{
          minWidth: "fit-content",
          backgroundColor: "#ffffff",
          padding: "20px",
        }}
      >
        <Typography
          textTransform={"none"}
          color={"var(--gray-900, #101828)"}
          lineHeight={"26px"}
          textAlign={"left"}
          fontWeight={400}
          fontFamily={"Inter"}
          fontSize={"18px"}
          marginY={2}
        >
          Please scan device for free transaction:
        </Typography>
        <Divider />
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Button
            style={{ ...BlueButton, width: "100%" }}
            onClick={() => setOptionToRender(0)}
          >
            <Typography
              style={{
                ...BlueButtonText,
                textDecoration: `${
                  optionToRender === 0 ? "underline" : "none"
                }`,
                textTransform: `${optionToRender === 0 ? "uppercase" : "none"}`,
              }}
            >
              single device
            </Typography>
          </Button>
          <Button
            style={{ ...BlueButton, width: "100%" }}
            onClick={() => setOptionToRender(1)}
          >
            <Typography
              style={{
                ...BlueButtonText,
                textDecoration: `${
                  optionToRender === 1 ? "underline" : "none"
                }`,
                textTransform: `${optionToRender === 1 ? "uppercase" : "none"}`,
              }}
            >
              multiple devices
            </Typography>
          </Button>
        </Box>
        <Divider />
        <Typography>
          {optionToRender === 0 ? "Single device" : "Multiple devices"}
        </Typography>
        {optionToRender === 0 ? (
          <SingleDevice
            setCreateTransactionPaid={setCreateTransactionChargeOption}
          />
        ) : (
          <MultipleDevices
            setCreateTransactionPaid={setCreateTransactionChargeOption}
          />
        )}
      </div>
    </Modal>
  );
};

export default ChargedTransaction;
