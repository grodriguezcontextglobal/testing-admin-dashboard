import { Box, Typography } from "@mui/material";
import { Divider } from "antd";
import { useState } from "react";
import TextFontsize18LineHeight28 from "../../../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../../../../../components/UX/buttons/LigthBlueButton";
import ModalUX from "../../../../../../../components/UX/modal/ModalUX";
import Multiple from "./free_transaction_options/Multiple";
import SingleFreeTransaction from "./free_transaction_options/Single";

const FreeTransaction = ({
  createTransactionForNoRegularUser,
  setCreateTransactionForNoRegularUser,
}) => {
  const [optionToRender, setOptionToRender] = useState(0);
  const closeModal = () => {
    setCreateTransactionForNoRegularUser(false);
  };

  const handleOptionChange = (option) => {
    setOptionToRender(option);
  };

  const renderTitle = () => {
    return (
      <Typography
        textTransform={"none"}
        marginY={2}
        style={{ ...TextFontSize30LineHeight38, textWrap: "balance" }}
      >
        New transaction for free device
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
        marginY={2}
        style={{
          ...TextFontsize18LineHeight28,
          width: "80%",
        }}
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
        <SingleFreeTransaction
          setCreateTransactionForNoRegularUser={
            setCreateTransactionForNoRegularUser
          }
        />
      ) : (
        <Multiple
          setCreateTransactionForNoRegularUser={
            setCreateTransactionForNoRegularUser
          }
        />
      )}
    </div>
  );

  return (
    <ModalUX
      title={renderTitle()}
      openDialog={createTransactionForNoRegularUser}
      closeModal={closeModal}
      body={modalBody}
      width={1000}
      footer={[]}
      modalStyles={{ top: "5dvh", zIndex: 30 }}
    />
  );
};

export default FreeTransaction;
