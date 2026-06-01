import { Grid, Typography } from "@mui/material";
import { Title } from "../../../../styles/global/Title";
import Input from "../../../../components/UX/inputs/Input";
// import { Divider } from "antd";
// import ButtonsSearchAndReload from "./ButtonsSearchAndReload";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { useSelector } from "react-redux";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
// import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../components/UX/buttons/LigthBlueButton";
import { FilterOptionsContext } from "../../MainPage";
// import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
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
  dataFilterOptions,
  chosenOption,
  setChosenOption,
  optionsUX,
}) => {
  const { role, locations } = useSelector((state) => state.permission);
  const { user } = useSelector(state => state.admin)
  const canRenderButton =
    role === "0" ||
    locations?.every(
      (location) =>
        location.actions?.create &&
        location.actions?.assign &&
        location.actions?.delete &&
        location.actions?.transfer
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
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          margin: "0px 0px 1rem 0px",
          width: "100%",
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
        <div style={{ alignItems: "center", display: "flex", gap: 6, justifyContent: "flex-end" }}>
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
        <Grid gap={3} item xs={12} sm={12} md={3} lg={3}>
          <form
            style={{ width: "100%", margin: "0px 0px 0.4rem 0px" }}
            id="search-form"
            onSubmit={handleSubmit(searchItem)}
          >
            <Input
              {...register("searchItem")}
              fullWidth
              placeholder="Search device here"
              endAdornment={adornmentButtonsComponent({
                setParams,
                setSearchedResult,
                setValue,
              })}
            />
          </form>
          <LightBlueButtonComponent
            title={"Forecast Inventory"}
            func={() => {
              setOpenAdvanceSearchModal(true);
              localStorage.removeItem("searchParameters");
            }}
            styles={{
              width: "100%",
              margin:"0.5rem 0"
            }}
            titleStyles={{
              textTransform: "none",
            }}
          />
          {/* <GrayButtonComponent
            title={"Refresh Tables"}
            func={() => {
              refetchingQueriesFn();
              locationsQuery.refetch();
            }}
            styles={{
              width: "100%",
            }}
            titleStyles={{
              textTransform: "none",
            }}
          /> */}

        </Grid>
        <Grid alignSelf={"flex-start"} item xs={12} sm={12} md={9} lg={9}>
          <FilterOptionsContext.Provider
            value={{
              filterOptions: dataFilterOptions,
              chosen: chosenOption,
              setChosenOption: setChosenOption,
            }}
          >
            {optionsUX}
          </FilterOptionsContext.Provider>

        </Grid>
        {/* <Divider /> */}
      </Grid>
    </Grid>
  );
};

export default InventorySearchBar;
