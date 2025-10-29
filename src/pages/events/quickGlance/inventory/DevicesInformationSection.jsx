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

const DevicesInformationSection = (dataToRenderInComponent) => {
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const queryClient = useQueryClient();
  const handleRefreshingData = async () => {
    await clearCacheMemory(
      `eventSelected=${event.id}&company=${user.companyData.id}`
    );
    await clearCacheMemory(
      `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
    );

    return queryClient.invalidateQueries({ queryKey: "deviceInPoolList" });
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
            <RefreshButton propsFn={handleRefreshingData} />
          </div>
        </Grid>
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
