/* eslint-disable no-unused-vars */
import { Grid } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Spin } from "antd";
import { useCallback, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import Loading from "../../components/animation/Loading";
import { WhiteCirclePlusIcon } from "../../components/icons/WhiteCirclePlusIcon";
import BannerMsg from "../../components/utils/BannerMsg";
import RefreshButton from "../../components/utils/UX/RefreshButton";
import "../../styles/global/OutlineInput.css";
import TextFontsize18LineHeight28 from "../../styles/global/TextFontSize18LineHeight28";
import ConsumerHeader from "./components/ConsumerHeader";
import TablesConsumers from "./tables/TablesConsumers";
import { CreateNewConsumer } from "./utils/CreateNewUser";
const MainPage = () => {
  const [createUserButton, setCreateUserButton] = useState(false);
  const [counting, setCounting] = useState(null);
  const [consumersList, setConsumersList] = useState([]);
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const searching = watch("searchEvent");
  const queryClient = useQueryClient();
  const allConsumersBasedOnEventsPerCompany = useQuery({
    queryKey: ["allConsumersBasedOnEventsPerCompany"],
    queryFn: () =>
      devitrakApi.get(
        `/auth/all-consumers-based-on-all-events-per-company/${user.companyData.id}`
      ),
    enabled: !!user.companyData.id,
    staleTime: 5 * 60 * 1000,
  });

  // useEffect(() => {
  //   const controller = new AbortController();
  //   allConsumersBasedOnEventsPerCompany.refetch();
  //   return () => {
  //     controller.abort();
  //   };
  // }, []);

  const componentLocator = useId();

  const renderActiveAndInactiveCount = useCallback(
    (props) => {
      const result = new Map();
      if (Array.isArray(props)) {
        for (let data of props) {
          data.currentActivity?.map((item) => {
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
      <ConsumerHeader
        setCreateUserButton={setCreateUserButton}
        counting={counting}
        allConsumersBasedOnEventsPerCompany={
          allConsumersBasedOnEventsPerCompany
        }
        register={register}
      />
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
          <RefreshButton
            propsFn={() => {
              // Invalidate and refetch to bypass staleTime and pull fresh data
              queryClient.invalidateQueries({
                queryKey: ["allConsumersBasedOnEventsPerCompany"],
              });
              allConsumersBasedOnEventsPerCompany.refetch();
            }}
          />
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
          <BlueButtonComponent
            func={() => setCreateUserButton(true)}
            title={"Add new consumer"}
            icon={<WhiteCirclePlusIcon />}
          />
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
