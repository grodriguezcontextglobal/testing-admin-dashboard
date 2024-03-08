import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { Button } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerDatabase } from "./table/CustomerDatabase";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { MagnifyIcon } from "../../../../components/icons/Icons";
import { Title } from "../../../../styles/global/Title";

const CustomerInformationSection = () => {
  const { register, watch} = useForm();
  const queryClient = useQueryClient()
 
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
          display={'flex'}
          justifyContent={'flex-start'}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Typography style={{ ...Title, fontSize: "28px", padding: 0, width: "fit-content" }}>Search consumers:&nbsp;</Typography>
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
          justifyContent={'space-between'}
          alignItems={"center"}
          marginBottom={-2}
          paddingBottom={-2}
          item
          xs={12}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            marginRight: "5px"
          }}>
            <Button style={{ display: "flex", alignItems: "center" }} onClick={() => queryClient.invalidateQueries('listOfAttendees')}>
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
          <CustomerDatabase searchAttendees={watch("searchEvent")} />
        </Grid>
      </Grid>
    </>
  )
}

export default CustomerInformationSection