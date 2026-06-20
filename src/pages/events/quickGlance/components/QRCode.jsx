import { Grid, Typography } from "@mui/material";
import { Button, Card, message } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { QRCode } from "../../../../components/shared-assets/qr-code";
import { DownloadIcon } from "../../../../components/icons/DownloadIcon";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../styles/global/Subtitle";

const DEVITRAK_LOGO =
  "https://res.cloudinary.com/dpdzkhh07/image/upload/v1729629315/maskable_icon_white_background_t80s7n.png";

const QRCodeDisplay = () => {
  const { qrCodeLink } = useSelector((state) => state.event);
  const [valueQRCode] = useState(String(qrCodeLink));

  const downloadQRCode = () => {
    const svgElement = document.getElementById("myqrcode")?.querySelector("svg");
    if (!svgElement) {
      message.error("QR code SVG not found.");
      return;
    }
    try {
      const svgClone = svgElement.cloneNode(true);
      const svgNamespace = "http://www.w3.org/2000/svg";
      const frame = document.createElementNS(svgNamespace, "rect");
      frame.setAttribute("x", "0");
      frame.setAttribute("y", "0");
      frame.setAttribute("width", svgElement.getBoundingClientRect().width);
      frame.setAttribute("height", svgElement.getBoundingClientRect().height);
      frame.setAttribute("fill", "none");
      frame.setAttribute("stroke", "black");
      frame.setAttribute("stroke-width", "5");
      svgClone.insertBefore(frame, svgClone.firstChild);
      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgUrl = URL.createObjectURL(
        new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
      );
      const link = document.createElement("a");
      link.href = svgUrl;
      link.download = `${qrCodeLink}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(svgUrl);
    } catch (error) {
      message.error(`Error generating QR code: ${error.message}`);
    }
  };

  return (
    <Grid style={{ padding: "0px 0px 10px 10px" }} item xs={12}>
      <Card
        title={
          <Typography style={{ ...Subtitle, fontWeight: 500 }}>
            Event QR code
          </Typography>
        }
        id="card-contact-person"
        style={{
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #EAECF0)",
          background: "var(--base-white, #FFF)",
          boxShadow:
            "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
        }}
        styles={{
          header: { borderBottom: "none" },
          body: { padding: "0px 24px" },
        }}
        actions={[
          <Grid
            key="download-qr"
            item
            xs={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
            textAlign="center"
          >
            <Button
              style={{
                width: "fit-content",
                border: "transparent",
                outline: "transparent",
                background: "none",
                marginRight: "16px",
              }}
              onClick={downloadQRCode}
            >
              <Typography
                textTransform="none"
                style={{ width: "fit-content" }}
                color="var(--blue-dark-700, #004EEB)"
                fontFamily="Inter"
                fontSize="14px"
                fontStyle="normal"
                fontWeight="600"
                lineHeight="20px"
              >
                <DownloadIcon />
                &nbsp;Download as SVG
              </Typography>
            </Button>
          </Grid>,
        ]}
      >
        <Grid
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          textAlign="center"
          item
          xs={12}
        >
          <div
            id="myqrcode"
            style={{
              height: "auto",
              margin: "0 auto",
              maxWidth: "fit-content",
              width: "100%",
              border: "1.5px solid var(--gray-200, #EAECF0)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <QRCode
              size="lg"
              value={valueQRCode}
              options={{
                image: DEVITRAK_LOGO,
                imageOptions: { imageSize: 0.4, margin: 2 },
                dotsOptions: { color: "#000000" },
                cornersSquareOptions: { color: "#000000" },
                cornersDotOptions: { color: "#000000" },
              }}
            />
          </div>
          <Typography
            style={{
              ...CenteringGrid,
              marginTop: "8px",
              color: "var(--gray-500, #667085)",
              fontSize: "12px",
              fontWeight: 400,
              fontFamily: "Inter",
              gap: "4px",
            }}
          >
            Scan to register
          </Typography>
        </Grid>
      </Card>
    </Grid>
  );
};

export default QRCodeDisplay;
