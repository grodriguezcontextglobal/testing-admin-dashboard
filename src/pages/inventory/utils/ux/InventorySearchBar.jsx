import { Grid, Typography } from "@mui/material";
import { Title } from "../../../../styles/global/Title";
import Input from "../../../../components/UX/inputs/Input";
import { Divider } from "antd";
import ButtonsSearchAndReload from "./ButtonsSearchAndReload";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
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
  setOpenCheckInDevicesFromEvent
}) => {
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
        <BlueButtonComponent title="Check in devices from events" func={()=> setOpenCheckInDevicesFromEvent(true)} />
      </div>
      <Grid justifyContent={"flex-start"} gap={1} container>
        <Grid item xs={12} sm={12} md={12} lg={12}>
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
        <Divider />
        <ButtonsSearchAndReload
          setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
          refetchingQueriesFn={refetchingQueriesFn}
          locationsQuery={locationsQuery}
        />
      </Grid>
    </Grid>
  );
};

export default InventorySearchBar;
