/* eslint-disable no-unused-vars */
import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, Spin } from "antd";
import { useCallback, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import { MagnifyIcon } from "../../components/icons/MagnifyIcon";
import BannerMsg from "../../components/utils/BannerMsg";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { GrayButton } from "../../styles/global/GrayButton";
import GrayButtonText from "../../styles/global/GrayButtonText";
import "../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import RenderingConsumersChartsBehavior from "./components/RenderingConsumersChartsBehavior";
import TablesConsumers from "./tables/TablesConsumers";
import { CreateNewConsumer } from "./utils/CreateNewUser";
import Loading from "../../components/animation/Loading";
const MainPage = () => {
  const [createUserButton, setCreateUserButton] = useState(false);
  const [counting, setCounting] = useState(null);
  const [consumersList, setConsumersList] = useState([]);
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const searching = watch("searchEvent");
  const allConsumersBasedOnEventsPerCompany = useQuery({
    queryKey: ["allConsumersBasedOnEventsPerCompany"],
    queryFn: () =>
      devitrakApi.get(
        `/auth/all-consumers-based-on-all-events-per-company/${user.companyData.id}`
      ),
  });

  useEffect(() => {
    const controller = new AbortController();
    allConsumersBasedOnEventsPerCompany.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const componentLocator = useId();

  const renderActiveAndInactiveCount = useCallback(
    (props) => {
      const result = new Map();
      if (Array.isArray(props)) {
        for (let data of props) {
          data.currentActivity.map((item) => {
            if (!result.has(item.device.status)) {
              result.set(item.device.status, [item.device]);
            } else {
              result.set(item.device.status, [
                ...result.get(item.device.status),
                item.device,
              ]);
            }
          });
        }
      }
      const returnValues = {
        active: [],
        inactive: [],
      };

      if (result.has(true)) {
        returnValues.active = result.get(true);
      }
      if (result.has(false)) {
        returnValues.inactive = [...result.get(false)];
      }
      if (result.has("Lost")) {
        const lost = [...returnValues.inactive, ...result.get("Lost")];
        returnValues.inactive = [...lost];
      }
      return returnValues;
    },
    [allConsumersBasedOnEventsPerCompany.data]
  );

  useEffect(() => {
    if (allConsumersBasedOnEventsPerCompany.data) {
      setCounting(
        allConsumersBasedOnEventsPerCompany.data.data.result.totalConsumers
      );
      setConsumersList(allConsumersBasedOnEventsPerCompany.data.data);
    } else {
      setCounting(0);
    }
  }, [allConsumersBasedOnEventsPerCompany.data]);

  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
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
      <Grid
        marginY={3}
        display={`${counting > 0 ? "flex" : "none"}`}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          border={"1px solid var(--gray-200, #eaecf0)"}
          borderRadius={"12px 12px 0 0"}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          marginBottom={-2}
          paddingBottom={-2}
          item
          xs={12}
        >
          <p
            style={{
              ...TextFontsize18LineHeight28,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              color: "var(--gray-900, #101828)",
              padding: "24px",
              textTransform: "none",
              textAlign: "left",
            }}
          >
            {" "}
            Consumers&nbsp;
            <div
              style={{
                borderRadius: "16px",
                background: "var(--blue-dark-50, #EFF4FF)",
                mixBlendMode: "multiply",
                width: "fit-content",
                height: "fit-content",
              }}
            >
              <p
                style={{
                  textTransform: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: "12px",
                  fontFamily: "Inter",
                  lineHeight: "28px",
                  color: "var(--blue-dark-700, #004EEB)",
                  padding: "0px 8px",
                }}
              >
                {counting} total
              </p>
            </div>
          </p>
          <Button
            style={{
              ...GrayButton,
              ...CenteringGrid,
              height: "fit-content",
              margin: "15px 10px",
            }}
            onClick={() => allConsumersBasedOnEventsPerCompany.refetch()}
          >
            <p
              style={{
                ...GrayButtonText,
                textTransform: "none",
                fontWeight: 500,
                fontSize: "12px",
                color: "var(--blue-dark-700, #004EEB)",
                padding: "0px 8px",
              }}
            >
              <Icon icon="jam:refresh" />
              &nbsp;Refresh
            </p>
          </Button>
        </Grid>
        <Grid item xs={12}>
          <TablesConsumers
            key={componentLocator}
            getCounting={counting}
            searching={searching}
            getActiveAndInactiveCount={renderActiveAndInactiveCount}
            data={consumersList}
            statePage={null}
          />
        </Grid>
      </Grid>
      <Grid
        textAlign={"right"}
        display={`${counting < 1 ? "flex" : "none"}`}
        flexDirection={"column"}
        justifyContent={"center"}
        alignItems={"center"}
        gap={1}
        item
        xs={12}
        sm={12}
        md={10}
        lg={10}
      >
        <BannerMsg
          props={{
            title: "Add consumers",
            message:
              "Consumers are users that will use the devices you provide with an intent to be returned. They can include ",
            link: "?",
            button: { display: "none" },
            paragraphStyle: { display: "none" },
            paragraphText: "Add new consumer",
          }}
        />
        <Grid
          textAlign={"right"}
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          margin={"-10px 0 0 0"}
          gap={1}
          item
          xs={12}
          sm={12}
          md={10}
          lg={10}
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
      {createUserButton && (
        <CreateNewConsumer
          createUserButton={createUserButton}
          setCreateUserButton={setCreateUserButton}
        />
      )}
      {(counting === null || allConsumersBasedOnEventsPerCompany.isLoading) && (
        <Spin indicator={<Loading />} fullscreen />
      )}
    </Grid>
  );
};

export default MainPage;
