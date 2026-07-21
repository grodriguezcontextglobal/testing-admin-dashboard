import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Title } from "../../../../styles/global/Title";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";
import StaffTable from "./table/StaffTable";
import TextLink from "../../../../components/UX/buttons/TextLink";

const StaffMainPage = () => {
  const { event } = useSelector((state) => state.event);
  const { register, watch } = useForm();
  const queryClient = useQueryClient();
  const refreshing = () => {
    clearCacheMemory(`event_staff_info=${event.id}`);
    return queryClient.invalidateQueries("newEndpointQuery");
  };
  return (
    <>
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Typography
            style={{
              ...Title,
              fontSize: "28px",
              padding: 0,
              width: "fit-content",
            }}
          >
            Search staff:&nbsp;
          </Typography>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searchStaff")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search staff here"
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid
        marginY={3}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          border={"1px solid var(--gray-200, #eaecf0)"}
          borderRadius={"12px 12px 0 0"}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          marginBottom={-2}
          paddingBottom={-2}
          item
          xs={12}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: "5px",
            }}
          >
            <TextLink color="brand" onClick={() => refreshing()}>
              Refresh
            </TextLink>
          </div>
        </Grid>

        <Grid item xs={12}>
          <StaffTable searching={watch("searchStaff")} />
        </Grid>
      </Grid>
    </>
  );
};

export default StaffMainPage;
