import { Box, Typography } from "@mui/material";
import { Divider } from "antd";
import { useState } from "react";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../../../../../components/UX/buttons/LigthBlueButton";
import ModalUX from "../../../../../../../components/UX/modal/ModalUX";
import MultipleDevices from "./auth_transaction_options/MultipleDevices";
import SingleDevice from "./auth_transaction_options/SingleDevice";

const AuthorizedTransaction = ({
  createTransactionPaid,
  setCreateTransactionPaid,
}) => {
  const [optionToRender, setOptionToRender] = useState(0);

  function closeModal() {
    setCreateTransactionPaid(false);
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
        New transaction with authorized deposit for devices
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
        Please scan device for an authorized transaction:
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
        <SingleDevice setCreateTransactionPaid={setCreateTransactionPaid} />
      ) : (
        <MultipleDevices
          setCreateTransactionPaid={setCreateTransactionPaid}
        />
      )}
    </div>
  );

  return (
    <ModalUX
      title={renderTitle()}
      openDialog={createTransactionPaid}
      closeModal={closeModal}
      body={modalBody}
      width={1000}
      footer={[]}
      modalStyles={{ top: "5dvh", zIndex: 30 }}
    />
  );
};

export default AuthorizedTransaction;
