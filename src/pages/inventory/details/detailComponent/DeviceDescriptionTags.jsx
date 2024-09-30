import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { Card, Tooltip } from "antd";
import { CardStyle } from "../../../../styles/global/CardStyle";
import { TextFontSize14LineHeight20 } from "../../../../styles/global/TextFontSize14LineHeight20";
// import ReturningLeasedEquipModal from "./components/ReturningLeasedEquipModal";
import { lazy, Suspense, useState } from "react";
import Loading from "../../../../components/animation/Loading";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
const ReturningLeasedEquipModal = lazy(() =>
  import("./components/ReturningLeasedEquipModal")
);
const DeviceDescriptionTags = ({ dataFound }) => {
  const [returningModal, setReturningModal] = useState(false);
  const dic = {
    Permanent: {
      label: "Owned",
      color: "#6941c6",
    },
    Rent: {
      label: "Leased",
      color: "#ef6820",
    },
    Sale: {
      label: "For sale",
      color: "#ef6820",
    },
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Grid
        padding={"0px 0px 0px 10px"}
        display={"flex"}
        justifyContent={"flex-start"}
        textAlign={"center"}
        flexDirection={"column"}
        alignItems={"center"}
        alignSelf={"stretch"}
        item
        xs={12}
        sm={12}
        md={12}
      >
        <Card id="card-contact-person" style={CardStyle}>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            textAlign={"center"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            alignItems={"center"}
            item
            xs={12}
          >
            <div
              style={{
                display: `${
                  String(dataFound[0].ownership).toLowerCase() === "rent"
                    ? "flex"
                    : "none"
                }`,
                margin: "0 0 1dvh",
                mixBlendMode: "multiply",
                background: "var(--orange-dark-50, #FFF4ED)",
                padding: "2px 8px",
                borderRadius: "16px",
              }}
            >
              <Tooltip
                title={`${
                  dataFound[0]?.warehouse < 1 ||
                  dataFound[0]?.warehouse === false
                    ? "This item is being used in an event."
                    : "Click to return leased equipment and adding returning infomration."
                }`}
              >
                <button
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    width: "100%",
                  }}
                  disabled={
                    dataFound[0]?.warehouse < 1 ||
                    dataFound[0]?.warehouse === false
                  }
                  onClick={() => setReturningModal(true)}
                >
                  <Typography
                    style={{
                      ...TextFontSize14LineHeight20,
                      display: `${
                        String(dataFound[0].ownership).toLowerCase() ===
                          "rent" && "flex"
                      }`,
                      fontSize: "12px",
                      lineHeight: "18px",
                      textTransform: "capitalize",
                      textAlign: "center",
                      fontWeight: 500,
                      color: "var(--orange-700, #B93815)",
                      padding: "2px 8px",
                    }}
                  >
                    {dataFound[0]?.enabledAssignFeature > 0 ||
                    !dataFound[0]?.enabledAssignFeature
                      ? "Returning date"
                      : "Returned equipment date"}
                    <br />{" "}
                    {dataFound[0]?.return_date
                      ?.split(" ")
                      .slice(0, 5)
                      .toString()
                      .replaceAll(",", " ")}
                  </Typography>
                </button>
              </Tooltip>
            </div>
            <span
              style={{
                borderRadius: "16px",
                justifyContent: "center",
                display: "flex",
                padding: "2px 8px",
                alignItems: "center",
                mixBlendMode: "multiply",
                background: `${
                  dataFound[0]?.warehouse === 0
                    ? "var(--orange-dark-50, #FFF4ED)"
                    : "var(--success-50, #ECFDF3)"
                }`,
                width: "fit-content",
                marginBottom: "5px",
              }}
            >
              <Typography
                style={{
                  ...TextFontSize14LineHeight20,
                  fontSize: "12px",
                  lineHeight: "18px",
                  textTransform: "capitalize",
                  textAlign: "center",
                  fontWeight: 500,
                  color: `${
                    dataFound[0]?.warehouse === 0
                      ? "var(--orange-700, #B93815)"
                      : "var(--success-700, #027A48)"
                  }`,
                }}
              >
                <Icon
                  icon="tabler:point-filled"
                  rotate={3}
                  color={`${
                    dataFound[0]?.warehouse === 0 ? "#EF6820" : "#12B76A"
                  }`}
                />
                {dataFound[0]?.warehouse === 0 ? "In Use" : "In Stock"}
              </Typography>
            </span>
            <br />
            <span
              style={{
                borderRadius: "16px",
                justifyContent: "center",
                display: "flex",
                padding: "2px 8px",
                alignItems: "center",
                mixBlendMode: "multiply",
                background: `${
                  dataFound[0]?.warehouse === 0
                    ? "var(--Primary-50, #F9F5FF)"
                    : "#FFF4ED"
                }`,
                width: "fit-content",
                marginBottom: "5px",
              }}
            >
              <Typography
                color={`${dic[dataFound[0]?.ownership]?.color}`}
                fontSize={"12px"}
                fontFamily={"Inter"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"18px"}
                textAlign={"center"}
                textTransform={"capitalize"}
              >
                <Icon
                  icon="tabler:point-filled"
                  rotate={3}
                  color={`${dic[dataFound[0]?.ownership]?.color}`}
                />
                {dic[dataFound[0]?.ownership]?.label}
              </Typography>
            </span>
          </Grid>
        </Card>
      </Grid>
      {returningModal &&
        (dataFound[0].enabledAssignFeature > 0 ||
          !dataFound[0].enabledAssignFeature) && (
          <ReturningLeasedEquipModal
            dataFound={dataFound}
            openReturningModal={returningModal}
            setOpenReturningModal={setReturningModal}
          />
        )}
    </Suspense>
  );
};

export default DeviceDescriptionTags;
