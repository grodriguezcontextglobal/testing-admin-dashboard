import { Grid, Typography } from "@mui/material";
import { Title } from "../../../../styles/global/Title";
import Input from "../../../../components/UX/inputs/Input";
// import { Divider } from "antd";
// import ButtonsSearchAndReload from "./ButtonsSearchAndReload";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { useSelector } from "react-redux";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../components/UX/buttons/LigthBlueButton";
const InventorySearchBar = ({
  companyHasInventoryQuery,
  handleSubmit,
  searchItem,
  register,
  adornmentButtonsComponent,
  setValue,
  setParams,
  setSearchedResult,
  // refetchingQueriesFn,
  // locationsQuery,
  setOpenAdvanceSearchModal,
  setOpenCheckInDevicesFromEvent,
  setOpenDeleteItemModal,
  setOpenShippingModal,
}) => {
  const { role, locations } = useSelector((state) => state.permission);
  const { user } = useSelector(state => state.admin)
  const canRenderButton =
    role === "0" ||
    locations?.some(
      (location) =>
        location.actions?.create &&
        location.actions?.assign &&
        location.actions?.delete &&
        location.actions?.transfer,
    );
  return (
    <Grid
      display={companyHasInventoryQuery?.data?.data?.total === 0 && "none"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      item
      xs={12}
      sm={12}
      md={12}
      lg={12}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "0px 0px 1rem 0px",
        }}
      >
        <Typography
          sx={{
            ...Title,
            fontSize: "28px",
            padding: 0,
            textAlign: "left",
            width: {
              xs: "100%",
              sm: "100%",
              md: "50%",
              lg: "50%",
            },
          }}
        >
          Search inventory:&nbsp;
        </Typography>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
          {canRenderButton && (
            <DangerButtonComponent
              title="Delete group"
              func={() => setOpenDeleteItemModal(true)}
            />
          )}
          {canRenderButton && (
            <BlueButtonComponent
              title="Check in devices from events"
              func={() => setOpenCheckInDevicesFromEvent(true)}
            />
          )}
          {user.email === "gars.software.dev@gmail.com" && (
            <LightBlueButtonComponent
              title="Ship out inventory"
              func={() => setOpenShippingModal(true)}
            />
          )}
        </div>
      </div>
      <Grid display={"flex"} spacing={1} container>
        <Grid item xs={12} sm={12} md={8} lg={8}>
          <form
            style={{ width: "100%" }}
            id="search-form"
            onSubmit={handleSubmit(searchItem)}
          >
            <Input
              {...register("searchItem")}
              fullWidth
              placeholder="Search device here"
              endAdornment={adornmentButtonsComponent({
                setValue,
                setParams,
                setSearchedResult,
              })}
            />
          </form>
        </Grid>
        <Grid item xs={12} sm={12} md={4} lg={4}>

          <GrayButtonComponent
            title={"Forecast Inventory"}
            func={() => {
              setOpenAdvanceSearchModal(true);
            }}
            styles={{
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            titleStyles={{
              textTransform: "none",
            }}
          />
        </Grid>
        {/* <Divider /> */}
        {/* <ButtonsSearchAndReload
          setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
          refetchingQueriesFn={refetchingQueriesFn}
          locationsQuery={locationsQuery}
        /> */}
      </Grid>
    </Grid>
  );
};

export default InventorySearchBar;
