import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { MagnifyIcon } from "../../../components/icons/MagnifyIcon";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { Button, Divider } from "antd";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import RenderingConsumersChartsBehavior from "./RenderingConsumersChartsBehavior";
import { Subtitle } from "../../../styles/global/Subtitle";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { BlueButton } from "../../../styles/global/BlueButton";
import { Icon } from "@iconify/react/dist/iconify.js";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";

const ConsumerHeader = ({
  setCreateUserButton,
  counting,
  allConsumersBasedOnEventsPerCompany,
  register,
}) => {
  return (
    <>
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
      >
        <Grid item xs={6}>
          <Typography
            textTransform={"none"}
            style={{
              ...TextFontSize30LineHeight38,
              textAlign: "left",
            }}
          >
            Consumers
          </Typography>
        </Grid>
        <Grid
          textAlign={"right"}
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          gap={1}
          item
          xs={6}
        >
          <Button onClick={() => setCreateUserButton(true)} style={BlueButton}>
            <Icon
              icon="ic:baseline-plus"
              color="var(--base-white, #FFF"
              width={20}
              height={20}
            />
            &nbsp;
            <Typography textTransform={"none"} style={BlueButtonText}>
              Add new consumer
            </Typography>
          </Button>
        </Grid>
      </Grid>
      <Divider />
      <Grid
        display={`${counting > 0 ? "flex" : "none"}`}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          textAlign={"right"}
          flexDirection={"column"}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontsize18LineHeight28,
              textAlign: "left",
              width: "100%",
              color: " var(--Base-Black, #000)",
            }}
          >
            Quick glance
          </p>
          <p style={{ ...Subtitle, textAlign: "left", width: "100%" }}>
            Here are all the categories of devices within your inventory, and a
            quick glance at devices locations.
          </p>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          // overflow={"hidden"}
          gap={2}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Grid
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignSelf: "flex-start",
            }}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            {" "}
            <RenderingConsumersChartsBehavior
              active={{
                title: "Active",
                number:
                  allConsumersBasedOnEventsPerCompany?.data?.data?.result
                    ?.activeTransactions ?? 0,
              }}
              inactive={{
                title: "Inactive",
                number:
                  allConsumersBasedOnEventsPerCompany?.data?.data?.result
                    ?.inactiveTransactions ?? 0,
              }}
              props={{
                title: "General activity",
                description:
                  "Active consumers refers to those users currently holding one or more devices.", // from the database
                total:
                  allConsumersBasedOnEventsPerCompany?.data?.data?.result
                    ?.total ?? 0,
              }}
            />
          </Grid>
          <Grid
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignSelf: "flex-start",
            }}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            {" "}
            <RenderingConsumersChartsBehavior
              active={{
                title: "Event",
                number:
                  allConsumersBasedOnEventsPerCompany?.data?.data?.result
                    ?.totalConsumersFromEvents ?? 0,
              }}
              inactive={{
                title: "General",
                number:
                  allConsumersBasedOnEventsPerCompany?.data?.data?.result
                    ?.lease ?? 0,
              }}
              props={{
                title: "Consumer origin",
                description:
                  "Consumers from an event typically spend a shorter time with your devices.",
                total:
                  Number(
                    allConsumersBasedOnEventsPerCompany?.data?.data?.result
                      ?.totalConsumersFromEvents ?? 0
                  ) +
                  Number(
                    allConsumersBasedOnEventsPerCompany?.data?.data?.result
                      ?.lease ?? 0
                  ),
              }}
            />
          </Grid>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontsize18LineHeight28,
              color: "var(--gray900)",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "fit-content",
            }}
          >
            All consumers&nbsp;
          </p>
        </Grid>
        <Divider style={{ margin: "20px 0 24px" }} />
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "fit-content",
            }}
          >
            Search consumers:&nbsp;
          </p>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searchEvent")}
              style={{ ...OutlinedInputStyle }}
              fullWidth
              placeholder="Search consumer here"
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default ConsumerHeader;
