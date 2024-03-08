import { Grid, Typography } from "@mui/material";
import { Button, Card } from "antd";
import { useSelector } from "react-redux";
import { useRef, useState } from 'react';
import { QRCode } from "react-qrcode-logo";
import DevitrakLogoWhiteBg from '../../../../assets/qrcode-maskable_icon_x48.png';
import { DownloadIcon } from "../../../../components/icons/Icons";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
const QRCodeDisplay = () => {
    const { qrCodeLink } = useSelector((state) => state.event);
    const [valueQRCode] = useState(qrCodeLink);
    const downloadQRCode = () => {
        const canvas = document.getElementById("myqrcode")?.querySelector("canvas");
        const pngUrl = canvas
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${qrCodeLink}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const renderTitle = () => {
        return (
            <Typography
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-600, #475467)"}
            >
                Event QR code
            </Typography>
        );
    };
    return (
        <Grid style={{ padding: "0px 0px 10px 10px" }} item xs={12}>
            <Card
                title={renderTitle()}
                id="card-contact-person"
                style={{
                    borderRadius: "12px",
                    border: "1px solid var(--gray-200, #EAECF0)",
                    background: "var(--base-white, #FFF)",
                    boxShadow:
                        "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
                }}
                headStyle={{
                    borderBottom: "none",
                }}
                bodyStyle={{
                    padding: "0px 24px",
                }}
                actions={[
                    <Grid
                        key={"button-view-report-event-quick-glance"}
                        item
                        xs={12}
                        display={"flex"}
                        justifyContent={"center"}
                        alignItems={"center"}
                        textAlign={"center"}
                    >
                        <Button
                            style={{
                                width: "fit-content",
                                // borderRadius: "8px",
                                border: "transparent",
                                outline: "transparent",
                                background: "none",
                                marginRight: "16px",
                            }}
                        >
                            <Typography
                                textTransform={"none"}
                                key={"download-icon"}
                                style={{ width: "fit-content" }}
                                onClick={downloadQRCode}
                                color="var(--blue-dark-700, #004EEB)"
                                /* Text sm/Semibold */
                                fontFamily="Inter"
                                fontSize="14px"
                                fontStyle="normal"
                                fontWeight="600"
                                lineHeight="20px"
                            >
                                <DownloadIcon />
                                &nbsp;Download as PNG
                            </Typography>
                        </Button>
                    </Grid>,
                ]}
            >
                <Grid
                    display={"flex"}
                    justifyContent={"left"}
                    alignItems={"center"}
                    textAlign={"left"}
                    item
                    xs={12}
                >
                    <div
                        id="myqrcode"
                        style={{
                            height: "auto",
                            margin: "0 auto 0.3rem",
                            maxWidth: "fit-content",
                            width: "100%",
                            border: "5px solid var(--baseblack)",
                            borderRadius: "12px",
                            padding: "-5px",
                        }}
                    >
                        <QRCode
                            value={valueQRCode}
                            ecLevel="Q"
                            qrStyle="squares"
                            size={120}
                            quietZone={10}
                            bgColor="#fff"
                            fgColor="#000"
                            logoImage={DevitrakLogoWhiteBg}
                            logoHeight={30}
                            logoWidth={30}
                            logoPadding={1}
                        />
                        <div style={{
                            height: "auto",
                            margin: "0 auto",
                            width: "100%",
                            backgroundColor: "var(--baseblack)"
                        }}>
                            <Typography style={{ ...CenteringGrid, padding: "3px 0", textTransform: "uppercase", color: "var(--basewhite)", fontSize: "20px", fontWeight: 500, fontFamily: "Inter" }}>scan me</Typography>
                        </div>
                    </div>
                </Grid>
            </Card>
        </Grid>
    );
};

export default QRCodeDisplay;
