import { Box, Button } from "@mui/material";
import { Divider, Modal, Typography } from "antd";
import { useState } from "react";
import { BlueButton } from "../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../styles/global/BlueButtonText";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import MultipleDevices from "./cash_transaction_options/MultipleDevices";
import SingleDevice from "./cash_transaction_options/SingleDevice";

const CashTransaction = ({ openCashTransaction, setOpenCashTransaction }) => {
    const [optionToRender, setOptionToRender] = useState(0)
    const closeModal = () => {
        setOpenCashTransaction(false)
    }
    const renderTitle = () => {
        return (
            <Typography
                textTransform={"none"}
                marginY={2}
                style={{ ...TextFontSize30LineHeight38, textWrap: "balance" }}
            >
                New transaction with deposit in cash
            </Typography>
        );
    };
    return (
        <Modal
            title={renderTitle()}
            open={openCashTransaction}
            onOk={() => closeModal()}
            onCancel={() => closeModal()}
            centered
            footer={[]}
            width={1000}
            maskClosable={false}
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
                <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "5px" }}>
                    <Button style={{ ...BlueButton, width: "100%" }} onClick={() => setOptionToRender(0)}><Typography style={{ ...BlueButtonText, textDecoration: `${optionToRender === 0 ? "underline" : "none"}`, textTransform: `${optionToRender === 0 ? "uppercase" : "none"}` }}>single device</Typography></Button>
                    <Button style={{ ...BlueButton, width: "100%" }} onClick={() => setOptionToRender(1)}><Typography style={{ ...BlueButtonText, textDecoration: `${optionToRender === 1 ? "underline" : "none"}`, textTransform: `${optionToRender === 1 ? "uppercase" : "none"}` }}>multiple device</Typography></Button>
                </Box>
                <Divider />
                <Typography>{
                    optionToRender === 0 ? "Single device" : "Multiple devices"
                }
                </Typography>
                {
                    optionToRender === 0 ?
                        <SingleDevice setCreateTransactionForNoRegularUser={setOpenCashTransaction} /> :
                        <MultipleDevices setCreateTransactionForNoRegularUser={setOpenCashTransaction} />
                }
            </div>
        </Modal>
    );
};


export default CashTransaction