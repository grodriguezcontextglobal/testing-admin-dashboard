import { Grid } from "@mui/material";
<<<<<<< claude/practical-snyder-3e5ec7
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import CalendarCheckIcon from "../../../../components/icons/CalendarCheckIcon";
import RefreshIcon from "../../../../components/icons/RefreshIcon";
=======
// import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
>>>>>>> main

// setOpenAdvanceSearchModal,
// refetchingQueriesFn,
// locationsQuery,
const ButtonsSearchAndReload = () => {
  return (
    <Grid
      display={"flex"}
      justifyContent={"flex-end"}
      gap={1}
      item
      xs={12}
      sm={12}
      md
      lg
      sx={{
        position: "absolute",
        right: 0,
        top: 0,
      }}
    >
<<<<<<< claude/practical-snyder-3e5ec7
      <GrayButtonComponent
        title={"Forecast Inventory"}
        iconLeading={<CalendarCheckIcon />}
        func={() => {
          setOpenAdvanceSearchModal(true);
        }}
        styles={{
          width: "fit-content",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        titleStyles={{
          textTransform: "none",
        }}
      />
      <GrayButtonComponent
        title={"Reload"}
        iconLeading={<RefreshIcon />}
        func={() => {
          refetchingQueriesFn();
          locationsQuery.refetch();
        }}
        styles={{
          width: "fit-content",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        titleStyles={{
          textTransform: "none",
        }}
      />
=======
>>>>>>> main
    </Grid>
  );
};

export default ButtonsSearchAndReload;
