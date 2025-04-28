import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { Button, Divider } from "antd";
import { MagnifyIcon } from "../../../components/icons/MagnifyIcon";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import ChartComponent from "./UI/ChartComponent";

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
        <Grid item xs={12} sm={12} md={6} lg={6}>
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
          display={"flex"}
          alignItems={"center"}
          gap={1}
          sx={{
            margin: {
              xs: "0.5rem 0",
              sm: "0.5rem 0",
            },
            justifyContent: {
              xs: "flex-start",
              sm: "flex-start",
              md: "flex-end",
              lg: "flex-end",
            },
          }}
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
        >
          <Button onClick={() => setCreateUserButton(true)} style={BlueButton}>
            <Typography textTransform={"none"} style={BlueButtonText}>
              <WhiteCirclePlusIcon />
              &nbsp;Add new consumer
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
        <ChartComponent
          allConsumersBasedOnEventsPerCompany={
            allConsumersBasedOnEventsPerCompany
          }
        />
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
