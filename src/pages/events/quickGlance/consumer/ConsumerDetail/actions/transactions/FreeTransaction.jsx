import { Box, Typography } from "@mui/material";
import { Divider, Modal } from "antd";
import { useState } from "react";
import TextFontsize18LineHeight28 from "../../../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../../../../../components/UX/buttons/LigthBlueButton";
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
  return (
    <Modal
      title={renderTitle()}
      open={createTransactionForNoRegularUser}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      centered
      footer={[]}
      width={1000}
      maskClosable={false}
      style={{
        top:"5dvh",
        zIndex:30
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
                textDecoration: "underline"
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
                textDecoration: "underline"
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
    </Modal>
  );
};

export default FreeTransaction;
