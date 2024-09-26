import { lazy, Suspense, useState } from "react";
import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card, Switch, Tooltip } from "antd";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { DropDownIcon } from "../../../../components/icons/Icons";
const ModalAddAndUpdateDeviceSetup = lazy(() =>
  import("./ModalAddAndUpdateDeviceSetup")
);
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import Loading from "../../../../components/animation/Loading";
const CardRendered = ({ props, title, onChange, loadingStatus }) => {
  const [openModalDeviceSetup, setOpenModalDeviceSetup] = useState(false);
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const handleOpenModal = () => {
    return setOpenModalDeviceSetup(true);
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Grid padding={"0 0 10px"} item xs={12}>
        <Card
          style={{
            borderRadius: "12px",
            border: "1px solid var(--gray-200, #EAECF0)",
            background: "var(--base-white, #FFF)",
            boxShadow:
              "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
            cursor: "pointer",
          }}
        >
          <Grid
            display={"flex"}
            justifyContent={"space-around"}
            alignItems={"center"}
            container
          >
            <Grid
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography
                textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
                style={{ ...Subtitle, textWrap: "nowrap" }}
              >
                {title}&nbsp;
              </Typography>
              <Tooltip title="Add range of serial number for this type.">
                <p onClick={() => handleOpenModal()}>
                  <DropDownIcon />
                </p>
              </Tooltip>
            </Grid>
          </Grid>
          <Grid container>
            <Grid
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <Typography paddingTop={"8px"} style={TextFontSize30LineHeight38}>
                {props.quantity}
              </Typography>
              <Tooltip
                title={`${
                  props.consumerUses ? "For consumers." : "For internal use."
                }`}
                style={{ width: "100%" }}
              >
                <div style={{ margin: "0 0 0 15px" }}>
                  <Switch
                    checked={props.consumerUses}
                    loading={loadingStatus}
                    onChange={onChange}
                  />
                </div>
              </Tooltip>
            </Grid>
          </Grid>
        </Card>
      </Grid>
      {openModalDeviceSetup && (
        <ModalAddAndUpdateDeviceSetup
          openModalDeviceSetup={openModalDeviceSetup}
          setOpenModalDeviceSetup={setOpenModalDeviceSetup}
          deviceTitle={title}
          quantity={props.quantity}
        />
      )}
    </Suspense>
  );
};

export default CardRendered;
