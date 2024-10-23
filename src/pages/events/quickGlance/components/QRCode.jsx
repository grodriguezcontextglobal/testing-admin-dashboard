import { Grid, Typography } from "@mui/material";
import { Button, Card, QRCode } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { DownloadIcon } from "../../../../components/icons/DownloadIcon";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../styles/global/Subtitle";
const QRCodeDisplay = () => {
  const { qrCodeLink } = useSelector((state) => state.event);
  const [valueQRCode] = useState(String(qrCodeLink));
  
  const downloadQRCode = () => {
    const svgElement = document.getElementById("myqrcode")?.querySelector("svg");
    if (!svgElement) {
      console.error("SVG not found!");
      return;
    }
    try {
      const svgClone = svgElement.cloneNode(true);
      const svgNamespace = "http://www.w3.org/2000/svg";

      // Create a frame similar to the one in the image
      const frame = document.createElementNS(svgNamespace, "rect");
      frame.setAttribute("x", "0");
      frame.setAttribute("y", "0");
      frame.setAttribute("width", svgElement.getBoundingClientRect().width);
      frame.setAttribute("height", svgElement.getBoundingClientRect().height);
      frame.setAttribute("fill", "none");
      frame.setAttribute("stroke", "black");
      frame.setAttribute("stroke-width", "5");
      svgClone.insertBefore(frame, svgClone.firstChild);

      // Create the "SCAN ME" text below the QR code
      const text = document.createElementNS(svgNamespace, "text");
      text.setAttribute("x", "50%");
      text.setAttribute("y", `${svgElement.getBoundingClientRect().height + 30}`);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "20");
      text.setAttribute("font-family", "Inter");
      text.setAttribute("fill", "black");
      text.textContent = "SCAN ME";
      svgClone.appendChild(text);

      // Serialize and download the SVG
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      let downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `${qrCodeLink}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    } catch (error) {
      console.error("Error generating SVG URL: ", error.message);
    }
  };

  const renderTitle = () => {
    return (
      <Typography style={{ ...Subtitle, fontWeight: 500 }}>
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
        styles={{
          header: {
            borderBottom: "none",
          },
          body: {
            padding: "0px 24px",
          },
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
                onClick={downloadQRCode} //downloadCanvasQRCode
                color="var(--blue-dark-700, #004EEB)"
                /* Text sm/Semibold */
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
              errorLevel="H"
              value={valueQRCode}
              icon={'https://res.cloudinary.com/dpdzkhh07/image/upload/v1729629315/maskable_icon_white_background_t80s7n.png'}
              // iconSize={100}
              // size={300}
              bgColor="#fff"              status="active"
              type="svg"
            />
            <div
              style={{
                height: "auto",
                margin: "0 auto",
                width: "100%",
                backgroundColor: "var(--baseblack)",
              }}
            >
              <Typography
                style={{
                  ...CenteringGrid,
                  padding: "3px 0",
                  textTransform: "uppercase",
                  color: "var(--basewhite)",
                  fontSize: "20px",
                  fontWeight: 500,
                  fontFamily: "Inter",
                }}
              >
                scan me
              </Typography>
            </div>
          </div>
        </Grid>
      </Card>
    </Grid>
  );
};

export default QRCodeDisplay;
