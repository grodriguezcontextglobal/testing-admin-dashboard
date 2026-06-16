import { Box, Typography } from "@mui/material";
import { Divider } from "antd";
import { useState } from "react";
import SingleDevice from "./charged_transaction_options/SingleDevice";
import MultipleDevices from "./charged_transaction_options/MultipleDevices";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../../../../../components/UX/buttons/LigthBlueButton";
import ModalUX from "../../../../../../../components/UX/modal/ModalUX";

const ChargedTransaction = ({
  createTransactionChargeOption,
  setCreateTransactionChargeOption,
}) => {
  const [optionToRender, setOptionToRender] = useState(0);

  function closeModal() {
    setCreateTransactionChargeOption(false);
  }

  const handleOptionChange = (option) => {
    setOptionToRender(option);
  };

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

  const modalBody = (
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
        Please scan device for charged transaction:
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
        {optionToRender === 0 ? (
          <BlueButtonComponent
            title="Single Device"
            func={() => handleOptionChange(0)}
            styles={{
              width: "100%",
              textTransform: "uppercase",
              textDecoration: "underline",
            }}
          />
        ) : (
          <LightBlueButtonComponent
            title="Single Device"
            func={() => handleOptionChange(0)}
            styles={{ width: "100%" }}
          />
        )}

        {optionToRender === 1 ? (
          <BlueButtonComponent
            title="Multiple Devices"
            func={() => handleOptionChange(1)}
            styles={{
              width: "100%",
              textTransform: "uppercase",
              textDecoration: "underline",
            }}
          />
        ) : (
          <LightBlueButtonComponent
            title="Multiple Devices"
            func={() => handleOptionChange(1)}
            styles={{ width: "100%" }}
          />
        )}
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
  );

  return (
    <ModalUX
      title={renderTitle()}
      openDialog={createTransactionChargeOption}
      closeModal={closeModal}
      body={modalBody}
      width={1000}
      footer={[]}
      modalStyles={{ top: "5dvh", zIndex: 30 }}
    />
  );
};

export default ChargedTransaction;
