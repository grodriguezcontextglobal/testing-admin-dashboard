import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "antd";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Title } from "../../../../styles/global/Title";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";
import StaffTable from "./table/StaffTable";

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
            <Button
              style={{
                display: "flex",
                alignItems: "center",
                outline: "none",
                backgroundColor: "transparent",
              }}
              onClick={() => refreshing()}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={500}
                fontSize={"12px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--blue-dark-700, #004EEB)"}
                padding={"0px 8px"}
              >
                <Icon icon="jam:refresh" /> Refresh
              </Typography>
            </Button>
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
