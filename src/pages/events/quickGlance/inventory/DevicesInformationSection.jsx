import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import RefreshButton from "../../../../components/utils/UX/RefreshButton";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Title } from "../../../../styles/global/Title";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";
import DeviceDatabase from "./table/DeviceDatabase";
import {
  EVENT_DEVICE_QUERY_KEYS,
  eventCacheKeys,
} from "./utils/eventInventoryRefresh";

const DevicesInformationSection = (dataToRenderInComponent) => {
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const queryClient = useQueryClient();
  const handleRefreshingData = async () => {
    // The keys are independent literals, so clear them concurrently. Which
    // keys, and why, is in eventInventoryRefresh -- it is not readable from
    // here, and this handler had it wrong in three separate ways.
    await Promise.all(
      eventCacheKeys({
        eventId: event?.id,
        eventName: event?.eventInfoDetail?.eventName,
        companyId: user?.companyData?.id,
      }).map(clearCacheMemory)
    );

    // Letting go of the server's copy is only half of a refresh: the browser
    // has its own, and the table above this button reads it.
    return Promise.all(
      EVENT_DEVICE_QUERY_KEYS.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      )
    );
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
            Search inventory:&nbsp;
          </Typography>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searchDevice")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search device here"
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
        <RefreshButton propsFn={handleRefreshingData} />
        <Grid item xs={12}>
          <DeviceDatabase
            searchDevice={watch("searchDevice")}
            eventInventoryData={dataToRenderInComponent}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default DevicesInformationSection;
