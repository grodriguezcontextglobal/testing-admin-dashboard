import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { Card, Tooltip } from "antd";
import { CardStyle } from "../../../../styles/global/CardStyle";
import { TextFontSize14LineHeight20 } from "../../../../styles/global/TextFontSize14LineHeight20";
// import ReturningLeasedEquipModal from "./components/ReturningLeasedEquipModal";
import { lazy, Suspense, useEffect, useState } from "react";
import Loading from "../../../../components/animation/Loading";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { checkArray } from "../../../../components/utils/checkArray";
const ReturningLeasedEquipModal = lazy(() =>
  import("./components/ReturningLeasedEquipModal")
);
const DeviceDescriptionTags = ({ dataFound }) => {
  const [returningModal, setReturningModal] = useState(false);
  const [dataPropsCopy, setDataPropsCopy] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    if (dataFound) {
      const dataObject = checkArray(dataFound);
      setDataPropsCopy(dataObject);
    }
    return () => {
      controller.abort();
    };
  }, [dataFound]);
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
  const styling = {
    borderRadius: "16px",
    justifyContent: "center",
    display: "flex",
    padding: "2px 8px",
    alignItems: "center",
    mixBlendMode: "multiply",
    width: "fit-content",
    marginBottom: "5px",
  };
  const textStyling = {
    ...TextFontSize14LineHeight20,
    fontSize: "12px",
    lineHeight: "18px",
    textTransform: "capitalize",
    textAlign: "center",
    fontWeight: 500,
    padding: "2px 8px",
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Card
        id={`card-contact-person_${dataPropsCopy?.item_id}`}
        style={{ ...CardStyle, width: "100%", padding: 0 }}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          textAlign={"center"}
          flexDirection={"column"}
          alignSelf={"stretch"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <div
            style={{
              display: `${
                String(dataPropsCopy?.ownership).toLowerCase() === "rent"
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
                dataPropsCopy?.warehouse < 1 ||
                dataPropsCopy?.warehouse === false
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
                  dataPropsCopy?.warehouse < 1 ||
                  dataPropsCopy?.warehouse === false
                }
                onClick={() => setReturningModal(true)}
              >
                <Typography
                  style={{
                    ...textStyling,
                    display: `${
                      String(dataPropsCopy?.ownership).toLowerCase() ===
                        "rent" && "flex"
                    }`,
                    color: "var(--orange-700, #B93815)",
                  }}
                >
                  {dataPropsCopy?.enableAssignFeature === 1
                    ? // || !dataPropsCopy?.enableAssignFeature
                      "Returning date"
                    : "Returned equipment date"}
                  <br />{" "}
                  {new Date(dataPropsCopy?.return_date).toLocaleString()}
                  {/* {dataPropsCopy?.return_date
                    ?.split(" ")
                    .slice(0, 5)
                    .toString()
                    .replaceAll(",", " ")} */}
                </Typography>
              </button>
            </Tooltip>
          </div>
          <span
            style={{
              ...styling,
              background: `${
                dataPropsCopy?.warehouse === 0
                  ? "var(--orange-dark-50, #FFF4ED)"
                  : "var(--success-50, #ECFDF3)"
              }`,
            }}
          >
            <Typography
              style={{
                ...textStyling,
                color: `${
                  dataPropsCopy?.warehouse === 0
                    ? "var(--orange-700, #B93815)"
                    : "var(--success-700, #027A48)"
                }`,
                width: "100%",
                textAlign: "center",
              }}
            >
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={`${
                  dataPropsCopy?.warehouse === 0 ? "#EF6820" : "#12B76A"
                }`}
              />
              {dataPropsCopy?.warehouse === 0 ? "In Use" : "In Stock"}
            </Typography>
          </span>
          <span
            style={{
              ...styling,
              background: `${
                dataPropsCopy?.warehouse === 0
                  ? "var(--Primary-50, #F9F5FF)"
                  : "#FFF4ED"
              }`,
            }}
          >
            <Typography
              color={`${dic[dataPropsCopy?.ownership]?.color}`}
              sx={{ ...textStyling, width: "100%", textAlign: "center" }}
            >
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={`${dic[dataPropsCopy?.ownership]?.color}`}
              />
              {dic[dataPropsCopy?.ownership]?.label}
            </Typography>
          </span>
        </Grid>
      </Card>
      {returningModal &&
        (dataPropsCopy?.enabledAssignFeature > 0 ||
          !dataPropsCopy?.enabledAssignFeature) && (
          <ReturningLeasedEquipModal
            dataFound={dataPropsCopy}
            setDataPropsCopy={setDataPropsCopy}
            openReturningModal={returningModal}
            setOpenReturningModal={setReturningModal}
          />
        )}
    </Suspense>
  );
};

export default DeviceDescriptionTags;
