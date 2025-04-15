import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Space, Tag, Tooltip } from "antd";
import { useForm } from "react-hook-form";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import RefreshButton from "../../../../components/utils/UX/RefreshButton";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize14LineHeight20 } from "../../../../styles/global/TextFontSize14LineHeight20";
import { Title } from "../../../../styles/global/Title";
import { CustomerDatabase } from "./table/CustomerDatabase";

const CustomerInformationSection = () => {
  const { register, watch } = useForm();
  const queryClient = useQueryClient();

  const styleDic = {
    0: {
      backgroundColor: "#dad7d7",
      color: "#262424",
      text: "No devices",
      description: "No devices assigned",
    },
    1: {
      backgroundColor: "#FFF4ED",
      color: "#B93815",
      text: "Devices pending",
      description: "Devices in use but also some returned",
    },
    2: {
      backgroundColor: "#ECFDF3",
      color: "#027A48",
      text: "Devices in use",
      description: "All devices of all transactions are in use",
    },
    3: {
      backgroundColor: "#EFF8FF",
      color: "#175CD3",
      text: "Devices returned",
      description: "All devices of all transactions are returned",
    },
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
            Search consumers:&nbsp;
          </Typography>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searchCustomer")}
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
        marginY={5}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid>
          <Space>
            {new Array(4).fill(0).map((_, index) => (
              <Tooltip key={index} title={styleDic[index].description}>
                <Tag
                  color={styleDic[index].backgroundColor}
                  style={{
                    ...TextFontSize14LineHeight20,
                    letterSpacing:"0.00938em",
                    fontWeight: 500,
                    color: styleDic[index].color,
                    borderRadius: "16px",
                    padding: "2px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:"flex-start"
                  }}
                >
                  <p style={{ color: styleDic[index].color }}>
                    {styleDic[index].text}
                  </p>
                </Tag>
              </Tooltip>
            ))}
          </Space>
        </Grid>
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
            <RefreshButton propsFn={queryClient.invalidateQueries} /> 
          </div>
        </Grid>
        <Grid item xs={12}>
          <CustomerDatabase searchAttendees={watch("searchCustomer")} />
        </Grid>
      </Grid>
    </>
  );
};

export default CustomerInformationSection;


{/* <Button
style={{
  display: "flex",
  alignItems: "center",
  outline: "none",
  backgroundColor: "transparent",
}}
onClick={() => queryClient.invalidateQueries("listOfAttendees")}
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
</Button> */}
