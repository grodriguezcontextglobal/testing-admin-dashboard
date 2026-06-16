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
import ConsumerStatsSection from "./components/ConsumerStatsSection";
import TablesConsumers from "./tables/TablesConsumers";
import { CreateNewConsumer } from "./utils/CreateNewUser";
import TableHeader from "../../components/UX/TableHeader";

const searchInputStyle = {
  height: "36px",
  padding: "0 12px",
  border: "1px solid var(--gray-300, #D0D5DD)",
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "Inter",
  color: "var(--gray-900, #101828)",
  outline: "none",
  width: "200px",
  background: "#fff",
  boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
};

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
        `/auth/all-consumers-based-on-all-events-per-company/${user.companyData.id}`,
      ),
    enabled: !!user.companyData.id,
    staleTime: 5 * 60 * 1000,
  });

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
      const returnValues = { active: [], inactive: [] };
      if (result.has(true)) returnValues.active = result.get(true);
      if (result.has(false)) returnValues.inactive = [...result.get(false)];
      if (result.has("Lost")) {
        returnValues.inactive = [
          ...returnValues.inactive,
          ...result.get("Lost"),
        ];
      }
      return returnValues;
    },
    [allConsumersBasedOnEventsPerCompany.data],
  );

  useEffect(() => {
    if (allConsumersBasedOnEventsPerCompany.data) {
      setCounting(
        allConsumersBasedOnEventsPerCompany?.data?.data?.result?.totalConsumers || 0,
      );
      setConsumersList(allConsumersBasedOnEventsPerCompany?.data?.data);
    } else {
      setCounting(0);
    }
  }, [allConsumersBasedOnEventsPerCompany.data]);

  const hasConsumers = counting > 0;

  return (
    <Grid container sx={{ padding: "5px" }}>
      {/* Header */}
      <Grid item xs={12}>
        <ConsumerHeader setCreateUserButton={setCreateUserButton} />
      </Grid>

      {/* Quick glance — solo cuando hay consumidores */}
      {hasConsumers && (
        <Grid item xs={12}>
          <ConsumerStatsSection data={allConsumersBasedOnEventsPerCompany.data} />
        </Grid>
      )}

      {/* Table section */}
      <Grid
        item
        xs={12}
        sx={{
          display: hasConsumers ? "flex" : "none",
          flexDirection: "column",
          gap: 1,
          marginY: 2,
        }}
      >
        <TableHeader
          leftCta={
            <p
              style={{
                ...TextFontsize18LineHeight28,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                color: "var(--gray-900, #101828)",
                padding: "12px",
                textTransform: "none",
                textAlign: "left",
              }}
            >
              Consumers&nbsp;
              <span
                style={{
                  borderRadius: "16px",
                  background: "var(--blue-dark-50, #EFF4FF)",
                  mixBlendMode: "multiply",
                  padding: "0px 8px",
                  fontWeight: 500,
                  fontSize: "12px",
                  fontFamily: "Inter",
                  lineHeight: "28px",
                  color: "var(--blue-dark-700, #004EEB)",
                }}
              >
                {counting} total
              </span>
            </p>
          }
          rightCta={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 8px",
              }}
            >
              <input
                {...register("searchEvent")}
                type="text"
                placeholder="Search consumer here"
                style={searchInputStyle}
              />
              <RefreshButton
                propsFn={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["allConsumersBasedOnEventsPerCompany"],
                  });
                  allConsumersBasedOnEventsPerCompany.refetch();
                }}
              />
            </div>
          }
        />
        <div>
          {allConsumersBasedOnEventsPerCompany.isLoading ? (
            <Loading />
          ) : (
            <TablesConsumers
              key={componentLocator}
              getCounting={counting}
              searching={searching}
              getActiveAndInactiveCount={renderActiveAndInactiveCount}
              data={consumersList}
              statePage={null}
            />
          )}
        </div>
      </Grid>

      {/* Empty state */}
      <Grid
        item
        xs={12}
        sx={{
          display: counting < 1 ? "flex" : "none",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
        }}
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
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <BlueButtonComponent
            func={() => setCreateUserButton(true)}
            title={"Add new consumer"}
            icon={<WhiteCirclePlusIcon />}
          />
        </div>
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
