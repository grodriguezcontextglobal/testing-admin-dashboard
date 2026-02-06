import { Grid, IconButton, Typography } from "@mui/material";
// import { useMediaQuery } from "@uidotdev/usehooks";
import { Switch, Tooltip } from "antd";
import { lazy, Suspense, useState } from "react";
import Loading from "../../../../components/animation/Loading";
import ViewIcon from "../../../../components/icons/ViewIcon";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
// import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import ModalAllItemsBasedOnGroup from "./ModalAllItemsBasedOnGroup";
import ReusableCardWithHeaderAndFooter from "../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
const ModalAddAndUpdateDeviceSetup = lazy(
  () => import("./ModalAddAndUpdateDeviceSetup"),
);
const CardRendered = ({ props, title, onChange, loadingStatus, database }) => {
  const [openModalDeviceSetup, setOpenModalDeviceSetup] = useState(false);
  const [openModalItemList, setOpenModalItemList] = useState(false);
  // const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  // const isMediumDevice = useMediaQuery(
  //   "only screen and (min-width : 769px) and (max-width : 992px)"
  // );
  const handleOpenModal = () => {
    return setOpenModalDeviceSetup(true);
  };

  const renderingAddInventoryButton = () => {
    return (
      <>
        {props.startingNumber === null && props.endingNumber === null && (
          <div style={{width:"-webkit-fit-content", padding:"0 24px"}}>
            <BlueButtonComponent
              key="allocate-device-type-button"
              title={"Allocate device type to event"}
              func={() => handleOpenModal()}
            />
          </div>
        )}
      </>
    );
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <ReusableCardWithHeaderAndFooter
        title={title}
        actions={[renderingAddInventoryButton()]}
        style={{ with: "100%" }}
      >
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
            <div style={{ display: "flex", gap: "5px" }}>
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
              <Tooltip
                title={"View all serial numbers of this device type"}
                style={{ width: "100%" }}
              >
                <div
                  style={{
                    margin: "0 0 0 15px",
                    display:
                      props.startingNumber !== null &&
                      props.endingNumber !== null
                        ? "flex"
                        : "none",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setOpenModalItemList(true)}
                    sx={{ mr: 1 }}
                  >
                    <ViewIcon />
                  </IconButton>
                </div>
              </Tooltip>
            </div>
          </Grid>
          {props.startingNumber === null && props.endingNumber === null && (
            <Grid
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            ></Grid>
          )}
        </Grid>
      </ReusableCardWithHeaderAndFooter>
      {openModalDeviceSetup && (
        <ModalAddAndUpdateDeviceSetup
          openModalDeviceSetup={openModalDeviceSetup}
          setOpenModalDeviceSetup={setOpenModalDeviceSetup}
          deviceTitle={title}
          quantity={props.quantity}
          category_name={props.item.category}
        />
      )}
      {openModalItemList && props.startingNumber !== null && (
        <ModalAllItemsBasedOnGroup
          openModalItemList={openModalItemList}
          setOpenModalItemList={setOpenModalItemList}
          deviceTitle={title}
          database={database}
        />
      )}
    </Suspense>
  );
};

export default CardRendered;
