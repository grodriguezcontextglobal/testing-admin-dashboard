import { Grid, Typography } from "@mui/material";
import { Title } from "../../../../styles/global/Title";
import Input from "../../../../components/UX/inputs/Input";
import { Divider } from "antd";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { useSelector } from "react-redux";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import FilterOptionsUX from "../FilterOptionsUX";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import TrashIcon from "../../../../components/icons/TrashIcon";
import CheckSquareBrokenIcon from "../../../../components/icons/CheckSquareBrokenIcon";
const InventorySearchBar = ({
  companyHasInventoryQuery,
  handleSubmit,
  searchItem,
  register,
  adornmentButtonsComponent,
  setValue,
  setParams,
  setSearchedResult,
  refetchingQueriesFn,
  locationsQuery,
  setOpenAdvanceSearchModal,
  setOpenCheckInDevicesFromEvent,
  setOpenDeleteItemModal,
}) => {
  const { role, locations } = useSelector((state) => state.permission);
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
            fontSize: "20px",
            padding: 0,
            textAlign: "left",
            width: {
              xs: "100%",
              sm: "100%",
              md: "50%",
              lg: "50%",
            },
            fontWeight: 600,
            color: "#344054",
          }}
        >
          Search inventory:&nbsp;
        </Typography>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
          {canRenderButton && (
            <GrayButtonComponent
              title="Delete group"
              iconLeading={<TrashIcon />}
              func={() => setOpenDeleteItemModal(true)}
            />
          )}
          {canRenderButton && (
            <BlueButtonComponent
              title="Check in devices from events"
              iconLeading={<CheckSquareBrokenIcon />}
              func={() => setOpenCheckInDevicesFromEvent(true)}
            />
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: "16px",
          width: "100%",
        }}
      >
        <div style={{ flex: "0 0 30%" }}>
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
        </div>
        <div style={{ flex: "0 0 70%", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <FilterOptionsUX setChosen={() => {}} />
        </div>
      </div>
      <Divider />
    </Grid>
  );
};

export default InventorySearchBar;
